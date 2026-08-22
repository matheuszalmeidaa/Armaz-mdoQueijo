import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Tabelas que o app USA hoje (devem ter dados conforme o uso).
const EM_USO = [
  "catalogo_app",
  "config_app",
  "estoque_app",
  "pedidos",
  "lojas",
  "perfis",
];
// Tabelas relacionais que só enchem após a migração relacional (vazias por ora).
const AGUARDANDO = [
  "produtos",
  "variantes",
  "faixas_preco",
  "lotes",
  "movimentacoes",
  "vendas",
  "itens_venda",
  "clientes",
  "configuracoes_loja",
  "usuarios",
  "auditoria",
];

async function contar(
  db: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  tabela: string
) {
  const { count, error } = await db
    .from(tabela)
    .select("*", { count: "exact", head: true });
  return { tabela, count: count ?? 0, erro: error?.message ?? null };
}

// GET /api/diagnostico — contagem de linhas por tabela (via service_role).
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ semBanco: true });

  const emUso = await Promise.all(EM_USO.map((t) => contar(db, t)));
  const aguardando = await Promise.all(AGUARDANDO.map((t) => contar(db, t)));
  return NextResponse.json({ emUso, aguardando });
}
