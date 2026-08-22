"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCatalogo } from "@/lib/catalogo-store";
import { registrarChegada } from "@/lib/estoque-store";
import { unidadeDe } from "@/lib/estoque";
import { useLojas } from "@/lib/lojas-store";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

type Linha = { qtd: string; validade: string; codigo: string };

export default function ChegadaMercadoria() {
  const router = useRouter();
  const catalogo = useCatalogo();
  const { lojas } = useLojas();
  const [lojaId, setLojaId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([
    { qtd: "", validade: "", codigo: "" },
  ]);
  const [salvo, setSalvo] = useState(false);

  const un = produtoId ? unidadeDe(produtoId) : "un";
  const totalRecebido = linhas.reduce((s, l) => s + num(l.qtd), 0);
  const precisaLoja = lojas.length > 0;
  const pode = produtoId && totalRecebido > 0 && (!precisaLoja || lojaId);

  function addLinha() {
    setLinhas([...linhas, { qtd: "", validade: "", codigo: "" }]);
  }
  function updLinha(i: number, patch: Partial<Linha>) {
    setLinhas(linhas.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }
  function delLinha(i: number) {
    setLinhas(linhas.length > 1 ? linhas.filter((_, j) => j !== i) : linhas);
  }

  function finalizar() {
    if (!pode) return;
    registrarChegada(
      produtoId,
      linhas
        .filter((l) => num(l.qtd) > 0)
        .map((l) => ({
          qtd: num(l.qtd),
          validade: l.validade || undefined,
          codigo: l.codigo || undefined,
        })),
      lojaId || undefined
    );
    setSalvo(true);
    setTimeout(() => router.push("/admin/estoque"), 800);
  }

  return (
    <div className="mx-auto max-w-[44rem] space-y-lg">
      <div className="flex items-center gap-sm">
        <Link
          href="/admin/estoque"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Chegada de mercadoria
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
          {precisaLoja && (
            <div>
              <label className="block text-label-md text-on-surface">Loja</label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
              >
                <option value="">Escolha a loja</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                O estoque entra nesta loja. O saldo total é a soma de todas.
              </p>
            </div>
          )}
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
          </div>

          {produtoId && (
            <>
              <div>
                <label className="block text-label-md text-on-surface">
                  Lotes recebidos ({un})
                </label>
                <p className="mb-sm text-label-sm text-on-surface-variant">
                  Uma linha por validade. Ex.: 15 un vencendo 15/09 e 30 un
                  vencendo 30/09 → duas linhas.
                </p>
                <div className="space-y-sm">
                  {linhas.map((l, i) => (
                    <div key={i} className="flex flex-wrap items-end gap-sm">
                      <div>
                        <label className="block text-label-sm text-on-surface-variant">
                          Quantidade ({un})
                        </label>
                        <input
                          value={l.qtd}
                          onChange={(e) => updLinha(i, { qtd: e.target.value })}
                          inputMode="decimal"
                          placeholder="0"
                          className="mt-1 w-24 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-label-sm text-on-surface-variant">
                          Validade
                        </label>
                        <input
                          type="date"
                          value={l.validade}
                          onChange={(e) => updLinha(i, { validade: e.target.value })}
                          className="mt-1 w-40 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex-grow">
                        <label className="block text-label-sm text-on-surface-variant">
                          Lote (opcional)
                        </label>
                        <input
                          value={l.codigo}
                          onChange={(e) => updLinha(i, { codigo: e.target.value })}
                          placeholder="código"
                          className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        onClick={() => delLinha(i)}
                        className="material-symbols-outlined pb-2 text-danger-red disabled:opacity-30"
                        disabled={linhas.length === 1}
                        title="Remover linha"
                      >
                        delete
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addLinha}
                  className="mt-sm flex items-center gap-1 text-label-md text-secondary"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Adicionar outra validade
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-cream-surface px-md py-2.5">
                <span className="text-body-md text-on-surface-variant">
                  Total recebido
                </span>
                <span className="font-headline-md text-headline-md text-primary">
                  {totalRecebido} {un}
                </span>
              </div>

              <button
                onClick={finalizar}
                disabled={!pode}
                className="w-full rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
              >
                {salvo ? "Chegada registrada!" : "Finalizar recebimento"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
