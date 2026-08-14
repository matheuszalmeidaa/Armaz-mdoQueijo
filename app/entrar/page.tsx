"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); // aceito, mas ignorado até ligarmos as contas
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [destino, setDestino] = useState("/admin");

  // Lê ?next= sem useSearchParams (evita exigência de Suspense no build).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("next");
    if (p && p.startsWith("/")) setDestino(p);
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(false);
    const r = await fetch("/api/entrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha, lembrar }),
    });
    setEnviando(false);
    if (r.ok) {
      router.replace(destino);
    } else {
      setErro(true);
      setSenha("");
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Coluna esquerda — hero com foto de queijo (desktop) */}
      <aside
        className="relative hidden overflow-hidden lg:flex"
        style={{
          backgroundImage: "url('/produtos/tabua.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/85 to-primary/50" />
        <div className="relative z-10 flex w-full flex-col justify-between p-xl text-on-primary">
          {/* Logo */}
          <div className="flex items-center gap-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-on-primary/15 backdrop-blur-sm">
              <span className="material-symbols-outlined text-cream-surface">
                restaurant
              </span>
            </div>
            <span className="font-display text-headline-md text-cream-surface">
              Armazém do Queijo
            </span>
          </div>

          {/* Frase */}
          <div className="max-w-[30rem]">
            <h1 className="font-display text-[2.75rem] font-bold leading-[1.05] text-cream-surface">
              Sua queijaria
              <br />
              inteira, num
              <br />
              só lugar.
            </h1>
            <p className="mt-md text-body-lg text-primary-fixed">
              PDV, delivery e gestão — a mesma base, sem caderninho.
            </p>
            <div className="mt-lg flex gap-2">
              <span className="h-2 w-6 rounded-full bg-cream-surface" />
              <span className="h-2 w-2 rounded-full bg-cream-surface/40" />
              <span className="h-2 w-2 rounded-full bg-cream-surface/40" />
            </div>
          </div>
        </div>
      </aside>

      {/* Coluna direita — card de login */}
      <section className="flex items-center justify-center bg-surface-container-low px-md py-xl">
        <div className="w-full max-w-[26rem] rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:p-xl">
          {/* Logo do card */}
          <div className="flex items-center justify-center gap-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
              <span className="material-symbols-outlined">restaurant</span>
            </div>
            <span className="font-display text-headline-md text-primary">
              Armazém do Queijo
            </span>
          </div>

          <h2 className="mt-lg text-center font-headline-md text-headline-md text-on-surface">
            Entre
          </h2>

          <form onSubmit={entrar} className="mt-lg space-y-md">
            {/* Email (visual — validado só quando ligarmos as contas) */}
            <div>
              <label className="block text-label-md text-on-surface">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                autoComplete="username"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none placeholder:text-on-surface-variant/50 focus:border-primary"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-label-md text-on-surface">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Insira sua senha"
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none placeholder:text-on-surface-variant/50 focus:border-primary"
              />
            </div>

            {erro && (
              <p className="flex items-center gap-1 text-label-md text-danger-red">
                <span className="material-symbols-outlined text-[18px]">error</span>
                Senha incorreta.
              </p>
            )}

            {/* Manter conectado + Recuperar senha */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-label-md text-on-surface">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Manter conectado
              </label>
              <span
                title="Disponível quando ligarmos as contas"
                className="flex cursor-not-allowed items-center gap-1 text-label-md text-on-surface-variant/60"
              >
                Recuperar senha
                <EmBreve />
              </span>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap items-center gap-sm pt-xs">
              <button
                type="submit"
                disabled={!senha || enviando}
                className="rounded-lg bg-primary px-lg py-2.5 text-label-lg font-semibold uppercase tracking-wide text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
              >
                {enviando ? "Entrando..." : "Entrar"}
              </button>
              <button
                type="button"
                disabled
                title="Disponível quando ligarmos as contas"
                className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-outline-variant px-lg py-2.5 text-label-lg font-semibold uppercase tracking-wide text-primary opacity-50"
              >
                Cadastre-se grátis
                <EmBreve />
              </button>
            </div>
          </form>

          <a
            href="/"
            className="mt-lg block text-center text-label-md text-on-surface-variant underline"
          >
            Voltar à loja
          </a>
        </div>
      </section>
    </main>
  );
}

function EmBreve() {
  return (
    <span className="rounded-full bg-secondary-container px-1.5 py-0.5 text-[10px] font-semibold uppercase text-on-secondary-container">
      em breve
    </span>
  );
}
