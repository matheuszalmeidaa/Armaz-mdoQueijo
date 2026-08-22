import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/lojas — lojas ativas (base do estoque multi-loja).
export async function GET() {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ lojas: [], semBanco: true });

  const { data, error } = await db
    .from("lojas")
    .select("id, nome, aberta, ativa")
    .eq("ativa", true)
    .order("criado_em", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lojas: data });
}

// POST /api/lojas — cria uma loja.
export async function POST(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const b = await request.json().catch(() => null);
  const nome = (b?.nome ?? "").trim();
  if (!nome) return NextResponse.json({ error: "nome ausente" }, { status: 400 });

  const { data, error } = await db
    .from("lojas")
    .insert({ nome })
    .select("id, nome, aberta, ativa")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ loja: data });
}
