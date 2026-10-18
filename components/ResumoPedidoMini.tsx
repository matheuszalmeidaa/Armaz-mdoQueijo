"use client";

// Resumo compacto do pedido, sempre visível durante o checkout (identificação
// e endereço). Recolhido mostra só o total; expandido lista os itens.
// O frete e descontos entram na etapa de Revisão.

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { brl, gramas, getProduto } from "@/lib/catalogo";
import { ProdutoImagem } from "@/components/ProdutoImagem";

export function ResumoPedidoMini() {
  const { itens, total } = useCart();
  const [aberto, setAberto] = useState(false);
  if (itens.length === 0) return null;

  return (
    <div className="mx-md overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-md px-md py-3 active:bg-surface-container-low"
      >
        <span className="flex items-center gap-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container/15 text-primary">
            <span className="material-symbols-outlined text-[20px]">
              shopping_bag
            </span>
          </span>
          <span className="flex flex-col text-left leading-tight">
            <span className="text-label-md text-on-surface">Seu pedido</span>
            <span className="text-caption text-on-surface-variant">
              {itens.length} {itens.length === 1 ? "item" : "itens"} ·{" "}
              {aberto ? "tocar para recolher" : "tocar para ver"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span className="font-headline-md text-headline-md text-primary">
            {brl(total)}
          </span>
          <span
            className={`material-symbols-outlined text-on-surface-variant transition-transform ${
              aberto ? "rotate-180" : ""
            }`}
          >
            expand_more
          </span>
        </span>
      </button>

      {aberto && (
        <div className="border-t border-outline-variant/20 px-md pb-sm pt-1">
          <ul className="divide-y divide-outline-variant/15">
            {itens.map((it) => (
              <li key={it.key} className="flex items-center gap-sm py-2">
                <ProdutoImagem
                  src={it.img || getProduto(it.produtoId)?.img || ""}
                  alt={it.nome}
                  icone={it.icone}
                  className="h-10 w-10 flex-shrink-0 rounded-lg"
                  iconSize={22}
                />
                <span className="min-w-0 flex-grow">
                  <span className="block truncate text-label-md text-on-surface">
                    {it.nome}
                  </span>
                  <span className="text-caption text-on-surface-variant">
                    {it.pesoG
                      ? `${gramas(it.pesoG)}${it.qtd > 1 ? ` × ${it.qtd}` : ""}`
                      : `${it.qtd} un`}
                  </span>
                  {it.adicionais && it.adicionais.length > 0 && (
                    <span className="block truncate text-caption text-on-surface-variant">
                      + {it.adicionais.map((a) => a.nome).join(", ")}
                    </span>
                  )}
                </span>
                <span className="flex-shrink-0 text-label-md font-medium text-on-surface">
                  {brl(it.precoLinha)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-sm text-body-md">
            <span className="text-on-surface-variant">Subtotal</span>
            <span className="font-headline-md text-headline-md text-primary">
              {brl(total)}
            </span>
          </div>
          <p className="mt-1 text-caption text-on-surface-variant">
            Frete e descontos aparecem na revisão.
          </p>
        </div>
      )}
    </div>
  );
}
