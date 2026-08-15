"use client";

import Link from "next/link";
import { useUltimoPedido, type StatusLive } from "@/lib/pedidos-store";
import { useConfig } from "@/lib/config-store";
import { linkWhatsApp } from "@/lib/pedido-msg";

type Etapa = { icone: string; titulo: string; sub: string };

// Etapas de ENTREGA
const ETAPAS_ENTREGA: Etapa[] = [
  { icone: "receipt_long", titulo: "Pedido recebido", sub: "Aguardando a loja aceitar" },
  { icone: "inventory_2", titulo: "Pedido separado", sub: "Montando sua cesta com carinho" },
  { icone: "local_shipping", titulo: "Saiu para entrega", sub: "A caminho do seu endereço" },
  { icone: "home", titulo: "Entregue", sub: "Bom apetite!" },
];
const PASSO_ENTREGA: Record<StatusLive, number> = {
  Novo: 0,
  Preparando: 1,
  "Em rota": 2,
  Entregue: 3,
};
const HERO_ENTREGA: Record<StatusLive, Etapa> = {
  Novo: { titulo: "Pedido recebido!", sub: "Estamos confirmando com a loja.", icone: "receipt_long" },
  Preparando: { titulo: "Separando seu pedido...", sub: "O produtor está selecionando e embalando.", icone: "inventory_2" },
  "Em rota": { titulo: "Saiu para entrega!", sub: "Seu pedido está a caminho.", icone: "local_shipping" },
  Entregue: { titulo: "Pedido entregue 🎉", sub: "Bom apetite! Obrigado pela preferência.", icone: "home" },
};

// Etapas de RETIRADA (sem "saiu para entrega")
const ETAPAS_RETIRADA: Etapa[] = [
  { icone: "receipt_long", titulo: "Pedido recebido", sub: "Aguardando a loja aceitar" },
  { icone: "inventory_2", titulo: "Pedido separado", sub: "Pronto para retirar no balcão" },
  { icone: "storefront", titulo: "Retirado", sub: "Obrigado pela preferência!" },
];
const PASSO_RETIRADA: Record<StatusLive, number> = {
  Novo: 0,
  Preparando: 1,
  "Em rota": 2,
  Entregue: 2,
};
const HERO_RETIRADA: Record<StatusLive, Etapa> = {
  Novo: { titulo: "Pedido recebido!", sub: "Estamos confirmando com a loja.", icone: "receipt_long" },
  Preparando: { titulo: "Separando seu pedido...", sub: "Já avisamos quando estiver pronto.", icone: "inventory_2" },
  "Em rota": { titulo: "Pronto para retirar! 🎉", sub: "Pode vir buscar no balcão.", icone: "storefront" },
  Entregue: { titulo: "Pedido retirado 🎉", sub: "Obrigado pela preferência!", icone: "storefront" },
};

export default function AcompanhamentoPedido() {
  const pedido = useUltimoPedido();
  const cfg = useConfig();
  const status: StatusLive = pedido?.status ?? "Novo";
  const retirada = pedido?.modo === "retirada";
  const ETAPAS = retirada ? ETAPAS_RETIRADA : ETAPAS_ENTREGA;
  const passoAtual = (retirada ? PASSO_RETIRADA : PASSO_ENTREGA)[status];
  const hero = (retirada ? HERO_RETIRADA : HERO_ENTREGA)[status];
  const numero = pedido?.numero ?? "----";

  const ajudaHref =
    linkWhatsApp(
      cfg.whatsapp,
      `Olá! Preciso de ajuda com meu pedido #${numero}.`
    ) ?? undefined;

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-24">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link href="/loja" className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">Seu Pedido</span>
        <span className="text-label-sm text-on-surface-variant">Pedido #{numero}</span>
      </header>

      {/* Status atual */}
      <section className="px-md pt-md">
        <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest p-lg text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary-container/5 text-primary">
            <span className="material-symbols-outlined text-[32px]">{hero.icone}</span>
          </div>
          <h1 className="mt-md font-headline-lg text-headline-lg text-primary">
            {hero.titulo}
          </h1>
          <p className="mt-xs text-body-md text-on-surface-variant">{hero.sub}</p>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-md pt-lg">
        <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
          Etapas da sua cesta
        </h2>
        <ol className="relative">
          {ETAPAS.map((e, i) => {
            const concluido = i < passoAtual;
            const atual = i === passoAtual;
            const ultimo = i === ETAPAS.length - 1;
            return (
              <li key={i} className="flex gap-md pb-lg last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      concluido
                        ? "bg-primary text-on-primary"
                        : atual
                          ? "border-2 border-primary bg-primary-container/10 text-primary"
                          : "bg-surface-container text-outline"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {concluido ? "check" : e.icone}
                    </span>
                  </span>
                  {!ultimo && (
                    <span
                      className={`mt-1 w-0.5 flex-grow ${concluido ? "bg-primary" : "border-l-2 border-dashed border-outline/30"}`}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </div>
                <div className={`pt-1.5 ${atual ? "" : "opacity-90"}`}>
                  <p className={`text-body-lg ${atual || concluido ? "font-semibold text-primary" : "text-on-surface-variant"}`}>
                    {e.titulo}
                  </p>
                  {e.sub && <p className="text-body-md text-on-surface-variant">{e.sub}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Ajuda */}
      <section className="px-md pt-md">
        <a
          href={ajudaHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-sm rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-md py-3 text-body-md text-on-surface active:scale-[0.99] ${
            ajudaHref ? "" : "pointer-events-none opacity-40"
          }`}
        >
          <span className="material-symbols-outlined text-tertiary">chat</span>
          Precisa de ajuda? Falar no WhatsApp
        </a>
      </section>
    </main>
  );
}
