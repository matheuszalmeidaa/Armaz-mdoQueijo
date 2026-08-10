"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  getProduto,
  precoPorKg,
  brl,
  gramas,
  type Produto,
} from "@/lib/catalogo";
import { useCart } from "@/lib/cart";
import { REGRAS } from "@/lib/regras";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { badgesDe, BADGE_CLS } from "@/lib/badges";

export default function ProdutoPage() {
  const { id } = useParams<{ id: string }>();
  const produto = getProduto(id);

  if (!produto) {
    return (
      <main className="mx-auto max-w-[28rem] p-lg text-center">
        <p className="text-body-lg text-on-surface-variant">
          Produto não encontrado.
        </p>
        <Link href="/loja" className="mt-md inline-block text-primary underline">
          Voltar à loja
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-32">
      <Header nome={produto.produtor ?? "Fusqueijão"} />

      {/* Imagem */}
      <div className="relative m-md overflow-hidden rounded-xl">
        <ProdutoImagem
          src={produto.img}
          alt={produto.nome}
          icone={produto.icone}
          className="aspect-square w-full"
          iconSize={96}
        />
        {produto.tipo === "peso" && (
          <span className="absolute left-3 top-3 rounded-full bg-warning-amber px-3 py-1 text-label-sm font-semibold text-on-secondary-fixed shadow-sm">
            Corte na hora
          </span>
        )}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
          {badgesDe(produto.id).map((b) => (
            <span
              key={b.label}
              className={`rounded-full px-2.5 py-1 text-label-sm font-semibold shadow-sm ${BADGE_CLS[b.tipo]}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-md">
        <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
          {produto.categoria} · {produto.produtor}
        </p>
        <h1 className="mt-xs font-headline-lg text-headline-lg leading-tight text-on-surface">
          {produto.nome}
        </h1>

        {produto.tipo === "peso" ? (
          <SeletorPeso produto={produto} />
        ) : (
          <SeletorUnidade produto={produto} />
        )}

        <Detalhes produto={produto} />
      </div>
    </main>
  );
}

function Detalhes({ produto }: { produto: Produto }) {
  return (
    <section className="mt-lg">
      {produto.nota && (
        <div className="mb-md rounded-lg border-l-4 border-warning-amber bg-cream-surface px-md py-3">
          <p className="text-body-md italic text-on-surface-variant">
            {produto.nota}
          </p>
        </div>
      )}

      {produto.descricao && (
        <>
          <h2 className="font-headline-md text-headline-md text-primary">
            Sobre este produto
          </h2>
          <p className="mt-sm text-body-md leading-relaxed text-on-surface-variant">
            {produto.descricao}
          </p>
        </>
      )}

      {(produto.origem || produto.intensidade) && (
        <div className="mt-md grid grid-cols-2 gap-sm">
          {produto.origem && (
            <InfoCard icone="location_on" rotulo="Origem" valor={produto.origem} />
          )}
          {produto.intensidade && (
            <InfoCard
              icone="eco"
              rotulo="Intensidade"
              valor={produto.intensidade}
            />
          )}
        </div>
      )}

      <button className="mt-md flex w-full items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest py-3 text-label-md text-primary active:scale-[0.99]">
        <span className="material-symbols-outlined text-[20px]">share</span>
        Compartilhar com amigos
      </button>
    </section>
  );
}

function InfoCard({
  icone,
  rotulo,
  valor,
}: {
  icone: string;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-sm rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-md py-3">
      <span className="material-symbols-outlined text-secondary">{icone}</span>
      <div className="leading-tight">
        <span className="block text-label-sm text-on-surface-variant">
          {rotulo}
        </span>
        <span className="block text-label-md text-on-surface">{valor}</span>
      </div>
    </div>
  );
}

function Header({ nome }: { nome: string }) {
  const { qtdItens } = useCart();
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
      <Link
        href="/loja"
        className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </Link>
      <span className="font-display text-headline-md text-primary">
        {nome}
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
  );
}

// ---------- Produto por PESO ----------
function SeletorPeso({
  produto,
}: {
  produto: Extract<Produto, { tipo: "peso" }>;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [peso, setPeso] = useState(produto.pesos[1] ?? produto.pesos[0]);

  const precoBaseKg = produto.faixas[0].kg;
  const kg = precoPorKg(produto, peso);
  const total = (kg * peso) / 1000;
  const economia = ((precoBaseKg - kg) * peso) / 1000;

  const proxima = produto.faixas.find((f) => f.min > peso);
  const dica =
    proxima &&
    (() => {
      const economiaProx = ((precoBaseKg - proxima.kg) * proxima.min) / 1000;
      return { peso: proxima.min, economia: economiaProx };
    })();

  function adicionar() {
    add({
      key: `${produto.id}-${peso}`,
      produtoId: produto.id,
      nome: produto.nome,
      icone: produto.icone,
      pesoG: peso,
      qtd: 1,
      precoLinha: total,
    });
    router.push("/carrinho");
  }

  return (
    <>
      <p className="mt-sm text-body-md text-on-surface-variant">
        {brl(kg)}/kg
        {kg < precoBaseKg && (
          <span className="ml-2 text-label-sm text-tertiary">
            (desconto de volume aplicado)
          </span>
        )}
      </p>
      <p className="mt-1 flex items-center gap-1 text-label-md text-tertiary">
        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
        {brl(total * (1 - REGRAS.descontoPix))} com{" "}
        {Math.round(REGRAS.descontoPix * 100)}% no Pix
      </p>

      <div className="mt-lg">
        <div className="mb-sm flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-primary">
            Escolha o peso
          </h2>
          <span className="text-label-sm text-on-surface-variant">
            aproximado (±)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-sm">
          {produto.pesos.map((g) => {
            const ativo = g === peso;
            const desc = precoPorKg(produto, g) < precoBaseKg;
            return (
              <button
                key={g}
                onClick={() => setPeso(g)}
                className={`relative flex flex-col items-center rounded-lg border py-3 transition-all active:scale-95 ${
                  ativo
                    ? "border-primary bg-primary text-on-primary shadow-md"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                }`}
              >
                <span className="text-body-lg font-semibold">{gramas(g)}</span>
                <span
                  className={`text-label-sm ${
                    ativo ? "text-primary-fixed" : "text-on-surface-variant"
                  }`}
                >
                  {brl((precoPorKg(produto, g) * g) / 1000)}
                </span>
                {desc && (
                  <span className="absolute -right-1 -top-2 rounded-full bg-tertiary px-1.5 py-0.5 text-[10px] font-semibold text-on-tertiary">
                    %
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {economia > 0 && (
        <div className="mt-md flex items-center gap-sm rounded-lg bg-tertiary-container/40 px-md py-3">
          <span className="material-symbols-outlined text-tertiary">savings</span>
          <span className="text-body-md text-on-surface">
            Você está economizando{" "}
            <strong className="text-tertiary">{brl(economia)}</strong> nesse peso.
          </span>
        </div>
      )}

      {dica && dica.economia > economia && (
        <button
          onClick={() => setPeso(dica.peso)}
          className="mt-sm flex w-full items-center justify-between rounded-lg border border-dashed border-secondary/50 bg-cream-surface px-md py-3 text-left active:scale-[0.99]"
        >
          <span className="text-body-md text-on-surface">
            Leve <strong>{gramas(dica.peso)}</strong> e economize{" "}
            <strong className="text-secondary">{brl(dica.economia)}</strong>
          </span>
          <span className="material-symbols-outlined text-secondary">
            chevron_right
          </span>
        </button>
      )}

      <BarraAdicionar rotulo={gramas(peso)} total={total} onClick={adicionar} />
    </>
  );
}

// ---------- Produto por UNIDADE ----------
function SeletorUnidade({
  produto,
}: {
  produto: Extract<Produto, { tipo: "unidade" }>;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qtd, setQtd] = useState(1);
  const total = produto.preco * qtd;

  function adicionar() {
    add({
      key: produto.id,
      produtoId: produto.id,
      nome: produto.nome,
      icone: produto.icone,
      qtd,
      precoLinha: total,
    });
    router.push("/carrinho");
  }

  return (
    <>
      <p className="mt-sm font-headline-md text-headline-md text-primary">
        {produto.precoAntigo && (
          <span className="mr-2 text-body-md font-normal text-on-surface-variant line-through">
            {brl(produto.precoAntigo)}
          </span>
        )}
        {brl(produto.preco)}
        <span className="ml-1 text-body-md text-on-surface-variant">/un</span>
      </p>
      <p className="mt-1 flex items-center gap-1 text-label-md text-tertiary">
        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
        {brl(total * (1 - REGRAS.descontoPix))} com{" "}
        {Math.round(REGRAS.descontoPix * 100)}% no Pix
      </p>

      <div className="mt-lg flex items-center gap-md">
        <h2 className="font-headline-md text-headline-md text-primary">
          Quantidade
        </h2>
        <div className="flex items-center gap-md rounded-full border border-outline-variant px-2 py-1">
          <button
            onClick={() => setQtd((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary active:scale-90"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
          <span className="w-6 text-center text-body-lg font-semibold">
            {qtd}
          </span>
          <button
            onClick={() => setQtd((q) => q + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary active:scale-90"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      <BarraAdicionar
        rotulo={`${qtd} un`}
        total={total}
        onClick={adicionar}
      />
    </>
  );
}

function BarraAdicionar({
  rotulo,
  total,
  onClick,
}: {
  rotulo: string;
  total: number;
  onClick: () => void;
}) {
  return (
    <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-lg bg-primary px-lg py-4 text-on-primary shadow-lg transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-2 text-body-lg font-semibold">
          <span className="material-symbols-outlined">add_shopping_cart</span>
          Adicionar · {rotulo}
        </span>
        <span className="font-headline-md text-headline-md">{brl(total)}</span>
      </button>
    </div>
  );
}
