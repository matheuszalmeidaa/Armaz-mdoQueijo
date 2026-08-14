"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EntrarPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
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
      body: JSON.stringify({ senha }),
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
    <main className="mx-auto flex min-h-dvh max-w-[24rem] flex-col justify-center px-md">
      <div className="mb-lg flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg">
          <span className="material-symbols-outlined text-[32px]">
            restaurant
          </span>
        </div>
        <h1 className="mt-md font-display text-headline-lg text-primary">
          Armazém do Queijo
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Acesso da equipe — gestão e PDV
        </p>
      </div>

      <form
        onSubmit={entrar}
        className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      >
        <label className="block text-label-md text-on-surface">Senha</label>
        <div className="mt-1 flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
          <span className="material-symbols-outlined text-on-surface-variant">
            lock
          </span>
          <input
            type="password"
            autoFocus
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a senha"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        {erro && (
          <p className="mt-sm flex items-center gap-1 text-label-md text-danger-red">
            <span className="material-symbols-outlined text-[18px]">error</span>
            Senha incorreta.
          </p>
        )}

        <button
          type="submit"
          disabled={!senha || enviando}
          className="mt-md w-full rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <a
        href="/"
        className="mt-lg text-center text-label-md text-on-surface-variant underline"
      >
        Voltar à loja
      </a>
    </main>
  );
}
