import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ID = "principal";

// GET /api/estoque — mapa de saldos por produto.
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ saldos: {}, semBanco: true });

  const { data, error } = await db
    .from("estoque_app")
    .select("saldos")
    .eq("id", ID)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saldos: data?.saldos ?? {} });
}

// PUT /api/estoque — salva o mapa de saldos (gestão de estoque).
export async function PUT(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  if (!b || typeof b.saldos !== "object")
    return NextResponse.json({ error: "saldos ausentes" }, { status: 400 });

  const { error } = await db.from("estoque_app").upsert({
    id: ID,
    saldos: b.saldos,
    atualizado_em: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
