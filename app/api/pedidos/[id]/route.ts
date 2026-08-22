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
  if (!b) return NextResponse.json({ error: "corpo inválido" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof b.status === "string") patch.status = b.status;
  if (typeof b.pago === "boolean") patch.pago = b.pago;
  if (typeof b.pago_status === "string") patch.pago_status = b.pago_status;
  if (b.valor_pago !== undefined) patch.valor_pago = Number(b.valor_pago) || 0;
  if (typeof b.observacao === "string") patch.observacao = b.observacao;
  if (Array.isArray(b.itens)) patch.itens = b.itens;
  if (b.total !== undefined) patch.total = Number(b.total) || 0;
  if (typeof b.pagamento === "string") patch.pagamento = b.pagamento;
  if (Array.isArray(b.historico)) patch.historico = b.historico;
  if (!Object.keys(patch).length)
    return NextResponse.json({ error: "nada para atualizar" }, { status: 400 });

  const { data, error } = await db
    .from("pedidos")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pedido: data });
}

// DELETE /api/pedidos/[id] — exclui/cancela um pedido.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const { error } = await db.from("pedidos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
