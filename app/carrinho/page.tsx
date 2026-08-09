"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { CATALOGO, brl, gramas } from "@/lib/catalogo";
import { REGRAS } from "@/lib/regras";

export default function Carrinho() {
  const router = useRouter();
  const { itens, add, remover, limpar, total, dados, setDados } = useCart();
  const pagamento = dados.pagamento ?? "pix";

  const descontoPix = pagamento === "pix" ? total * REGRAS.descontoPix : 0;
  const totalFinal = total + REGRAS.frete - descontoPix;

  // Upsell: produtos por unidade que ainda não estão no carrinho
  const sugestoes = CATALOGO.filter(
    (p) => p.tipo === "unidade" && !itens.some((i) => i.produtoId === p.id)
  ).slice(0, 2);

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
                    {it.pesoG ? `Pedaço aprox. ${gramas(it.pesoG)}` : `${it.qtd} un`}
                  </span>
                  <p className="mt-1 font-headline-md text-headline-md text-primary">
                    {brl(it.precoLinha)}
                  </p>
                </div>
                <button
                  onClick={() => remover(it.key)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-danger-red active:scale-90"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Forma de pagamento */}
          <section className="mt-lg px-md">
            <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
              Forma de Pagamento
            </h3>
            <div className="flex flex-col gap-sm">
              <OpcaoPagamento
                ativo={pagamento === "pix"}
                onClick={() => setDados({ pagamento: "pix" })}
                icone="qr_code_2"
                titulo="Pix"
                sub={`${Math.round(REGRAS.descontoPix * 100)}% de desconto extra`}
                destaque
              />
              <OpcaoPagamento
                ativo={pagamento === "cartao"}
                onClick={() => setDados({ pagamento: "cartao" })}
                icone="credit_card"
                titulo="Cartão de Crédito"
                sub="Até 6x sem juros"
              />
            </div>
          </section>

          {/* Upsell */}
          {sugestoes.length > 0 && (
            <section className="mt-lg px-md">
              <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">
                Combine com seu pedido
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
                    <div className="mt-auto flex items-center justify-between pt-sm">
                      <span className="font-headline-md text-headline-md text-primary">
                        {brl(p.tipo === "unidade" ? p.preco : 0)}
                      </span>
                      <button
                        onClick={() =>
                          p.tipo === "unidade" &&
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
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Resumo */}
          <section className="mt-lg px-md">
            <div className="rounded-xl bg-cream-surface p-md">
              <Linha rotulo="Subtotal" valor={brl(total)} />
              <Linha rotulo="Frete" valor={brl(REGRAS.frete)} />
              {descontoPix > 0 && (
                <Linha
                  rotulo="Desconto Pix (5%)"
                  valor={`- ${brl(descontoPix)}`}
                  verde
                />
              )}
              <div className="my-sm border-t border-dashed border-outline/20" />
              <Linha rotulo="Total" valor={brl(totalFinal)} destaque />
            </div>
            <p className="mt-sm text-caption text-on-surface-variant">
              * Itens por peso são aproximados; o valor final pode ajustar ao
              corte, dentro da faixa escolhida.
            </p>
          </section>

          {/* Finalizar */}
          <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
            <button
              onClick={() => router.push("/checkout/identificacao")}
              className="flex w-full items-center justify-between rounded-lg bg-primary px-lg py-4 text-on-primary shadow-lg transition-transform active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 text-body-lg font-semibold">
                Continuar
                <span className="material-symbols-outlined">arrow_forward</span>
              </span>
              <span className="font-headline-md text-headline-md">
                {brl(totalFinal)}
              </span>
            </button>
          </div>
        </>
      )}
    </main>
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
