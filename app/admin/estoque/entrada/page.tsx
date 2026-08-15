"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCatalogo } from "@/lib/catalogo-store";
import { darEntrada, lerSaldo } from "@/lib/estoque-store";
import { unidadeDe } from "@/lib/estoque";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function EntradaEstoque() {
  const router = useRouter();
  const catalogo = useCatalogo();
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState("");
  const [validade, setValidade] = useState("");
  const [salvo, setSalvo] = useState(false);

  const un = produtoId ? unidadeDe(produtoId) : "un";
  const saldoAtual = produtoId ? lerSaldo(produtoId).saldo : 0;
  const pode = produtoId && num(qtd) > 0;

  function registrar() {
    if (!pode) return;
    darEntrada(produtoId, num(qtd), validade || undefined);
    setSalvo(true);
    setTimeout(() => router.push("/admin/estoque"), 800);
  }

  return (
    <div className="mx-auto max-w-[40rem] space-y-lg">
      <div className="flex items-center gap-sm">
        <Link
          href="/admin/estoque"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Dar entrada no estoque
        </h1>
      </div>

      {catalogo.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-cream-surface p-lg text-center">
          <p className="text-body-md text-on-surface-variant">
            Cadastre um produto primeiro em{" "}
            <Link href="/admin/produtos/novo" className="text-primary underline">
              Produtos → Novo produto
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div>
            <label className="block text-label-md text-on-surface">Produto</label>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            >
              <option value="">Escolha um produto</option>
              {catalogo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            {produtoId && (
              <p className="mt-1 text-label-sm text-on-surface-variant">
                Saldo atual: {saldoAtual} {un}
              </p>
            )}
          </div>

          <div>
            <label className="block text-label-md text-on-surface">
              Quantidade a adicionar ({un})
            </label>
            <input
              value={qtd}
              onChange={(e) => setQtd(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-label-md text-on-surface">
              Validade do lote (opcional)
            </label>
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={registrar}
            disabled={!pode}
            className="w-full rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
          >
            {salvo ? "Entrada registrada!" : "Registrar entrada"}
          </button>
        </div>
      )}
    </div>
  );
}
