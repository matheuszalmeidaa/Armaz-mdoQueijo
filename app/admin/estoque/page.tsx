"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCatalogo, useCfgMapa } from "@/lib/catalogo-store";
import {
  useEstoque,
  definirMinimo,
  excluirLote,
} from "@/lib/estoque-store";
import {
  saldoDe,
  saldoLoja,
  lotesLoja,
  lojasComLote,
  minimoDe,
  statusDe,
  unidadeDe,
  restanteLote,
  diasParaVencer,
  contarAlertas,
  lotesVencendo,
  nomeDe,
  fmtQtd,
} from "@/lib/estoque";
import { useLojas } from "@/lib/lojas-store";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

const JANELAS = [7, 15, 30, 60] as const;

export default function AdminEstoque() {
  const catalogo = useCatalogo();
  useEstoque(); // assina o estoque vivo (re-renderiza ao mudar)
  const cfgMapa = useCfgMapa();
  const { lojas } = useLojas();
  const lojasNome: Record<string, string> = Object.fromEntries(
    lojas.map((l) => [l.id, l.nome])
  );
  const alertas = contarAlertas();
  const [janela, setJanela] = useState<number>(30);
  const conferir = lotesVencendo(janela);

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Estoque</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Controle por lotes e validade. Sincroniza com delivery, PDV e atacado.
          </p>
        </div>
        <Link
          href="/admin/estoque/entrada"
          className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary shadow active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          Chegada de mercadoria
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-md">
        <CardAlerta rotulo="Esgotados" valor={alertas.esgotado} cor="text-danger-red" />
        <CardAlerta rotulo="Abaixo do mínimo" valor={alertas.baixo} cor="text-warning-amber" />
        <CardAlerta rotulo="Vencendo (7 dias)" valor={alertas.vencendo} cor="text-secondary" />
      </div>

      {/* Próximos a conferir/vencer (FEFO) */}
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Próximos a conferir
            </h2>
            <p className="text-label-sm text-on-surface-variant">
              Lotes que vencem em breve — priorize a saída (o mais próximo primeiro).
            </p>
          </div>
          <div className="flex rounded-lg border border-outline-variant p-1">
            {JANELAS.map((d) => (
              <button
                key={d}
                onClick={() => setJanela(d)}
                className={`rounded-md px-3 py-1 text-label-sm ${janela === d ? "bg-primary text-on-primary" : "text-on-surface"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {conferir.length === 0 ? (
          <p className="py-3 text-center text-body-md text-on-surface-variant">
            Nenhum lote vencendo nos próximos {janela} dias.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {conferir.map((l) => {
              const un = unidadeDe(l.produtoId);
              const dias = diasParaVencer(l.validade) ?? 0;
              const urgente = dias <= 7;
              return (
                <li key={l.id} className="flex items-center justify-between gap-sm py-2.5">
                  <div>
                    <p className="text-body-md text-on-surface">{nomeDe(l.produtoId)}</p>
                    <p className="text-label-sm text-on-surface-variant">
                      {fmtQtd(restanteLote(l), un)}
                      {l.codigo ? ` · lote ${l.codigo}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-body-md font-semibold ${urgente ? "text-danger-red" : "text-secondary"}`}
                    >
                      {dias <= 0 ? "vencido" : `vence em ${dias}d`}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {l.validade
                        ? new Date(l.validade + "T00:00:00").toLocaleDateString("pt-BR")
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {catalogo.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-cream-surface p-lg text-center">
          <p className="text-body-md text-on-surface-variant">
            Nenhum produto no catálogo. Cadastre em{" "}
            <Link href="/admin/produtos/novo" className="text-primary underline">
              Produtos → Novo produto
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-sm">
          {catalogo.map((p) => (
            <LinhaProduto
              key={p.id}
              produtoId={p.id}
              nome={p.nome}
              pesoMedioG={cfgMapa[p.id]?.pesoMedioG}
              lojasNome={lojasNome}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaProduto({
  produtoId,
  nome,
  pesoMedioG,
}: {
  produtoId: string;
  nome: string;
  pesoMedioG?: number;
  lojasNome: Record<string, string>;
}) {
  const un = unidadeDe(produtoId);
  const saldo = saldoDe(produtoId);
  const min = minimoDe(produtoId);
  const st = statusDe(produtoId);
  const lojasP = lojasComLote(produtoId);
  const [aberto, setAberto] = useState(false);
  const [minEdit, setMinEdit] = useState(String(min));

  useEffect(() => setMinEdit(String(min)), [min]);

  const corStatus =
    st === "esgotado"
      ? "bg-error-container text-on-error-container"
      : st === "baixo"
        ? "bg-warning-amber/20 text-secondary"
        : "bg-tertiary-container/30 text-tertiary";
  const rot = st === "esgotado" ? "Esgotado" : st === "baixo" ? "Baixo" : "OK";

  // Estimativa em kg quando vendido por peça e há peso médio.
  const kgEstimado =
    un === "un" && pesoMedioG ? (saldo * pesoMedioG) / 1000 : null;

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center gap-md">
        <button
          onClick={() => setAberto((v) => !v)}
          className="flex min-w-[10rem] flex-grow items-center gap-sm text-left"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            {aberto ? "expand_more" : "chevron_right"}
          </span>
          <div>
            <p className="font-medium text-on-surface">{nome}</p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm ${corStatus}`}
            >
              {rot} · {fmtQtd(saldo, un)}
              {kgEstimado !== null && (
                <span className="text-on-surface-variant">
                  {" "}
                  (~{kgEstimado.toFixed(1).replace(".", ",")} kg)
                </span>
              )}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <label className="text-label-sm text-on-surface-variant">Mín.</label>
          <input
            value={minEdit}
            onChange={(e) => setMinEdit(e.target.value)}
            onBlur={() => definirMinimo(produtoId, num(minEdit))}
            inputMode="decimal"
            className="w-16 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-center text-body-md outline-none focus:border-primary"
          />
          <span className="text-label-sm text-on-surface-variant">{un}</span>
        </div>
      </div>

      {aberto && (
        <div className="mt-md space-y-md border-t border-outline-variant/20 pt-md">
          {lojasP.length === 0 ? (
            <p className="text-label-md text-on-surface-variant">
              Sem lotes ativos. Registre uma{" "}
              <Link href="/admin/estoque/entrada" className="text-primary underline">
                chegada de mercadoria
              </Link>
              .
            </p>
          ) : (
            lojasP.map((lid) => {
              const lotes = lotesLoja(produtoId, lid).filter(
                (l) => restanteLote(l) > 0
              );
              if (lotes.length === 0) return null;
              return (
                <div key={lid || "sem-loja"}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-label-md font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        storefront
                      </span>
                      {lid ? lojasNome[lid] ?? "Loja" : "Sem loja definida"}
                    </span>
                    <span className="text-label-md text-primary">
                      {fmtQtd(saldoLoja(produtoId, lid), un)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {lotes.map((l) => {
                      const dias = diasParaVencer(l.validade);
                      const alerta = dias !== null && dias <= 7;
                      return (
                        <div
                          key={l.id}
                          className="flex items-center justify-between rounded-lg bg-surface-container-low px-md py-2 text-body-md"
                        >
                          <span className="text-on-surface">
                            {fmtQtd(restanteLote(l), un)}
                            {l.codigo && (
                              <span className="text-label-sm text-on-surface-variant">
                                {" "}· lote {l.codigo}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-md">
                            <span
                              className={
                                alerta ? "text-danger-red" : "text-on-surface-variant"
                              }
                            >
                              {l.validade
                                ? `vence ${new Date(l.validade + "T00:00:00").toLocaleDateString("pt-BR")}${
                                    dias !== null ? ` (${dias}d)` : ""
                                  }`
                                : "sem validade"}
                            </span>
                            <button
                              onClick={() => {
                                if (confirm("Excluir este lote?")) excluirLote(l.id);
                              }}
                              className="material-symbols-outlined text-[18px] text-danger-red"
                              title="Excluir lote"
                            >
                              delete
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function CardAlerta({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <p className={`font-display text-headline-lg ${cor}`}>{valor}</p>
      <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
    </div>
  );
}
