"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getProduto,
  precoPorKg,
  brl,
  gramas,
  type Produto,
} from "@/lib/catalogo";
import { useCart } from "@/lib/cart";
import { useConfig } from "@/lib/config-store";
import { useCatalogo } from "@/lib/catalogo-store";
import { useProdutoCfg, type Variante } from "@/lib/produto-config-store";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { badgesDe, BADGE_CLS } from "@/lib/badges";

export default function ProdutoPage() {
  const { id } = useParams<{ id: string }>();
  // Assina o catálogo vivo para re-renderizar quando carregar do Supabase.
  useCatalogo();
  const produto = getProduto(id);
  const cfgP = useProdutoCfg(id);
  const variantes = cfgP.variantes ?? [];
  const [varId, setVarId] = useState<string | null>(null);
  const [mostrarVideo, setMostrarVideo] = useState(false);

  // Seleciona a primeira variante automaticamente quando existirem.
  useEffect(() => {
    if (variantes.length && varId === null) setVarId(variantes[0].id);
  }, [cfgP, variantes, varId]);

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

  const variante = variantes.find((v) => v.id === varId);
  const imgSrc = variante?.fotoUrl || produto.img;

  return (
    <main className="min-h-full pb-32 lg:pb-lg">
      <Header nome="Armazém do Queijo" />

      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-2 lg:items-start lg:gap-xl lg:px-md lg:pt-lg">
        {/* Imagem / vídeo */}
        <div className="relative m-md overflow-hidden rounded-xl lg:m-0 lg:sticky lg:top-24">
          {mostrarVideo && cfgP.videoUrl ? (
            <video
              src={cfgP.videoUrl}
              controls
              autoPlay
              playsInline
              className="aspect-square w-full bg-black object-cover"
            />
          ) : (
            <ProdutoImagem
              src={imgSrc}
              alt={produto.nome}
              icone={produto.icone}
              className="aspect-square w-full"
              iconSize={96}
            />
          )}
          {cfgP.videoUrl && (
            <button
              onClick={() => setMostrarVideo((v) => !v)}
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-label-md text-white backdrop-blur active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">
                {mostrarVideo ? "image" : "play_circle"}
              </span>
              {mostrarVideo ? "Ver foto" : "Ver vídeo"}
            </button>
          )}
          {!mostrarVideo && produto.tipo === "peso" && (
            <span className="absolute left-3 top-3 rounded-full bg-warning-amber px-3 py-1 text-label-sm font-semibold text-on-secondary-fixed shadow-sm">
              Corte na hora
            </span>
          )}
          {!mostrarVideo && (
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
          )}
        </div>

        <div className="px-md lg:px-0">
          <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            {produto.categoria} · {produto.produtor}
          </p>
          <h1 className="mt-xs font-headline-lg text-headline-lg leading-tight text-on-surface">
            {produto.nome}
          </h1>

          {variantes.length > 0 && (
            <div className="mt-md">
              <h3 className="mb-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                Escolha a opção
              </h3>
              <div className="flex flex-wrap gap-sm">
                {variantes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVarId(v.id)}
                    className={`rounded-full border px-4 py-1.5 text-label-md transition-all active:scale-95 ${
                      varId === v.id
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface"
                    }`}
                  >
                    {v.nome}
                    {produto.tipo === "unidade" && v.preco != null
                      ? ` · ${brl(v.preco)}`
                      : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {produto.tipo === "peso" ? (
            <SeletorPeso produto={produto} variante={variante} />
          ) : (
            <SeletorUnidade produto={produto} variante={variante} />
          )}

          <Detalhes produto={produto} descricao={variante?.descricao} />
        </div>
      </div>
    </main>
  );
}

function Detalhes({
  produto,
  descricao,
}: {
  produto: Produto;
  descricao?: string;
}) {
  const texto = descricao || produto.descricao;
  return (
    <section className="mt-lg">
      {produto.nota && (
        <div className="mb-md rounded-lg border-l-4 border-warning-amber bg-cream-surface px-md py-3">
          <p className="text-body-md italic text-on-surface-variant">
            {produto.nota}
          </p>
        </div>
      )}

      {texto && (
        <>
          <h2 className="font-headline-md text-headline-md text-primary">
            Sobre este produto
          </h2>
          <p className="mt-sm text-body-md leading-relaxed text-on-surface-variant">
            {texto}
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
    <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-md py-sm">
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
      </div>
    </header>
  );
}

// ---------- Produto por PESO ----------
function SeletorPeso({
  produto,
  variante,
}: {
  produto: Extract<Produto, { tipo: "peso" }>;
  variante?: Variante;
}) {
  const { add } = useCart();
  const router = useRouter();
  const cfg = useConfig();
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
      key: `${produto.id}-${peso}${variante ? `-${variante.id}` : ""}`,
      produtoId: produto.id,
      nome: variante ? `${produto.nome} — ${variante.nome}` : produto.nome,
      icone: produto.icone,
      pesoG: peso,
      qtd: 1,
      precoLinha: total,
    });
    router.push("/loja");
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
        {brl(total * (1 - cfg.descontoPix))} com{" "}
        {Math.round(cfg.descontoPix * 100)}% no Pix
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
  variante,
}: {
  produto: Extract<Produto, { tipo: "unidade" }>;
  variante?: Variante;
}) {
  const { add } = useCart();
  const router = useRouter();
  const cfg = useConfig();
  const [qtd, setQtd] = useState(1);
  const precoUnit = variante?.preco ?? produto.preco;
  const total = precoUnit * qtd;

  function adicionar() {
    add({
      key: variante ? `${produto.id}-${variante.id}` : produto.id,
      produtoId: produto.id,
      nome: variante ? `${produto.nome} — ${variante.nome}` : produto.nome,
      icone: produto.icone,
      qtd,
      precoLinha: total,
    });
    router.push("/loja");
  }

  return (
    <>
      <p className="mt-sm font-headline-md text-headline-md text-primary">
        {produto.precoAntigo && !variante?.preco && (
          <span className="mr-2 text-body-md font-normal text-on-surface-variant line-through">
            {brl(produto.precoAntigo)}
          </span>
        )}
        {brl(precoUnit)}
        <span className="ml-1 text-body-md text-on-surface-variant">/un</span>
      </p>
      <p className="mt-1 flex items-center gap-1 text-label-md text-tertiary">
        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
        {brl(total * (1 - cfg.descontoPix))} com{" "}
        {Math.round(cfg.descontoPix * 100)}% no Pix
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
    <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md lg:static lg:left-auto lg:z-auto lg:mt-lg lg:max-w-none lg:translate-x-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
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
