"use client";

import Link from "next/link";

// As etapas espelham o status_venda da espinha (schema.sql):
// aberta -> paga -> em_preparo -> (aguardando entregador) -> em_rota -> concluida
const ETAPAS = [
  { icone: "receipt_long", titulo: "Aguardando aceitação", sub: "Pedido recebido" },
  { icone: "check", titulo: "Pedido aceito", sub: "O artesão aceitou seu pedido" },
  { icone: "restaurant", titulo: "Preparando", sub: "Sua cesta está sendo montada agora" },
  { icone: "person", titulo: "Aguardando entregador", sub: "" },
  { icone: "local_shipping", titulo: "Saiu para entrega", sub: "" },
  { icone: "home", titulo: "Entregue", sub: "" },
];

// Mock: sem Supabase, fixamos o passo atual em "Preparando".
const PASSO_ATUAL = 2;

export default function AcompanhamentoPedido() {
  const numero = "#" + Math.floor(1000 + Math.random() * 9000);

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-24">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href="/loja"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">
          Seu Pedido
        </span>
        <span className="text-label-sm text-on-surface-variant">
          Pedido {numero}
        </span>
      </header>

      {/* Status atual */}
      <section className="px-md pt-md">
        <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest p-lg text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary-container/5 text-primary">
            <span className="material-symbols-outlined text-[32px]">
              restaurant
            </span>
          </div>
          <h1 className="mt-md font-headline-lg text-headline-lg text-primary">
            Preparando seu queijo...
          </h1>
          <p className="mt-xs text-body-md text-on-surface-variant">
            O produtor artesanal está selecionando e embalando seus produtos com
            carinho.
          </p>
          <div className="mt-md flex items-center gap-sm rounded-lg border-l-4 border-primary bg-surface-container px-md py-2">
            <span className="material-symbols-outlined text-primary">
              schedule
            </span>
            <span className="text-body-md text-on-surface">
              Previsão de Entrega{" "}
              <strong className="text-primary">12:45 - 13:00</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-md pt-lg">
        <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
          Etapas da sua cesta
        </h2>
        <ol className="relative">
          {ETAPAS.map((e, i) => {
            const concluido = i < PASSO_ATUAL;
            const atual = i === PASSO_ATUAL;
            const ultimo = i === ETAPAS.length - 1;
            return (
              <li key={i} className="flex gap-md pb-lg last:pb-0">
                {/* Marcador + linha */}
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
                      className={`mt-1 w-0.5 flex-grow ${
                        concluido
                          ? "bg-primary"
                          : "border-l-2 border-dashed border-outline/30"
                      }`}
                      style={{ minHeight: 28 }}
                    />
                  )}
                </div>
                {/* Texto */}
                <div className={`pt-1.5 ${atual ? "" : "opacity-90"}`}>
                  <p
                    className={`text-body-lg ${
                      atual || concluido
                        ? "font-semibold text-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {e.titulo}
                  </p>
                  {e.sub && (
                    <p className="text-body-md text-on-surface-variant">
                      {e.sub}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Ajuda */}
      <section className="px-md pt-md">
        <a
          href="#"
          className="flex items-center justify-center gap-sm rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-md py-3 text-body-md text-on-surface active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-tertiary">chat</span>
          Precisa de ajuda? Falar no WhatsApp
        </a>
      </section>
    </main>
  );
}
