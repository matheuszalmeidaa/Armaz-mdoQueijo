"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export default function Identificacao() {
  const router = useRouter();
  const { dados, setDados } = useCart();
  const [nome, setNome] = useState(dados.nome ?? "");
  const [telefone, setTelefone] = useState(dados.telefone ?? "");

  const valido = nome.trim().length > 2 && telefone.replace(/\D/g, "").length >= 10;

  function continuar() {
    setDados({ nome: nome.trim(), telefone });
    router.push("/checkout/endereco");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col pb-28">
      <header className="sticky top-0 z-50 flex items-center gap-md border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href="/carrinho"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-display text-headline-md text-primary">
          Fusqueijão
        </span>
      </header>

      <div className="px-md pt-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary">
          <span className="material-symbols-outlined text-[32px]">
            person_add
          </span>
        </div>
        <h1 className="mt-md font-headline-lg text-headline-lg text-on-surface">
          Bem-vindo à Roça!
        </h1>
        <p className="mt-xs text-body-md text-on-surface-variant">
          Para continuarmos sua entrega, precisamos te conhecer um pouquinho
          melhor.
        </p>

        {/* Nome */}
        <label className="mt-lg block text-label-md text-on-surface">
          Nome Completo
        </label>
        <div className="mt-sm flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-3 focus-within:border-primary">
          <span className="material-symbols-outlined text-on-surface-variant">
            person
          </span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        {/* Telefone */}
        <label className="mt-lg block text-label-md text-on-surface">
          Telefone / WhatsApp
        </label>
        <div className="mt-sm flex items-center gap-sm">
          <div className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-3">
            <span>🇧🇷</span>
            <span className="text-body-lg">+55</span>
          </div>
          <div className="flex flex-grow items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-3 focus-within:border-primary">
            <span className="material-symbols-outlined text-on-surface-variant">
              call
            </span>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              inputMode="tel"
              placeholder="(11) 99999-9999"
              className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* Nota de segurança */}
        <div className="mt-lg flex items-start gap-sm rounded-lg border border-dashed border-secondary/40 bg-cream-surface px-md py-3">
          <span className="material-symbols-outlined text-secondary">
            shield
          </span>
          <p className="text-body-md text-on-surface-variant">
            Seus dados estão seguros conosco. Usamos seu telefone apenas para
            atualizações do seu pedido de queijos e iguarias da roça.
          </p>
        </div>
      </div>

      {/* Botão */}
      <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
        <button
          onClick={continuar}
          disabled={!valido}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-lg py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Continuar
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </main>
  );
}
