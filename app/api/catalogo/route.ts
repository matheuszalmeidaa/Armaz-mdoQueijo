import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ID = "principal";
type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
type Produto = { id: string; nome?: string; categoria?: string; tipo?: string; preco?: number };
type Row = { app_id: string; dados: Produto; cfg: Record<string, unknown> | null; ordem: number };

async function lerLinhas(db: Db): Promise<Row[]> {
  const { data } = await db
    .from("produtos")
    .select("app_id, dados, cfg, ordem")
    .not("app_id", "is", null)
    .order("ordem", { ascending: true });
  return (data as Row[] | null) ?? [];
}

function linhaDe(p: Produto, cfg: Record<string, unknown>, i: number) {
  return {
    app_id: p.id,
    nome: p.nome ?? "Produto",
    categoria: p.categoria ?? null,
    preco_venda: p.tipo === "unidade" ? Number(p.preco) || null : null,
    dados: p,
    cfg: cfg[p.id] ?? {},
    ordem: i,
    ativo: true,
  };
}

// GET /api/catalogo — lê os produtos (linhas da tabela `produtos`).
// Migra do catalogo_app (JSON) automaticamente na primeira vez.
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ produtos: null, cfg: {}, semBanco: true });

  let linhas = await lerLinhas(db);

  if (linhas.length === 0) {
    // Migração: copia o catálogo JSON antigo para a tabela relacional.
    const { data: app } = await db
      .from("catalogo_app")
      .select("produtos, cfg")
      .eq("id", ID)
      .maybeSingle();
    const produtos = (app?.produtos as Produto[] | null) ?? [];
    const cfg = (app?.cfg as Record<string, Record<string, unknown>>) ?? {};
    if (Array.isArray(produtos) && produtos.length) {
      await db
        .from("produtos")
        .upsert(
          produtos.map((p, i) => linhaDe(p, cfg, i)),
          { onConflict: "app_id" }
        );
      linhas = await lerLinhas(db);
    }
  }

  const produtos = linhas.map((r) => r.dados).filter(Boolean);
  const cfg: Record<string, unknown> = {};
  for (const r of linhas) if (r.cfg && r.app_id) cfg[r.app_id] = r.cfg;
  return NextResponse.json({ produtos, cfg });
}

// PUT /api/catalogo — salva o catálogo (upsert por produto + remove os ausentes).
// Mantém o catalogo_app como espelho/reserva durante a transição.
export async function PUT(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  if (!b || !Array.isArray(b.produtos))
    return NextResponse.json({ error: "produtos ausentes" }, { status: 400 });

  const produtos = b.produtos as Produto[];
  const cfg = (b.cfg ?? {}) as Record<string, Record<string, unknown>>;

  if (produtos.length) {
    const { error } = await db
      .from("produtos")
      .upsert(produtos.map((p, i) => linhaDe(p, cfg, i)), { onConflict: "app_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Remove da tabela os produtos que não estão mais na lista.
  const ids = produtos.map((p) => p.id).filter(Boolean);
  let del = db.from("produtos").delete().not("app_id", "is", null);
  if (ids.length) {
    const lista = `(${ids.map((i) => `"${i}"`).join(",")})`;
    del = del.not("app_id", "in", lista);
  }
  await del;

  // Espelho/reserva no catalogo_app (permite reverter sem perder dados).
  await db
    .from("catalogo_app")
    .upsert({ id: ID, produtos, cfg, atualizado_em: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
