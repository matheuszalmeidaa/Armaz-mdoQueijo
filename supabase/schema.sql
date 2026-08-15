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
--
-- POLÍTICA DE EXCLUSÃO (decisão do projeto): "nunca apaga, desativa".
--  * Entidades de negócio (produtos, clientes, lojas) usam SOFT DELETE
--    (coluna `ativo`/`ativa`). Somem da tela, mas o histórico fica intacto —
--    e no dia a dia nada trava por constraint (você não deleta, desativa).
--  * ON DELETE CASCADE só em FILHO PURO, que não existe sem o pai e é
--    apagado junto (faixas_preco de um produto, itens de uma venda, variantes,
--    config da loja).
--  * Referências que guardam HISTÓRICO (lotes, movimentacoes, vendas,
--    itens_venda -> produtos/lojas/clientes) usam ON DELETE RESTRICT: são o
--    guarda-costas do histórico financeiro.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Lojas ----------
create table lojas (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  aberta       boolean not null default true,   -- aberta AGORA (operacional)
  ativa        boolean not null default true,    -- soft delete (loja arquivada)
  arquivada_em timestamptz,
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
  video_url      text,                       -- vídeo do produto (URL)
  vinculado_id   uuid references produtos(id) on delete set null, -- "Vai bem com"
  ativo          boolean not null default true, -- soft delete
  arquivado_em   timestamptz,
  criado_em      timestamptz not null default now()
);

-- ---------- Variantes de produto (kit, tamanho, sabor) ----------
-- Filho puro do produto: apaga junto (cascade). Preço só vale p/ 'unidade'.
create table variantes (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id) on delete cascade,
  nome         text not null,
  preco        numeric(10,2),
  descricao    text,
  foto_url     text,
  ativo        boolean not null default true,
  criado_em    timestamptz not null default now()
);
create index idx_variantes_produto on variantes (produto_id);

-- ---------- Faixas de preço por volume (desconto que sobe o ticket) ----------
-- Poucas faixas por produto. Ex.: 200g→410/kg, 500g→385/kg, 1000g→360/kg.
-- Filho puro do produto (cascade).
create table faixas_preco (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id) on delete cascade,
  peso_min_g   integer not null,             -- vale a partir deste peso
  preco_por_kg numeric(10,2) not null,
  unique (produto_id, peso_min_g)
);
create index idx_faixas_produto on faixas_preco (produto_id, peso_min_g);

-- ---------- Lotes de estoque (por produto, por loja, com validade) ----------
-- Guarda histórico de estoque -> RESTRICT (não some por acidente).
create table lotes (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id) on delete restrict,
  loja_id      uuid not null references lojas(id) on delete restrict,
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
  produto_id   uuid not null references produtos(id) on delete restrict,
  loja_id      uuid not null references lojas(id) on delete restrict,
  lote_id      uuid references lotes(id) on delete restrict,
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
  ativo        boolean not null default true, -- soft delete
  arquivado_em timestamptz,
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
  loja_id      uuid not null references lojas(id) on delete restrict,
  cliente_id   uuid references clientes(id) on delete restrict,
  canal        canal_venda not null default 'pdv',
  status       status_venda not null default 'paga',
  pagamento    forma_pagamento,
  total        numeric(10,2) not null default 0,
  agendado     boolean not null default false,  -- pedido feito com a loja fechada
  agendado_para timestamptz,                    -- horário combinado (opcional)
  -- Suporte a offline: id gerado no dispositivo para deduplicar na sincronização
  id_local     text unique,
  criado_em    timestamptz not null default now()
);
create index idx_vendas_loja_data on vendas (loja_id, criado_em);
create index idx_vendas_canal on vendas (canal);

create table itens_venda (
  id             uuid primary key default gen_random_uuid(),
  venda_id       uuid not null references vendas(id) on delete cascade,
  produto_id     uuid not null references produtos(id) on delete restrict,
  variante_id    uuid references variantes(id) on delete set null,
  quantidade     numeric(10,3) not null default 1, -- itens por unidade
  -- Produtos por peso: cliente escolhe o preset (estimado); balança grava o real.
  peso_estimado_g integer,                  -- preset escolhido no pedido
  peso_real_g     integer,                  -- pesado ao cortar/embalar (PDV/expedição)
  preco_unit     numeric(10,2) not null,    -- preço/un OU preço/kg congelado na venda
  subtotal       numeric(10,2) not null
);
create index idx_itens_venda on itens_venda (venda_id);
create index idx_itens_produto on itens_venda (produto_id);

