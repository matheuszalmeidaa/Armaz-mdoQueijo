"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { brl, gramas } from "@/lib/catalogo";

const FRETE = 12.9;

export default function Carrinho() {
  const { itens, remover, limpar, total } = useCart();
  const [finalizado, setFinalizado] = useState(false);

  if (finalizado) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-md py-xl text-center">
        <span className="material-symbols-outlined mb-md text-[72px] text-tertiary">
          check_circle
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Pedido enviado!
        </h1>
        <p className="mt-sm text-body-md text-on-surface-variant">
          Assim que ligarmos na espinha (Supabase), este pedido cai no PDV e no
          dashboard em tempo real.
        </p>
        <Link
          href="/loja"
          className="mt-lg rounded-lg bg-primary px-lg py-3 text-on-primary"
        >
          Voltar à loja
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-full max-w-md pb-40">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href="/loja"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">
          Seu carrinho
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
                      ? `${gramas(it.pesoG)} (aprox.)`
                      : `${it.qtd} un`}
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

          {/* Resumo */}
          <section className="mt-md px-md">
            <div className="rounded-xl bg-cream-surface p-md">
              <Linha rotulo="Subtotal" valor={brl(total)} />
              <Linha rotulo="Frete" valor={brl(FRETE)} />
              <div className="my-sm border-t border-dashed border-outline/20" />
              <Linha
                rotulo="Total"
                valor={brl(total + FRETE)}
                destaque
              />
            </div>
            <p className="mt-sm text-caption text-on-surface-variant">
              * Itens por peso são aproximados; o valor final pode ajustar ao
              corte, dentro da faixa escolhida.
            </p>
          </section>

          {/* Barra de finalizar */}
          <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
            <button
              onClick={() => setFinalizado(true)}
              className="flex w-full items-center justify-between rounded-lg bg-primary px-lg py-4 text-on-primary shadow-lg transition-transform active:scale-[0.98]"
            >
              <span className="text-body-lg font-semibold">
                Finalizar pedido
              </span>
              <span className="font-headline-md text-headline-md">
                {brl(total + FRETE)}
              </span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          destaque
            ? "text-body-lg font-semibold text-on-surface"
            : "text-body-md text-on-surface-variant"
        }
      >
        {rotulo}
      </span>
      <span
        className={
          destaque
            ? "font-headline-md text-headline-md text-primary"
            : "text-body-md text-on-surface"
        }
      >
        {valor}
      </span>
    </div>
  );
}
