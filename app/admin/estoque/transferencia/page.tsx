"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCatalogo } from "@/lib/catalogo-store";
import { useEstoque, transferirEstoque } from "@/lib/estoque-store";
import { saldoLoja, unidadeDe, fmtQtd } from "@/lib/estoque";
import { useLojas } from "@/lib/lojas-store";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function TransferenciaEstoque() {
  const catalogo = useCatalogo();
  const { lojas } = useLojas();
  const dados = useEstoque(); // mantém saldos reativos

  const [produtoId, setProdutoId] = useState("");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [qtd, setQtd] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(
    null
  );

  const un = produtoId ? unidadeDe(produtoId) : "un";
  const saldoOrigem = produtoId ? saldoLoja(produtoId, origem) : 0;
  const saldoDestino = produtoId ? saldoLoja(produtoId, destino) : 0;
  const q = num(qtd);
  const pode =
    produtoId &&
    origem &&
    destino &&
    origem !== destino &&
    q > 0 &&
    q <= saldoOrigem;

  const nomeLoja = (id?: string) =>
    !id ? "Sem loja" : lojas.find((l) => l.id === id)?.nome ?? "Loja";
  const nomeProduto = (id: string) =>
    catalogo.find((p) => p.id === id)?.nome ?? id;

  // Últimas transferências (histórico de movimentação).
  const transferencias = useMemo(
    () => dados.movimentos.filter((m) => m.tipo === "transferencia").slice(0, 8),
    [dados.movimentos]
  );

  function confirmar() {
    if (!pode) return;
    const r = transferirEstoque(produtoId, origem, destino, q);
    if (r.ok) {
      setMsg({
        tipo: "ok",
        texto: `Transferido ${fmtQtd(q, un)} de ${nomeLoja(origem)} para ${nomeLoja(destino)}.`,
      });
      setQtd("");
    } else {
      setMsg({ tipo: "erro", texto: r.motivo ?? "Não foi possível transferir." });
    }
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
          Transferir entre lojas
        </h1>
      </div>

      {lojas.length < 2 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-cream-surface p-lg text-center text-body-md text-on-surface-variant">
          Cadastre ao menos duas lojas em{" "}
          <Link href="/admin/lojas" className="text-primary underline">
            Lojas
          </Link>{" "}
          para transferir estoque.
        </div>
      ) : (
        <div className="space-y-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div>
            <label className="block text-label-md text-on-surface">Produto</label>
            <select
              value={produtoId}
              onChange={(e) => {
                setProdutoId(e.target.value);
                setMsg(null);
              }}
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

          <div className="grid gap-md sm:grid-cols-2">
            <div>
              <label className="block text-label-md text-on-surface">De (origem)</label>
              <select
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
              >
                <option value="">Escolha a loja</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
              {produtoId && origem && (
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  Disponível: <strong>{fmtQtd(saldoOrigem, un)}</strong>
                </p>
              )}
            </div>
            <div>
              <label className="block text-label-md text-on-surface">Para (destino)</label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
              >
                <option value="">Escolha a loja</option>
                {lojas
                  .filter((l) => l.id !== origem)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
              </select>
              {produtoId && destino && (
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  Tem hoje: <strong>{fmtQtd(saldoDestino, un)}</strong>
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface">
              Quantidade a transferir ({un})
            </label>
            <input
              value={qtd}
              onChange={(e) => {
                setQtd(e.target.value);
                setMsg(null);
              }}
              inputMode="decimal"
              placeholder="0"
              className="mt-1 w-40 rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            />
            {q > 0 && q > saldoOrigem && (
              <p className="mt-1 text-label-sm text-danger-red">
                Maior que o disponível na origem ({fmtQtd(saldoOrigem, un)}).
              </p>
            )}
          </div>

          {origem && destino && q > 0 && q <= saldoOrigem && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-cream-surface px-md py-2.5 text-body-md">
              <span className="text-on-surface">{nomeLoja(origem)}</span>
              <span className="material-symbols-outlined text-primary">
                arrow_forward
              </span>
              <span className="text-on-surface">{nomeLoja(destino)}</span>
              <span className="ml-2 font-headline-md text-headline-md text-primary">
                {fmtQtd(q, un)}
              </span>
            </div>
          )}

          {msg && (
            <p
              className={`flex items-center gap-1 text-label-md ${
                msg.tipo === "ok" ? "text-tertiary" : "text-danger-red"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {msg.tipo === "ok" ? "check_circle" : "error"}
              </span>
              {msg.texto}
            </p>
          )}

          <button
            onClick={confirmar}
            disabled={!pode}
            className="w-full rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
          >
            Transferir
          </button>
        </div>
      )}

      {/* Histórico de transferências */}
      {transferencias.length > 0 && (
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">
            Últimas transferências
          </h2>
          <ul className="divide-y divide-outline-variant/20">
            {transferencias.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-md py-2 text-body-md"
              >
                <span className="min-w-0">
                  <span className="block truncate text-on-surface">
                    {nomeProduto(m.produtoId)}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    {nomeLoja(m.origemLojaId)} → {nomeLoja(m.destinoLojaId)} ·{" "}
                    {new Date(m.em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span className="flex-shrink-0 font-label-md text-label-md text-primary">
                  {fmtQtd(m.qtd, unidadeDe(m.produtoId))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