-- ---------- Configurações da loja (regras editáveis) ----------
-- Uma linha por loja. Espelha o `lib/config-store.ts` do app; arrays/objetos
-- (cupons, horários, exceções, redes) ficam em jsonb. Config é filho puro da
-- loja (cascade).
create table configuracoes_loja (
  loja_id            uuid primary key references lojas(id) on delete cascade,
  taxa_entrega       numeric(10,2) not null default 15,
  desconto_pix       numeric(4,3) not null default 0.05,   -- fração 0..1
  tempo_min          integer not null default 45,
  tempo_max          integer not null default 60,
  tolerancia_corte   integer not null default 10,          -- %
  cashback_ativo     boolean not null default true,
  cashback_percent   numeric(4,3) not null default 0.03,
  pedido_minimo      numeric(10,2) not null default 0,
  pix_chave          text default '',
  whatsapp           text default '',
  aceita_pedidos     boolean not null default true,
  entrega_ativa      boolean not null default true,
  retirada_ativa     boolean not null default true,
  agendamento_ativo  boolean not null default false,
  hero_img           text default '',
  hero_tag           text default '',
  hero_titulo        text default '',
  redes              jsonb not null default '{}'::jsonb,     -- {instagram,facebook,whatsapp}
  horarios           jsonb not null default '[]'::jsonb,     -- 7 dias {aberto,abre,fecha}
  excecoes           jsonb not null default '[]'::jsonb,     -- dias personalizados
  cupons             jsonb not null default '[]'::jsonb,     -- lista de cupons
  atualizado_em      timestamptz not null default now()
);

-- ---------- Config do app (uma linha, JSON) ----------
-- Config da loja (telefone, horários, taxa, Pix, redes, cupons, hero...) numa
-- única linha em JSON, para bater entre aparelhos sem depender de Auth/multi-loja.
-- RLS LIGADO e SEM policies anon: leitura/escrita só pelas rotas de servidor
-- (service_role). A tabela normalizada configuracoes_loja acima fica para a fase
-- de Auth/multi-loja.
create table config_app (
  id            text primary key default 'principal',
  dados         jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table config_app enable row level security;

-- ---------- Catálogo do app (uma linha, JSON) ----------
-- Produtos + config por produto (vídeo/variantes) numa única linha JSON, para
-- o lojista editar/adicionar e refletir no delivery e no PDV em qualquer
-- aparelho. RLS ligado, sem policies anon: só as rotas de servidor acessam.
create table catalogo_app (
  id            text primary key default 'principal',
  produtos      jsonb not null default '[]'::jsonb,
  cfg           jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table catalogo_app enable row level security;

-- ---------- Pedidos ao vivo (board delivery/PDV, denormalizado) ----------
-- Tabela pragmática para o fluxo ao vivo (recebimento/acompanhamento). Itens
-- ficam em jsonb (não precisa seedar o catálogo normalizado ainda). O relatório
-- financeiro/estoque usa vendas/itens_venda quando ligarmos a baixa de estoque.
-- RLS LIGADO e SEM policies para anon: todo acesso passa pelas rotas do servidor
-- (service_role). Assim nenhum dado de cliente fica exposto pela chave pública.
create table pedidos (
  id          uuid primary key default gen_random_uuid(),
  numero      text not null,
  cliente     text not null,
  telefone    text,
  canal       text not null default 'Delivery',   -- Delivery | PDV
  modo        text not null default 'entrega',     -- entrega | retirada
  entrega     text,
  pagamento   text,
  itens       jsonb not null default '[]'::jsonb,  -- [{nome,qtd,preco}]
  total       numeric(10,2) not null default 0,
  status      text not null default 'Novo',        -- Novo|Preparando|Em rota|Entregue
  agendado    boolean not null default false,
  criado_em   timestamptz not null default now()
);
create index idx_pedidos_criado on pedidos (criado_em desc);
alter table pedidos enable row level security;
-- (sem create policy: apenas a service_role, que ignora RLS, acessa)

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

-- ============================================================
-- SEGURANÇA (fase de Auth — NÃO habilitar ainda)
-- ============================================================
-- Quando entrar o login (Supabase Auth) + papéis dono×operador, habilitar RLS
-- por loja. Esboço (deixado comentado de propósito):
--
--   alter table vendas enable row level security;
--   create policy vendas_por_loja on vendas
--     using (loja_id in (select loja_id from usuarios_loja where user_id = auth.uid()));
--
-- Repetir o padrão para produtos, lotes, movimentacoes, clientes, etc., a partir
-- de uma tabela de vínculo usuario -> loja + papel.
