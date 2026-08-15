import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ID = "principal";

// GET /api/catalogo — produtos + config por produto (vídeo/variantes).
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db)
    return NextResponse.json({ produtos: null, cfg: {}, semBanco: true });

  const { data, error } = await db
    .from("catalogo_app")
    .select("produtos, cfg")
    .eq("id", ID)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Sem linha ainda → produtos null (o app usa o catálogo semente).
  return NextResponse.json({
    produtos: data?.produtos ?? null,
    cfg: data?.cfg ?? {},
  });
}

// PUT /api/catalogo — salva a lista + config (gestão de produtos).
export async function PUT(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  if (!b || !Array.isArray(b.produtos))
    return NextResponse.json({ error: "produtos ausentes" }, { status: 400 });

  const { error } = await db.from("catalogo_app").upsert({
    id: ID,
    produtos: b.produtos,
    cfg: b.cfg ?? {},
    atualizado_em: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
