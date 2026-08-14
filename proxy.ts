import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Portão simples: /admin e /pdv exigem sessão. Sem backend — a sessão é um
// cookie httpOnly setado por /api/entrar após conferir a senha (ADMIN_SENHA).
// Quando entrar o Supabase Auth, troca-se este arquivo por verificação real
// (papéis dono × operador), sem mexer nas telas.
const COOKIE = "armazem_sessao";

export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/pdv", "/pdv/:path*"],
};
