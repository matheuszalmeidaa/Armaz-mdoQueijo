-- ============================================================
-- FASE A — Fundação relacional p/ Atacado, multi-loja, peso real, perfis
-- ADITIVO e NÃO-DESTRUTIVO: só estende o schema existente. Não mexe nas
-- tabelas *_app (JSON) que o app usa hoje — nada quebra ao rodar isto.
-- Rode no SQL Editor do Supabase. Blocos independentes; pode rodar tudo.
-- ============================================================

-- 1) Atacado como canal de venda (além de pdv/delivery)
--    (ADD VALUE não roda dentro de transação; rode esta linha sozinha se
--     o editor reclamar.)
alter type canal_venda add value if not exists 'atacado';

-- 2) Peso médio no produto (estimativa peça↔kg)
alter table produtos add column if not exists peso_medio_g integer;
alter table produtos add column if not exists estoque_minimo numeric(10,3) not null default 0;
-- Como o produto é vendido em cada canal (peça/kg/ambos):
alter table produtos add column if not exists venda_pdv       jsonb not null default '{"peca":true,"kg":false}'::jsonb;
alter table produtos add column if not exists venda_delivery  jsonb not null default '{"peca":true,"kg":false}'::jsonb;
alter table produtos add column if not exists venda_atacado   jsonb not null default '{"ativo":false,"unidade":"kg","minimo":0,"faixas":[]}'::jsonb;

-- 3) Item da venda: peça física + peso solicitado/real + LOJA DE ORIGEM por item
alter table itens_venda add column if not exists pecas          numeric(10,3);           -- qtd física de peças
alter table itens_venda add column if not exists peso_solicitado_g integer;              -- o que o cliente pediu
alter table itens_venda add column if not exists loja_origem_id uuid references lojas(id) on delete restrict;
alter table itens_venda add column if not exists observacao     text;
alter table itens_venda add column if not exists preco_editado  boolean not null default false; -- preço alterado manualmente
-- (peso_estimado_g e peso_real_g já existem no schema)

-- 4) Reserva de estoque no lote (disponível = quantidade - reservado)
alter table lotes add column if not exists reservado numeric(10,3) not null default 0;

-- 5) Perfis e usuários (permissões por perfil) — base p/ Supabase Auth
create table if not exists perfis (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,             -- 'Administrador', 'Vendedor'...
  permissoes  jsonb not null default '{}'::jsonb, -- {"editar_preco":true,"cancelar_pedido":false,...}
  criado_em   timestamptz not null default now()
);

create table if not exists usuarios (
  id          uuid primary key,                 -- = auth.users.id (Supabase Auth)
  nome        text,
  perfil_id   uuid references perfis(id) on delete set null,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Perfil admin padrão (todas as permissões)
insert into perfis (nome, permissoes)
values ('Administrador', '{
  "ver_pedidos":true,"criar_pedidos":true,"editar_pedidos":true,"editar_pedidos_antigos":true,
  "adicionar_item":true,"remover_item":true,"editar_qtd":true,"editar_peso":true,
  "editar_peso_real":true,"editar_preco":true,"cancelar_pedido":true,"cancelar_item":true,
  "alterar_loja_estoque":true,"ajustar_estoque":true,"ver_estoque_outras_lojas":true,
  "criar_comanda":true,"alterar_status":true,"iniciar_rota":true,"marcar_entregue":true
}'::jsonb)
on conflict (nome) do nothing;

-- 6) Auditoria de alterações relevantes (preço, peso, cancelamento...)
create table if not exists auditoria (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid,
  venda_id    uuid,
  acao        text not null,     -- 'editar_preco','cancelar_item','estornar'...
  detalhe     jsonb,
  criado_em   timestamptz not null default now()
);
create index if not exists idx_auditoria_venda on auditoria (venda_id, criado_em);

-- ============================================================
-- 7) FUNÇÕES ATÔMICAS DE ESTOQUE (concorrência segura)
--    Toda baixa/estorno passa por aqui: trava os lotes (FOR UPDATE),
--    consome por validade (FEFO) e registra movimentação. Impede vender
--    acima do saldo mesmo com pedidos simultâneos.
-- ============================================================

-- Baixa FEFO na loja: consome lotes com validade mais próxima primeiro.
create or replace function baixar_estoque(
  p_produto uuid, p_loja uuid, p_qtd numeric, p_venda uuid, p_motivo text default 'venda'
) returns void language plpgsql as $$
declare
  v_rest numeric := p_qtd;
  v_lote record;
  v_usa  numeric;
begin
  if p_qtd is null or p_qtd <= 0 then return; end if;
  for v_lote in
    select id, (quantidade - reservado) as disponivel
    from lotes
    where produto_id = p_produto and loja_id = p_loja and (quantidade - reservado) > 0
    order by validade nulls last, criado_em
    for update
  loop
    exit when v_rest <= 0;
    v_usa := least(v_rest, v_lote.disponivel);
    update lotes set quantidade = quantidade - v_usa where id = v_lote.id;
    insert into movimentacoes(produto_id, loja_id, lote_id, tipo, quantidade, motivo, venda_id)
      values (p_produto, p_loja, v_lote.id, 'venda', -v_usa, p_motivo, p_venda);
    v_rest := v_rest - v_usa;
  end loop;
  if v_rest > 0 then
    raise exception 'Estoque insuficiente na loja (faltam %)', v_rest
      using errcode = 'check_violation';
  end if;
end; $$;

-- Estorna todas as saídas de uma venda (cancelamento): devolve às mesmas lojas/lotes.
create or replace function estornar_venda(p_venda uuid) returns void language plpgsql as $$
declare m record;
begin
  for m in
    select * from movimentacoes where venda_id = p_venda and tipo = 'venda'
  loop
    update lotes set quantidade = quantidade + (-m.quantidade) where id = m.lote_id;
    insert into movimentacoes(produto_id, loja_id, lote_id, tipo, quantidade, motivo, venda_id)
      values (m.produto_id, m.loja_id, m.lote_id, 'ajuste', -m.quantidade, 'cancelamento', p_venda);
  end loop;
end; $$;

-- Saldo disponível (soma quantidade-reservado) por produto/loja.
create or replace function saldo_loja(p_produto uuid, p_loja uuid)
returns numeric language sql stable as $$
  select coalesce(sum(quantidade - reservado), 0)
  from lotes where produto_id = p_produto and loja_id = p_loja;
$$;

-- Saldo total do produto (todas as lojas).
create or replace function saldo_total(p_produto uuid)
returns numeric language sql stable as $$
  select coalesce(sum(quantidade - reservado), 0)
  from lotes where produto_id = p_produto;
$$;

-- ============================================================
-- 8) RLS: ligar nas novas tabelas (acesso só via rotas de servidor / service_role)
-- ============================================================
alter table perfis    enable row level security;
alter table usuarios  enable row level security;
alter table auditoria enable row level security;
