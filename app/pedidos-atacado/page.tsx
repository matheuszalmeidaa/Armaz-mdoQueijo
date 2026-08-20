"use client";

import Link from "next/link";
import { useConfig } from "@/lib/config-store";
import { useCatalogo, useCfgMapa } from "@/lib/catalogo-store";
import { brl, type Atacado } from "@/lib/catalogo";
import { ProdutoImagem } from "@/components/ProdutoImagem";

export default function Atacado() {
  const cfg = useConfig();
  const catalogo = useCatalogo();
  const cfgMapa = useCfgMapa();
  const zap = cfg.whatsapp.replace(/\D/g, "");

  const itens = catalogo
    .map((p) => ({ produto: p, atacado: cfgMapa[p.id]?.atacado }))
    .filter(
      (x): x is { produto: (typeof catalogo)[number]; atacado: Atacado } =>
        Boolean(x.atacado?.ativo && x.atacado.faixas.length)
    );

  const un = (a: Atacado) => (a.unidade === "kg" ? "kg" : "pç");

  return (
    <main className="mx-auto flex min-h-dvh max-w-[32rem] flex-col px-md py-xl">
      <header className="flex items-center gap-sm">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-display text-headline-md text-primary">Atacado</span>
      </header>

      <div className="mt-md">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Compra no atacado
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Preços especiais por volume — quanto mais, menor o preço por unidade.
        </p>
      </div>

      {itens.length === 0 ? (
        <div className="mt-lg flex flex-col items-center rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-lg text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
            <span className="material-symbols-outlined text-[32px]">inventory_2</span>
          </div>
          <p className="mt-md text-body-md text-on-surface-variant">
            O catálogo de atacado está sendo montado. Faça seu pedido direto com a
            gente.
          </p>
          {zap && (
            <a
              href={`https://wa.me/55${zap}?text=${encodeURIComponent("Olá! Quero fazer um pedido no atacado.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-lg flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">chat</span>
              Pedir atacado no WhatsApp
            </a>
          )}
        </div>
      ) : (
        <div className="mt-lg space-y-md">
          {itens.map(({ produto, atacado }) => (
            <div
              key={produto.id}
              className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-md">
                <ProdutoImagem
                  src={produto.img}
                  alt={produto.nome}
                  icone={produto.icone}
                  className="h-16 w-16 flex-shrink-0 rounded-lg"
                  iconSize={28}
                />
                <div>
                  <p className="font-headline-md text-headline-md text-on-surface">
                    {produto.nome}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Vendido por {atacado.unidade === "kg" ? "quilo" : "peça"}
                    {atacado.minimo
                      ? ` · mínimo ${atacado.minimo} ${un(atacado)}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="mt-sm space-y-1">
                {atacado.faixas.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-surface-container-low px-md py-2 text-body-md"
                  >
                    <span className="text-on-surface-variant">
                      a partir de {f.min} {un(atacado)}
                    </span>
                    <span className="font-semibold text-primary">
                      {brl(f.preco)}/{un(atacado)}
                    </span>
                  </div>
                ))}
              </div>

              {zap && (
                <a
                  href={`https://wa.me/55${zap}?text=${encodeURIComponent(
                    `Olá! Quero cotar *${produto.nome}* no atacado.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-md flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-body-md font-semibold text-on-primary active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Cotar no WhatsApp
                </a>
              )}
            </div>
          ))}

          {zap && (
            <a
              href={`https://wa.me/55${zap}?text=${encodeURIComponent("Olá! Quero fazer um pedido no atacado.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-3 text-body-md font-semibold text-primary active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">chat</span>
              Falar com a loja
            </a>
          )}
        </div>
      )}

      <Link
        href="/loja"
        className="mt-lg text-center text-label-md text-secondary underline underline-offset-2"
      >
        Ver o catálogo do varejo
      </Link>
    </main>
  );
}
