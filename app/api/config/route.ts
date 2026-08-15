import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ID = "principal";

// GET /api/config — config atual da loja (lida pela home, loja, checkout...).
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ dados: null, semBanco: true });

  const { data, error } = await db
    .from("config_app")
    .select("dados")
    .eq("id", ID)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Sem linha ainda → dados null (o app usa o padrão até o primeiro salvar).
  return NextResponse.json({ dados: data?.dados ?? null });
}

// PUT /api/config — salva a config (gestão). Upsert numa única linha.
export async function PUT(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  if (!b?.dados)
    return NextResponse.json({ error: "dados ausentes" }, { status: 400 });

  const { error } = await db
    .from("config_app")
    .upsert({ id: ID, dados: b.dados, atualizado_em: new Date().toISOString() });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
