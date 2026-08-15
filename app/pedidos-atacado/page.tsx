"use client";

import Link from "next/link";
import { useConfig } from "@/lib/config-store";

export default function Atacado() {
  const cfg = useConfig();
  const zap = cfg.whatsapp.replace(/\D/g, "");

  return (
    <main className="mx-auto flex min-h-dvh max-w-[28rem] flex-col px-md py-xl">
      <header className="flex items-center gap-sm">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-display text-headline-md text-primary">
          Atacado
        </span>
      </header>

      <div className="mt-lg flex flex-col items-center rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-lg text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/15 text-primary">
          <span className="material-symbols-outlined text-[32px]">inventory_2</span>
        </div>
        <h1 className="mt-md font-headline-lg text-headline-lg text-on-surface">
          Compra no atacado
        </h1>
        <p className="mt-sm text-body-md text-on-surface-variant">
          Preços especiais por volume — por quilo ou por peça, com desconto a
          partir de certa quantidade. O catálogo de atacado está sendo montado;
          por enquanto, faça seu pedido direto com a gente.
        </p>

        {zap ? (
          <a
            href={`https://wa.me/55${zap}?text=${encodeURIComponent("Olá! Quero fazer um pedido no atacado.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-lg flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">chat</span>
            Pedir atacado no WhatsApp
          </a>
        ) : (
          <p className="mt-lg text-label-md text-on-surface-variant">
            Configure o WhatsApp da loja para receber pedidos de atacado.
          </p>
        )}

        <Link
          href="/loja"
          className="mt-sm text-label-md text-secondary underline underline-offset-2"
        >
          Ver o catálogo do varejo
        </Link>
      </div>
    </main>
  );
}
