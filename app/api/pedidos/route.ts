import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/pedidos — lista os pedidos (gestão/recebimento).
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ pedidos: [], semBanco: true });

  const { data, error } = await db
    .from("pedidos")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pedidos: data });
}

// POST /api/pedidos — cria um pedido (checkout do delivery / venda do PDV).
export async function POST(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "corpo inválido" }, { status: 400 });

  const numero =
    typeof b.numero === "string" && b.numero
      ? b.numero
      : String(8400 + Math.floor(Math.random() * 600));
  const registro: Record<string, unknown> = {
    numero,
    cliente: b.cliente ?? "Cliente",
    telefone: b.telefone ?? null,
    canal: b.canal ?? "Delivery",
    modo: b.modo ?? "entrega",
    entrega: b.entrega ?? null,
    pagamento: b.pagamento ?? null,
    itens: Array.isArray(b.itens) ? b.itens : [],
    total: Number(b.total) || 0,
    status: b.status ?? "Novo",
    agendado: Boolean(b.agendado),
  };
  // O cliente pode enviar o mesmo id (uuid) que usou localmente, para o número
  // do pedido casar no WhatsApp, no acompanhamento e no banco.
  if (typeof b.id === "string" && b.id) registro.id = b.id;

  const { data, error } = await db.from("pedidos").insert(registro).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pedido: data });
}
