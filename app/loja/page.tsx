"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOGO, CATEGORIAS, brl, precoBase, type Produto } from "@/lib/catalogo";
import { useCart } from "@/lib/cart";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { badgesDe, BADGE_CLS } from "@/lib/badges";
import { useConfig, lojaAbertaAgora, type Redes } from "@/lib/config-store";

// Monta os links de redes/whatsapp para o aviso de loja fechada.
function linksRedes(redes: Redes, whatsapp: string) {
  const links: { icone: string; rotulo: string; href: string }[] = [];
  const zap = whatsapp.replace(/\D/g, "");
  if (zap) links.push({ icone: "chat", rotulo: "WhatsApp", href: `https://wa.me/55${zap}` });
  if (redes.instagram) {
    const ig = redes.instagram.trim();
    const href = ig.startsWith("http")
      ? ig
      : `https://instagram.com/${ig.replace(/^@/, "")}`;
    links.push({ icone: "photo_camera", rotulo: "Instagram", href });
  }
  if (redes.facebook) {
    const fb = redes.facebook.trim();
    links.push({ icone: "thumb_up", rotulo: "Facebook", href: fb.startsWith("http") ? fb : `https://facebook.com/${fb}` });
  }
  return links;
}

export default function LojaHome() {
  const [cat, setCat] = useState<string>("Todos");
  const { qtdItens } = useCart();
  const cfg = useConfig();
  const status = lojaAbertaAgora(cfg);
  const [avisoVisto, setAvisoVisto] = useState(false);

  const lista =
    cat === "Todos" ? CATALOGO : CATALOGO.filter((p) => p.categoria === cat);

  return (
    <main className="min-h-full pb-24">
      {/* Cabeçalho (barra full-width, conteúdo centralizado) */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-md py-sm">
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="font-display text-headline-lg tracking-tight text-primary">
            Armazém do Queijo
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

      {!status.aberta && (
        <div className="flex items-center justify-center gap-sm bg-primary px-md py-2 text-center text-label-md text-on-primary">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          Loja fechada — {status.motivo} Você pode montar o pedido e enviar quando
          abrirmos.
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <section className="px-md pt-md">
          <div className="flex h-[150px] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-t from-primary to-primary-container/40 p-md lg:h-[240px] lg:p-lg">
            <span className="w-fit rounded-full bg-warning-amber px-2 py-0.5 text-label-sm font-semibold text-on-secondary-fixed">
              SUGESTÃO DO DIA
            </span>
            <h2 className="mt-2 font-headline-md text-headline-md leading-tight text-cream-surface lg:text-headline-lg">
              Queijo Canastra com Mel de Laranjeira
            </h2>
          </div>
        </section>

        {/* Categorias */}
        <section className="mt-lg">
          <div className="no-scrollbar flex gap-sm overflow-x-auto px-md lg:flex-wrap">
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
          <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {lista.map((p) => (
              <CardProduto key={p.id} produto={p} />
            ))}
          </div>
        </section>
      </div>

      {/* Aviso de loja fechada — X fecha e deixa navegar o catálogo */}
      {!status.aberta && !avisoVisto && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-md sm:items-center"
          onClick={() => setAvisoVisto(true)}
        >
          <div
            className="w-full max-w-[26rem] rounded-2xl bg-surface-container-lowest p-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20 text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <button
                onClick={() => setAvisoVisto(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
                aria-label="Fechar aviso"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <h2 className="mt-sm font-headline-md text-headline-md text-on-surface">
              Estamos fechados no momento
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {status.motivo} Fique à vontade para ver o catálogo — é só fechar
              este aviso.
            </p>

            {linksRedes(cfg.redes, cfg.whatsapp).length > 0 && (
              <>
                <p className="mt-md text-label-sm uppercase tracking-wide text-on-surface-variant">
                  Enquanto isso, siga a gente
                </p>
                <div className="mt-sm flex flex-wrap gap-sm">
                  {linksRedes(cfg.redes, cfg.whatsapp).map((l) => (
                    <a
                      key={l.rotulo}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-primary active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {l.icone}
                      </span>
                      {l.rotulo}
                    </a>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setAvisoVisto(true)}
              className="mt-lg w-full rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
            >
              Ver catálogo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CardProduto({ produto }: { produto: Produto }) {
  const porPeso = produto.tipo === "peso";
  const badges = badgesDe(produto.id);
  const esgotado = badges.some((b) => b.tipo === "esgotado");
  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all active:scale-[0.98]"
    >
      <div className="relative">
        <ProdutoImagem
          src={produto.img}
          alt={produto.nome}
          icone={produto.icone}
          className={`aspect-square w-full ${esgotado ? "opacity-50 grayscale" : ""}`}
        />
        {badges.length > 0 && (
          <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
            {badges.map((b) => (
              <span
                key={b.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${BADGE_CLS[b.tipo]}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
      </div>
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
