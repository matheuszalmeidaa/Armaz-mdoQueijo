-- ============================================================
-- Refino de PEDIDOS — histórico, pagamento (pendente/pago/parcial), observação.
-- ADITIVO e não-destrutivo. Rode no SQL Editor do Supabase.
-- ============================================================
alter table pedidos add column if not exists historico    jsonb not null default '[]'::jsonb;
alter table pedidos add column if not exists pago_status   text  not null default 'pendente'; -- pendente|pago|parcial
alter table pedidos add column if not exists valor_pago    numeric(10,2) not null default 0;
alter table pedidos add column if not exists observacao    text;
