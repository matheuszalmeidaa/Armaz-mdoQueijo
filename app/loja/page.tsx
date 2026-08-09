"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOGO, CATEGORIAS, brl, precoBase, type Produto } from "@/lib/catalogo";
import { useCart } from "@/lib/cart";
import { ProdutoImagem } from "@/components/ProdutoImagem";

export default function LojaHome() {
  const [cat, setCat] = useState<string>("Todos");
  const { qtdItens } = useCart();

  const lista =
    cat === "Todos" ? CATALOGO : CATALOGO.filter((p) => p.categoria === cat);

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-24">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm shadow-sm backdrop-blur-md">
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-display text-headline-lg tracking-tight text-primary">
          Fusqueijão
        </span>
        <Link
          href="/carrinho"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">shopping_basket</span>
          {qtdItens > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
              {qtdItens}
            </span>
          )}
        </Link>
      </header>

      {/* Hero */}
      <section className="px-md pt-md">
        <div className="flex h-[150px] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-t from-primary to-primary-container/40 p-md">
          <span className="w-fit rounded-full bg-warning-amber px-2 py-0.5 text-label-sm font-semibold text-on-secondary-fixed">
            SUGESTÃO DO DIA
          </span>
          <h2 className="mt-2 font-headline-md text-headline-md leading-tight text-cream-surface">
            Queijo Canastra com Mel de Laranjeira
          </h2>
        </div>
      </section>

      {/* Categorias */}
      <section className="mt-lg">
        <div className="no-scrollbar flex gap-sm overflow-x-auto px-md">
          {["Todos", ...CATEGORIAS].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-label-md transition-all active:scale-95 ${
                cat === c
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Grade de produtos */}
      <section className="mt-lg px-md">
        <div className="grid grid-cols-2 gap-gutter">
          {lista.map((p) => (
            <CardProduto key={p.id} produto={p} />
          ))}
        </div>
      </section>
    </main>
  );
}

function CardProduto({ produto }: { produto: Produto }) {
  const porPeso = produto.tipo === "peso";
  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98]"
    >
      <ProdutoImagem
        src={produto.img}
        alt={produto.nome}
        icone={produto.icone}
        className="aspect-square w-full"
      />
      <div className="flex flex-grow flex-col p-sm">
        <h4 className="line-clamp-1 text-label-md text-on-surface">
          {produto.nome}
        </h4>
        <span className="text-caption text-on-surface-variant">
          {produto.produtor}
        </span>
        <div className="mt-auto flex items-end justify-between pt-sm">
          <div className="flex flex-col leading-tight">
            {porPeso && (
              <span className="text-caption text-on-surface-variant">
                a partir de
              </span>
            )}
            <span className="font-headline-md text-headline-md text-primary">
              {brl(precoBase(produto))}
            </span>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-white">
            <span className="material-symbols-outlined text-[18px]">
              {porPeso ? "scale" : "add"}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
