"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import {
  CATALOGO,
  brl,
  gramas,
  getProduto,
  precoBase,
  type Produto,
} from "@/lib/catalogo";
import { calcularResumo, buscarCupom, LOJAS_RETIRADA } from "@/lib/regras";
import { useConfig, lojaAbertaAgora } from "@/lib/config-store";

export default function Carrinho() {
  const router = useRouter();
  const { itens, add, alterarQtd, remover, limpar, total, dados, setDados } =
    useCart();
  const pagamento = dados.pagamento ?? "pix";
  const modo = dados.modo ?? "entrega";

  const [cupomInput, setCupomInput] = useState(dados.cupom ?? "");
  const [cupomErro, setCupomErro] = useState(false);

  const cfg = useConfig();
  const faltaMinimo =
    modo === "entrega" && cfg.pedidoMinimo > 0 && total < cfg.pedidoMinimo;

  const status = lojaAbertaAgora(cfg);
  const podeAgendar = !status.aberta && cfg.agendamentoAtivo;
  const soVisualiza = !status.aberta && !cfg.agendamentoAtivo;

  // Garante que o modo escolhido está entre os ativos na config.
  useEffect(() => {
    if (modo === "entrega" && !cfg.entregaAtiva && cfg.retiradaAtiva) {
      setDados({ modo: "retirada" });
    } else if (modo === "retirada" && !cfg.retiradaAtiva && cfg.entregaAtiva) {
      setDados({ modo: "entrega" });
    }
  }, [modo, cfg.entregaAtiva, cfg.retiradaAtiva, setDados]);

  const noCarrinho = (id: string) => itens.some((i) => i.produtoId === id);

  // "Vai bem com": produtos que o lojista vinculou aos itens do carrinho.
  const vinculados = (() => {
    const vistos = new Set<string>();
    const out: Produto[] = [];
    for (const i of itens) {
      const vid = getProduto(i.produtoId)?.vinculadoId;
      if (!vid || vistos.has(vid) || noCarrinho(vid)) continue;
      const vp = getProduto(vid);
      if (vp) {
        vistos.add(vid);
        out.push(vp);
      }
    }
    return out.slice(0, 2);
  })();

  // Sem vínculo cadastrado: cai no upsell genérico (unidades fora do carrinho).
  const genericos = CATALOGO.filter(
    (p) => p.tipo === "unidade" && !noCarrinho(p.id)
  ).slice(0, 2);

  const sugestoes = vinculados.length > 0 ? vinculados : genericos;
  const tituloUpsell =
    vinculados.length > 0 ? "Vai bem com" : "Combine com seu pedido";

  function aplicarCupom() {
    const c = buscarCupom(cupomInput, cfg.cupons);
    if (c) {
      setDados({ cupom: c.codigo });
      setCupomErro(false);
    } else {
      setCupomErro(true);
    }
  }

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-40">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href="/loja"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">
          Checkout
        </span>
        <button
          onClick={limpar}
          className="text-label-sm text-on-surface-variant disabled:opacity-40"
          disabled={itens.length === 0}
        >
          Limpar
        </button>
      </header>

      {itens.length === 0 ? (
        <div className="flex flex-col items-center px-md py-xl text-center">
          <span className="material-symbols-outlined mb-md text-[64px] text-outline">
            shopping_basket
          </span>
          <p className="text-body-md text-on-surface-variant">
            Seu carrinho está vazio.
          </p>
          <Link
            href="/loja"
            className="mt-lg rounded-lg bg-primary px-lg py-3 text-on-primary"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <>
          {/* Itens */}
          <h2 className="px-md pt-md font-headline-md text-headline-md text-on-surface">
            Seu Carrinho{" "}
            <span className="text-label-sm text-on-surface-variant">
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </span>
          </h2>
          <ul className="divide-y divide-outline-variant/20 px-md">
            {itens.map((it) => (
              <li key={it.key} className="flex items-center gap-md py-md">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-container to-primary-container/20">
                  <span className="material-symbols-outlined text-[32px] text-primary/40">
                    {it.icone}
                  </span>
                </div>
                <div className="flex-grow">
                  <h4 className="line-clamp-1 text-label-md text-on-surface">
                    {it.nome}
                  </h4>
                  <span className="text-caption text-on-surface-variant">
                    {it.pesoG
                      ? `Pedaço aprox. ${gramas(it.pesoG)}${it.qtd > 1 ? ` × ${it.qtd}` : ""}`
                      : `${it.qtd} un`}
                  </span>
                  <p className="mt-1 font-headline-md text-headline-md text-primary">
                    {brl(it.precoLinha)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => remover(it.key)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-danger-red active:scale-90"
                    aria-label="Remover"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <div className="flex items-center gap-1 rounded-full border border-outline-variant px-1 py-0.5">
                    <button
                      onClick={() => alterarQtd(it.key, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-primary active:scale-90 disabled:opacity-30"
                      disabled={it.qtd <= 1}
                      aria-label="Menos um"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="w-5 text-center text-body-md font-semibold">
                      {it.qtd}
                    </span>
                    <button
                      onClick={() => alterarQtd(it.key, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-primary active:scale-90"
                      aria-label="Mais um"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Upsell — produto vinculado ("Vai bem com") ou sugestão genérica */}
          {sugestoes.length > 0 && (
            <section className="mt-lg px-md">
              <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
                {tituloUpsell}
              </h3>
              <div className="grid grid-cols-2 gap-gutter">
                {sugestoes.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-sm"
                  >
                    <div className="mb-sm flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-secondary-container to-primary-container/20">
                      <span className="material-symbols-outlined text-[32px] text-primary/40">
                        {p.icone}
                      </span>
                    </div>
                    <h4 className="line-clamp-1 text-label-md text-on-surface">
                      {p.nome}
                    </h4>
                    <div className="mt-auto flex items-end justify-between pt-sm">
                      <div className="flex flex-col leading-tight">
                        {p.tipo === "peso" && (
                          <span className="text-caption text-on-surface-variant">
                            a partir de
                          </span>
                        )}
                        <span className="font-headline-md text-headline-md text-primary">
                          {brl(precoBase(p))}
                        </span>
                      </div>
                      {p.tipo === "unidade" ? (
                        <button
                          aria-label={`Adicionar ${p.nome}`}
                          onClick={() =>
                            add({
                              key: p.id,
                              produtoId: p.id,
                              nome: p.nome,
                              icone: p.icone,
                              qtd: 1,
                              precoLinha: p.preco,
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            add
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={`/produto/${p.id}`}
                          aria-label={`Escolher peso de ${p.nome}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white active:scale-90"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            scale
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Como quer receber */}
          <section className="mt-lg px-md">
            <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
              Como quer receber?
            </h3>
            <div className="flex rounded-lg border border-outline-variant p-1">
              {cfg.entregaAtiva && (
                <SegBtn
                  ativo={modo === "entrega"}
                  onClick={() => setDados({ modo: "entrega" })}
                  icone="local_shipping"
                  label="Entrega"
                />
              )}
              {cfg.retiradaAtiva && (
                <SegBtn
                  ativo={modo === "retirada"}
                  onClick={() => setDados({ modo: "retirada" })}
                  icone="storefront"
                  label="Retirar na loja"
                />
              )}
            </div>

            {modo === "entrega" ? (
              <p className="mt-sm flex items-center gap-sm rounded-lg bg-surface-container-low px-md py-2.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary">
                  location_on
                </span>
                Você informa o endereço no próximo passo.
              </p>
            ) : (
              <p className="mt-sm flex items-center gap-sm rounded-lg bg-surface-container-low px-md py-2.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-tertiary">
                  storefront
                </span>
                Retirada no balcão — <strong className="text-tertiary">grátis</strong>
                , sem taxa de entrega.
              </p>
            )}
          </section>

          <p className="mt-lg px-md text-caption text-on-surface-variant">
            * Itens por peso são aproximados; o valor final pode ajustar ao corte,
            dentro da faixa escolhida. Pagamento e cupom no próximo passo.
          </p>

          {/* Continuar */}
          <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
            {soVisualiza && (
              <p className="mb-sm flex items-center justify-center gap-1 text-label-sm text-danger-red">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Loja fechada — {status.motivo} Só visualização agora.
              </p>
            )}
            {podeAgendar && (
              <p className="mb-sm flex items-center justify-center gap-1 text-label-sm text-secondary">
                <span className="material-symbols-outlined text-[16px]">event</span>
                Loja fechada — seu pedido será enviado como AGENDADO.
              </p>
            )}
            {faltaMinimo && !soVisualiza && (
              <p className="mb-sm flex items-center justify-center gap-1 text-label-sm text-danger-red">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Pedido mínimo de {brl(cfg.pedidoMinimo)} — faltam{" "}
                {brl(cfg.pedidoMinimo - total)}.
              </p>
            )}
            <button
              onClick={() => router.push("/checkout/identificacao")}
              disabled={faltaMinimo || soVisualiza}
              className="flex w-full items-center justify-between rounded-lg bg-primary px-lg py-4 text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              <span className="flex items-center gap-2 text-body-lg font-semibold">
                {soVisualiza
                  ? "Loja fechada"
                  : podeAgendar
                    ? "Agendar pedido"
                    : "Continuar"}
                {!soVisualiza && (
                  <span className="material-symbols-outlined">arrow_forward</span>
                )}
              </span>
              <span className="font-headline-md text-headline-md">
                {brl(total)}
              </span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function SegBtn({
  ativo,
  onClick,
  icone,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 text-label-md transition-colors ${
        ativo ? "bg-primary text-on-primary" : "text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icone}</span>
      {label}
    </button>
  );
}

function OpcaoPagamento({
  ativo,
  onClick,
  icone,
  titulo,
  sub,
  destaque,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: string;
  titulo: string;
  sub: string;
  destaque?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-md rounded-lg border px-md py-3 text-left transition-all active:scale-[0.99] ${
        ativo
          ? "border-primary bg-primary-container/5"
          : "border-outline-variant bg-surface-container-lowest"
      }`}
    >
      <span
        className={`material-symbols-outlined ${
          destaque ? "text-tertiary" : "text-primary"
        }`}
      >
        {icone}
      </span>
      <span className="flex-grow">
        <span className="block text-label-md text-on-surface">{titulo}</span>
        <span
          className={`block text-label-sm ${
            destaque ? "text-tertiary" : "text-on-surface-variant"
          }`}
        >
          {sub}
        </span>
      </span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          ativo ? "border-primary" : "border-outline-variant"
        }`}
      >
        {ativo && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
    </button>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
  verde,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  verde?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          destaque
            ? "text-body-lg font-semibold text-on-surface"
            : verde
              ? "text-body-md font-medium text-tertiary"
              : "text-body-md text-on-surface-variant"
        }
      >
        {rotulo}
      </span>
      <span
        className={
          destaque
            ? "font-headline-md text-headline-md text-primary"
            : verde
              ? "text-body-md font-medium text-tertiary"
              : "text-body-md text-on-surface"
        }
      >
        {valor}
      </span>
    </div>
  );
}
