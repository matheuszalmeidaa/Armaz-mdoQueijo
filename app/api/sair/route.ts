import { NextResponse } from "next/server";

// Sair: limpa o cookie de sessão e volta para a tela de login.
const COOKIE = "armazem_sessao";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/entrar", request.url), 303);
  res.cookies.delete(COOKIE);
  return res;
}
