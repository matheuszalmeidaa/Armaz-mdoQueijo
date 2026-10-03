-- ============================================================
-- Etapa 1 da migração relacional: catálogo em linhas na tabela `produtos`.
-- ADITIVO. Rode no SQL Editor. Guarda o modelo do app em jsonb (dados/cfg) +
-- colunas consultáveis (nome, categoria, preço) — uma linha por produto.
-- A migração dos dados do catalogo_app acontece sozinha no 1º acesso.
-- ============================================================
alter table produtos add column if not exists app_id  text;
create unique index if not exists idx_produtos_app_id
  on produtos (app_id) where app_id is not null;
alter table produtos add column if not exists dados   jsonb;
alter table produtos add column if not exists cfg     jsonb;
alter table produtos add column if not exists ordem   integer not null default 0;
