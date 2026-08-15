"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigurado } from "@/lib/supabase";

const TABELAS = [
  "lojas",
  "produtos",
  "variantes",
  "configuracoes_loja",
  "vendas",
  "clientes",
];

type Resultado = { tabela: string; ok: boolean; detalhe: string };

export default function Conexao() {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [testando, setTestando] = useState(false);

  async function testar() {
    if (!supabase) return;
    setTestando(true);
    const out: Resultado[] = [];
    for (const t of TABELAS) {
      const { error } = await supabase.from(t).select("*").limit(1);
      out.push({
        tabela: t,
        ok: !error,
        detalhe: error ? error.message : "acessível",
      });
    }
    setResultados(out);
    setTestando(false);
  }

  useEffect(() => {
    if (supabaseConfigurado) testar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Conexão com o Supabase
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Diagnóstico da ligação com o banco de dados.
        </p>
      </div>

      <div
        className={`flex items-center gap-sm rounded-xl border p-md ${
          supabaseConfigurado
            ? "border-tertiary/40 bg-tertiary-container/20"
            : "border-warning-amber/50 bg-warning-amber/10"
        }`}
      >
        <span
          className={`material-symbols-outlined ${supabaseConfigurado ? "text-tertiary" : "text-warning-amber"}`}
        >
          {supabaseConfigurado ? "cloud_done" : "cloud_off"}
        </span>
        <div>
          <p className="text-body-lg text-on-surface">
            {supabaseConfigurado
              ? "Chaves configuradas"
              : "Chaves ainda não configuradas"}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {supabaseConfigurado
              ? "As variáveis NEXT_PUBLIC_SUPABASE_URL e ANON_KEY estão presentes."
              : "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel e faça o redeploy."}
          </p>
        </div>
      </div>

      {supabaseConfigurado && (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-sm flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Tabelas
            </h2>
            <button
              onClick={testar}
              disabled={testando}
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-label-md text-primary active:scale-95 disabled:opacity-40"
            >
              {testando ? "Testando..." : "Testar de novo"}
            </button>
          </div>
          <ul className="divide-y divide-outline-variant/20">
            {resultados.map((r) => (
              <li key={r.tabela} className="flex items-center justify-between py-2.5">
                <span className="font-mono text-body-md text-on-surface">
                  {r.tabela}
                </span>
                <span
                  className={`flex items-center gap-1 text-label-md ${r.ok ? "text-tertiary" : "text-danger-red"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {r.ok ? "check_circle" : "error"}
                  </span>
                  {r.detalhe}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
