"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";

// Mascara dados sensíveis, como no design ("Math***", "73998112***")
function mascarar(valor: string, visiveis: number) {
  if (!valor) return "";
  const limpo = valor.trim();
  return limpo.slice(0, visiveis) + "***";
}

export default function Endereco() {
  const router = useRouter();
  const { dados, setDados } = useCart();
  const [endereco, setEndereco] = useState(dados.endereco ?? "");

  function confirmar() {
    setDados({ endereco: endereco.trim() });
    router.push("/checkout/revisao");
  }

  return (
    <main className="mx-auto min-h-full max-w-md pb-28">
      <header className="sticky top-0 z-50 flex items-center gap-md border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href="/checkout/identificacao"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">
          Adicione seu endereço
        </span>
      </header>

      <div className="px-md pt-lg">
        {/* Minhas informações (mascaradas) */}
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Minhas informações
        </h2>
        <div className="mt-sm rounded-xl bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-md">
              <InfoLinha
                icone="person"
                rotulo="Nome"
                valor={mascarar(dados.nome ?? "", 4)}
              />
              <InfoLinha
                icone="call"
                rotulo="Telefone"
                valor={mascarar((dados.telefone ?? "").replace(/\D/g, ""), 8)}
              />
            </div>
            <Link
              href="/checkout/identificacao"
              className="flex items-center gap-1 text-label-md text-tertiary"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Mudar
            </Link>
          </div>
          <div className="mt-md flex items-center gap-sm border-t border-outline-variant/20 pt-sm">
            <span className="material-symbols-outlined text-[18px] text-outline">
              lock
            </span>
            <p className="text-body-md italic text-on-surface-variant">
              Por motivos de segurança, ocultamos alguns de seus dados
            </p>
          </div>
        </div>

        {/* Endereço de entrega */}
        <h2 className="mt-lg font-headline-md text-headline-md text-on-surface">
          Endereço de entrega
        </h2>
        <div className="mt-sm rounded-xl border-2 border-primary bg-surface-container-lowest p-md">
          <div className="flex items-start gap-sm">
            <span className="material-symbols-outlined text-primary">
              location_on
            </span>
            <textarea
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              rows={2}
              placeholder="Rua, número, bairro, cidade - UF, CEP"
              className="w-full resize-none bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>
      </div>

      {/* Botão */}
      <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
        <button
          onClick={confirmar}
          disabled={endereco.trim().length < 8}
          className="w-full rounded-lg bg-primary px-lg py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Confirmar o endereço
        </button>
      </div>
    </main>
  );
}

function InfoLinha({
  icone,
  rotulo,
  valor,
}: {
  icone: string;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-sm">
      <span className="material-symbols-outlined text-primary">{icone}</span>
      <div className="leading-tight">
        <span className="block text-label-sm text-on-surface-variant">
          {rotulo}
        </span>
        <span className="block text-body-lg text-on-surface">
          {valor || "—"}
        </span>
      </div>
    </div>
  );
}
