import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/pedidos/[id] — um pedido (acompanhamento do cliente).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ pedido: null, semBanco: true });

  const { data, error } = await db.from("pedidos").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ pedido: data });
}

// PATCH /api/pedidos/[id] — muda o status (gestão/recebimento avança).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  if (!b?.status)
    return NextResponse.json({ error: "status ausente" }, { status: 400 });

  const { data, error } = await db
    .from("pedidos")
    .update({ status: b.status })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pedido: data });
}
