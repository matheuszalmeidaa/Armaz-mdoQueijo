"use client";

import Link from "next/link";
import { useUltimoPedido, type StatusLive } from "@/lib/pedidos-store";
import { useConfig } from "@/lib/config-store";
import { linkWhatsApp } from "@/lib/pedido-msg";

// As etapas espelham o status_venda da espinha (schema.sql).
const ETAPAS = [
  { icone: "receipt_long", titulo: "Aguardando aceitação", sub: "Pedido recebido" },
  { icone: "check", titulo: "Pedido aceito", sub: "O artesão aceitou seu pedido" },
  { icone: "restaurant", titulo: "Preparando", sub: "Sua cesta está sendo montada agora" },
  { icone: "person", titulo: "Aguardando entregador", sub: "" },
  { icone: "local_shipping", titulo: "Saiu para entrega", sub: "" },
  { icone: "home", titulo: "Entregue", sub: "" },
];

// StatusLive -> índice na timeline
const PASSO: Record<StatusLive, number> = {
  Novo: 0,
  Preparando: 2,
  "Em rota": 4,
  Entregue: 5,
};

const HERO: Record<StatusLive, { titulo: string; sub: string; icone: string }> = {
  Novo: { titulo: "Pedido recebido!", sub: "Estamos confirmando com a loja.", icone: "receipt_long" },
  Preparando: { titulo: "Preparando seu queijo...", sub: "O produtor está selecionando e embalando com carinho.", icone: "restaurant" },
  "Em rota": { titulo: "Saiu para entrega!", sub: "Seu pedido está a caminho.", icone: "local_shipping" },
  Entregue: { titulo: "Pedido entregue 🎉", sub: "Bom apetite! Obrigado pela preferência.", icone: "home" },
};

export default function AcompanhamentoPedido() {
  const pedido = useUltimoPedido();
  const cfg = useConfig();
  const status: StatusLive = pedido?.status ?? "Preparando";
  const passoAtual = PASSO[status];
  const hero = HERO[status];
  const numero = pedido?.numero ?? "----";

  // Previsão calculada: criação + tempo de preparo/entrega da config.
  const previsao = (() => {
    if (!pedido) return null;
    const f = (ms: number) =>
      new Date(ms).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return `${f(pedido.criadoEm + cfg.tempoEntregaMin * 60000)} - ${f(
      pedido.criadoEm + cfg.tempoEntregaMax * 60000
    )}`;
  })();

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
          {status !== "Entregue" && previsao && (
            <div className="mt-md flex items-center gap-sm rounded-lg border-l-4 border-primary bg-surface-container px-md py-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              <span className="text-body-md text-on-surface">
                {pedido?.modo === "retirada" ? "Pronto para retirada" : "Previsão de entrega"}{" "}
                <strong className="text-primary">{previsao}</strong>
              </span>
            </div>
          )}
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
