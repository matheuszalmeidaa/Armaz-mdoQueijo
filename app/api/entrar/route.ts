import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Login contra a tabela `usuarios` do Supabase (senha via pgcrypto/crypt).
// Fallback de emergência: a env ADMIN_SENHA (senha única) — evita ficar
// trancado se o banco/função ainda não estiver configurado.
const COOKIE = "armazem_sessao";
const COOKIE_USER = "armazem_user";
const SENHA_EMERGENCIA = process.env.ADMIN_SENHA ?? "armazem";

function setSessao(nome: string, lembrar: boolean) {
  const res = NextResponse.json({ ok: true, nome });
  const maxAge = lembrar ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  // Cookie legível pela UI (nome de quem entrou) — não é segredo.
  res.cookies.set(COOKIE_USER, encodeURIComponent(nome), {
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";
  const lembrar = Boolean(body?.lembrar);

  if (!senha) return NextResponse.json({ ok: false }, { status: 401 });

  // 1) Login pelo Supabase (usuarios + verificar_login)
  const db = getSupabaseAdmin();
  if (db && email) {
    try {
      const { data, error } = await db.rpc("verificar_login", {
        p_email: email,
        p_senha: senha,
      });
      if (!error && Array.isArray(data) && data.length > 0) {
        return setSessao(data[0].nome ?? "Usuário", lembrar);
      }
    } catch {
      // cai no fallback abaixo
    }
  }

  // 2) Fallback de emergência: senha única da env (sem depender do banco)
  if (senha === SENHA_EMERGENCIA) {
    return setSessao("Administrador", lembrar);
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
