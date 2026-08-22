import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// PATCH /api/lojas/[id] — renomeia, abre/fecha ou arquiva (ativa=false) a loja.
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
  if (typeof b.nome === "string" && b.nome.trim()) patch.nome = b.nome.trim();
  if (typeof b.aberta === "boolean") patch.aberta = b.aberta;
  if (typeof b.ativa === "boolean") {
    patch.ativa = b.ativa;
    patch.arquivada_em = b.ativa ? null : new Date().toISOString();
  }
  if (!Object.keys(patch).length)
    return NextResponse.json({ error: "nada para atualizar" }, { status: 400 });

  const { data, error } = await db
    .from("lojas")
    .update(patch)
    .eq("id", id)
    .select("id, nome, aberta, ativa")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ loja: data });
}
