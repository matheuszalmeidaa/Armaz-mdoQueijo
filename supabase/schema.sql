-- ============================================================
-- ARMAZÉM DO QUEIJO — Espinha (fonte única da verdade)
-- Postgres / Supabase
--
-- Princípios:
--  * Tudo é carimbado por loja (multi-loja desde o dia 1).
--  * Estoque = saldo por produto POR LOJA, rastreado por lotes com validade.
--  * Toda entrada/saída passa por `movimentacoes` (o "porquê" do estoque).
--  * Toda venda (PDV ou delivery) cai em `vendas`/`itens_venda`.
--  * KPIs (mais vendido por época, cliente inativo, perda) são CONSULTAS,
--    não tabelas — por isso a espinha vem primeiro.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Lojas ----------
create table lojas (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  aberta       boolean not null default true,
  criado_em    timestamptz not null default now()
);

-- ---------- Produtos (catálogo único: PDV + delivery) ----------
-- Dois modos de precificação:
--   'unidade' -> preço fixo por item (usa preco_venda)
--   'peso'    -> preço por kg; cliente escolhe um preset (pesos_sugeridos)
--                e o sistema calcula. Desconto por volume vem de faixas_preco.
create type tipo_preco as enum ('unidade', 'peso');

create table produtos (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  descricao      text,
  categoria      text,                       -- Queijos, Doces, Vinho, Mel, Charcutaria...
  codigo_barras  text unique,                -- para o scanner (fase futura)
  tipo_preco     tipo_preco not null default 'unidade',
  preco_venda    numeric(10,2),              -- usado quando tipo_preco = 'unidade'
  preco_por_kg   numeric(10,2),              -- preço base quando tipo_preco = 'peso'
  -- Presets em GRAMAS que o cliente toca (não digita peso livre)
  pesos_sugeridos integer[] not null default '{200,300,400,500}',
  foto_url       text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- ---------- Faixas de preço por volume (desconto que sobe o ticket) ----------
-- Poucas faixas por produto. Ex.: 200g→410/kg, 500g→385/kg, 1000g→360/kg.
-- O preço/kg aplicado é o da maior faixa cujo peso_min_g <= peso escolhido.
create table faixas_preco (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id) on delete cascade,
  peso_min_g   integer not null,             -- vale a partir deste peso
  preco_por_kg numeric(10,2) not null,
  unique (produto_id, peso_min_g)
);
create index idx_faixas_produto on faixas_preco (produto_id, peso_min_g);

-- ---------- Lotes de estoque (por produto, por loja, com validade) ----------
-- O saldo de um produto numa loja é a soma dos saldos dos seus lotes ativos.
create table lotes (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id) on delete cascade,
  loja_id      uuid not null references lojas(id) on delete cascade,
  quantidade   numeric(10,3) not null default 0, -- saldo atual do lote
  custo_unit   numeric(10,2),                     -- para margem e valor de perda
  validade     date,                              -- alerta de vencimento
  criado_em    timestamptz not null default now()
);
create index idx_lotes_produto_loja on lotes (produto_id, loja_id);
create index idx_lotes_validade on lotes (validade);

-- ---------- Movimentações (todo entra/sai do estoque) ----------
create type tipo_movimentacao as enum ('entrada', 'venda', 'perda', 'ajuste', 'transferencia');

create table movimentacoes (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id),
  loja_id      uuid not null references lojas(id),
  lote_id      uuid references lotes(id),
  tipo         tipo_movimentacao not null,
  quantidade   numeric(10,3) not null,   -- + entrada, - saída
  motivo       text,                     -- ex.: 'vencido', 'quebra', 'compra NF 123'
  venda_id     uuid,                     -- preenchido quando tipo = 'venda'
  criado_em    timestamptz not null default now()
);
create index idx_mov_produto_data on movimentacoes (produto_id, criado_em);
create index idx_mov_loja_tipo on movimentacoes (loja_id, tipo);

-- ---------- Clientes ----------
create table clientes (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  telefone     text,
  endereco     text,
  criado_em    timestamptz not null default now()
);
create index idx_clientes_telefone on clientes (telefone);

-- ---------- Vendas ----------
create type canal_venda as enum ('pdv', 'delivery');
create type forma_pagamento as enum ('dinheiro', 'pix', 'debito', 'credito', 'outro');
create type status_venda as enum (
  'aberta', 'paga', 'em_preparo', 'em_rota', 'concluida', 'cancelada'
);

create table vendas (
  id           uuid primary key default gen_random_uuid(),
  loja_id      uuid not null references lojas(id),
  cliente_id   uuid references clientes(id),
  canal        canal_venda not null default 'pdv',
  status       status_venda not null default 'paga',
  pagamento    forma_pagamento,
  total        numeric(10,2) not null default 0,
  -- Suporte a offline: id gerado no dispositivo para deduplicar na sincronização
  id_local     text unique,
  criado_em    timestamptz not null default now()
);
create index idx_vendas_loja_data on vendas (loja_id, criado_em);
create index idx_vendas_canal on vendas (canal);

create table itens_venda (
  id             uuid primary key default gen_random_uuid(),
  venda_id       uuid not null references vendas(id) on delete cascade,
  produto_id     uuid not null references produtos(id),
  quantidade     numeric(10,3) not null default 1, -- itens por unidade
  -- Produtos por peso: cliente escolhe o preset (estimado); balança grava o real.
  peso_estimado_g integer,                  -- preset escolhido no pedido
  peso_real_g     integer,                  -- pesado ao cortar/embalar (PDV/expedição)
  preco_unit     numeric(10,2) not null,    -- preço/un OU preço/kg congelado na venda
  subtotal       numeric(10,2) not null
);
create index idx_itens_venda on itens_venda (venda_id);
create index idx_itens_produto on itens_venda (produto_id);

-- ============================================================
-- VISTAS DE APOIO (os "indicadores" nascem daqui)
-- ============================================================

-- Saldo consolidado por produto e loja (resolve "o que tem na outra loja")
create view estoque_atual as
select
  l.produto_id,
  l.loja_id,
  sum(l.quantidade) as saldo,
  min(l.validade) filter (where l.quantidade > 0) as proxima_validade
from lotes l
group by l.produto_id, l.loja_id;

-- Lotes vencendo nos próximos 7 dias (alerta de validade)
create view alerta_validade as
select
  lt.id as lote_id, lt.produto_id, p.nome as produto, lt.loja_id,
  lt.quantidade, lt.validade,
  (lt.validade - current_date) as dias_para_vencer
from lotes lt
join produtos p on p.id = lt.produto_id
where lt.quantidade > 0
  and lt.validade is not null
  and lt.validade <= current_date + interval '7 days'
order by lt.validade asc;
