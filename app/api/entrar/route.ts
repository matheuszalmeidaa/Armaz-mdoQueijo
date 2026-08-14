import { NextResponse } from "next/server";

// Login simples (sem backend): confere a senha contra a env server-only
// ADMIN_SENHA e seta o cookie de sessão. Defina ADMIN_SENHA na Vercel; o
// padrão abaixo só serve para não travar antes de configurar.
const COOKIE = "armazem_sessao";
const SENHA = process.env.ADMIN_SENHA ?? "armazem";

export async function POST(request: Request) {
  const { senha, lembrar } = await request
    .json()
    .catch(() => ({ senha: "" as string, lembrar: false }));

  if (typeof senha !== "string" || senha !== SENHA) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // "Manter conectado": ~30 dias; senão, 12 horas.
    maxAge: lembrar ? 60 * 60 * 24 * 30 : 60 * 60 * 12,
  });
  return res;
}
