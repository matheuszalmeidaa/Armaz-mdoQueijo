"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOGO } from "@/lib/catalogo";
import { LOJAS_ESTOQUE, unidadeDe, fmtQtd } from "@/lib/estoque";

export default function EntradaMercadoria() {
  const [produtoId, setProdutoId] = useState(CATALOGO[0].id);
  const [validade, setValidade] = useState("");
  const [custo, setCusto] = useState("");
  const [centro, setCentro] = useState("");
  const [bairro, setBairro] = useState("");
  const [salvo, setSalvo] = useState(false);

  const un = unidadeDe(produtoId);
  const qCentro = Number(centro.replace(",", ".")) || 0;
  const qBairro = Number(bairro.replace(",", ".")) || 0;
  const totalDistribuido = qCentro + qBairro;

  function registrar() {
    if (totalDistribuido <= 0) return;
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2200);
    setCentro("");
    setBairro("");
    setValidade("");
    setCusto("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <div className="flex items-center gap-sm">
        <Link
          href="/admin/estoque"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Entrada de mercadoria
        </h1>
      </div>

      {/* Produto + lote */}
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <label className="block text-label-md text-on-surface">Produto</label>
        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
        >
          {CATALOGO.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <div className="mt-md grid gap-md sm:grid-cols-2">
          <div>
            <label className="block text-label-md text-on-surface">
              Validade do lote
            </label>
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-label-md text-on-surface">
              Custo por {un === "kg" ? "kg" : "unidade"}
            </label>
            <div className="mt-1 flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
              <span className="text-body-md text-on-surface-variant">R$</span>
              <input
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-full bg-transparent text-body-lg outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Destino por loja */}
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Destino por loja
        </h2>
        <p className="mb-md text-body-md text-on-surface-variant">
          Quanto desta entrada vai para cada loja ({un === "kg" ? "em kg" : "em unidades"}).
        </p>
        <div className="space-y-sm">
          {LOJAS_ESTOQUE.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-md rounded-lg bg-surface-container-low px-md py-2.5"
            >
              <span className="flex items-center gap-sm text-body-lg text-on-surface">
                <span className="material-symbols-outlined text-secondary">
                  storefront
                </span>
                {l.nome}
              </span>
              <div className="flex w-32 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                <input
                  value={l.id === "centro" ? centro : bairro}
                  onChange={(e) =>
                    l.id === "centro"
                      ? setCentro(e.target.value)
                      : setBairro(e.target.value)
                  }
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full bg-transparent text-right text-body-lg outline-none"
                />
                <span className="text-label-sm text-on-surface-variant">{un}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-md flex items-center justify-between border-t border-dashed border-outline/20 pt-sm">
          <span className="text-body-lg text-on-surface-variant">
            Total da entrada
          </span>
          <span className="font-headline-md text-headline-md text-primary">
            {fmtQtd(totalDistribuido, un)}
          </span>
        </div>
      </section>

      <div className="flex items-center gap-md">
        <button
          onClick={registrar}
          disabled={totalDistribuido <= 0}
          className="rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
        >
          Registrar entrada
        </button>
        {salvo && (
          <span className="flex items-center gap-1 text-label-md text-tertiary">
            <span className="material-symbols-outlined">check_circle</span>
            Entrada registrada!
          </span>
        )}
      </div>
      <p className="text-caption text-on-surface-variant">
        * Maquete — ao ligar o Supabase, isto cria um lote por loja e soma ao
        saldo (com a validade para o controle FEFO).
      </p>
    </div>
  );
}
