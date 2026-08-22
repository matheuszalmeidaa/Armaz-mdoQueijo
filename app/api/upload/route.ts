import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const BUCKET = "produtos";

async function garantirBucket(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  // Cria o bucket público na primeira vez; ignora se já existir.
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});
}

// POST /api/upload — sobe uma imagem (FormData: file) e retorna {url, path}.
export async function POST(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "arquivo ausente" }, { status: 400 });
  if (file.size > 6 * 1024 * 1024)
    return NextResponse.json({ error: "imagem acima de 6MB" }, { status: 400 });

  await garantirBucket(db);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  const path = `${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

// DELETE /api/upload — remove a imagem do Storage (body: {path}).
export async function DELETE(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "sem banco" }, { status: 503 });
  const b = await request.json().catch(() => null);
  if (!b?.path) return NextResponse.json({ error: "path ausente" }, { status: 400 });
  await db.storage.from(BUCKET).remove([b.path]);
  return NextResponse.json({ ok: true });
}
