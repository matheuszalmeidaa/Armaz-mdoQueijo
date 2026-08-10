"use client";

import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/catalogo";
import {
  usePedidosLive,
  avancarStatus,
  adicionarPedido,
  FLUXO,
  type StatusLive,
  type PedidoLive,
} from "@/lib/pedidos-store";

const COL_STYLE: Record<StatusLive, string> = {
  Novo: "border-error/40",
  Preparando: "border-warning-amber/50",
  "Em rota": "border-primary/40",
  Entregue: "border-tertiary/40",
};

const PROX_ROTULO: Record<StatusLive, string> = {
  Novo: "Aceitar e preparar",
  Preparando: "Saiu para entrega",
  "Em rota": "Marcar entregue",
  Entregue: "",
};

function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.35);
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

const AMOSTRAS = [
  { cliente: "Beatriz Souza", modo: "entrega" as const, entrega: "Rua do Sol, 88 — Centro", pagamento: "Maquineta (cartão)", itens: [{ nome: "Gouda Pesto Verde", qtd: "200g", preco: 82 }], total: 90 },
  { cliente: "Diego Martins", modo: "retirada" as const, entrega: "Retirada — Loja Bairro", pagamento: "Pix", itens: [{ nome: "Tábua de Frios Premium", qtd: "1 un", preco: 124.9 }], total: 124.9 },
  { cliente: "Paula Andrade", modo: "entrega" as const, entrega: "Av. Central, 1500 — Jardim", pagamento: "Maquineta (débito)", itens: [{ nome: "Queijo Morro Azul", qtd: "120g", preco: 64.8 }, { nome: "Geleia de Amora", qtd: "1 un", preco: 28.5 }], total: 105.3 },
];

export default function Recebimento() {
  const pedidos = usePedidosLive();
  const [somOn, setSomOn] = useState(true);
  const prevLen = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevLen.current !== null && pedidos.length > prevLen.current) {
      if (somOn) beep();
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    }
    prevLen.current = pedidos.length;
  }, [pedidos.length, somOn]);

  const novos = pedidos.filter((p) => p.status === "Novo").length;
  const ativos = pedidos.filter((p) => p.status !== "Entregue");

  function simular() {
    const a = AMOSTRAS[Math.floor(Math.random() * AMOSTRAS.length)];
    adicionarPedido({ ...a, canal: "Delivery" });
  }

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="flex items-center gap-sm font-headline-lg text-headline-lg text-primary">
            Recebimento
            {novos > 0 && (
              <span className={`rounded-full bg-error px-2.5 py-0.5 text-label-sm font-bold text-on-error ${flash ? "animate-pulse" : ""}`}>
                {novos} novo{novos === 1 ? "" : "s"}
              </span>
            )}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Pedidos do delivery ao vivo. Quando entra um novo, toca o alerta.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={() => setSomOn((v) => !v)}
            className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-label-md ${
              somOn
                ? "border-tertiary/40 text-tertiary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {somOn ? "notifications_active" : "notifications_off"}
            </span>
            Som {somOn ? "ligado" : "desligado"}
          </button>
          <button
            onClick={simular}
            className="flex items-center gap-1 rounded-lg bg-primary px-md py-2 text-label-md text-on-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add_alert</span>
            Simular pedido
          </button>
        </div>
      </div>

      {ativos.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center text-on-surface-variant">
          <span className="material-symbols-outlined mb-sm text-[56px] text-outline">
            inbox
          </span>
          <p className="text-body-md">Nenhum pedido ativo. Faça um pedido no delivery ou use "Simular pedido".</p>
        </div>
      ) : (
        <div className="flex gap-md overflow-x-auto pb-2">
          {FLUXO.map((status) => {
            const daColuna = pedidos.filter((p) => p.status === status);
            return (
              <div key={status} className="w-[280px] flex-shrink-0">
                <div className="mb-sm flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    {status}
                  </h2>
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                    {daColuna.length}
                  </span>
                </div>
                <div className="space-y-sm">
                  {daColuna.map((p) => (
                    <CartaoPedido key={p.id} pedido={p} destacar={status === "Novo"} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartaoPedido({
  pedido,
  destacar,
}: {
  pedido: PedidoLive;
  destacar: boolean;
}) {
  const hora = new Date(pedido.criadoEm).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      className={`rounded-xl border bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
        destacar ? "border-error/50 ring-1 ring-error/30" : COL_STYLE[pedido.status]
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-primary">#{pedido.numero}</span>
        <span className="text-caption text-on-surface-variant">{hora}</span>
      </div>
      <p className="mt-0.5 text-body-md text-on-surface">{pedido.cliente}</p>
      <p className="flex items-center gap-1 text-caption text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px]">
          {pedido.modo === "retirada" ? "storefront" : "local_shipping"}
        </span>
        {pedido.entrega}
      </p>

      <ul className="mt-sm space-y-0.5 border-t border-outline-variant/20 pt-sm">
        {pedido.itens.map((it, i) => (
          <li key={i} className="flex justify-between text-label-md text-on-surface">
            <span className="truncate">
              <span className="text-on-surface-variant">{it.qtd}</span> {it.nome}
            </span>
            <span className="ml-2 whitespace-nowrap">{brl(it.preco)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-sm flex items-center justify-between border-t border-outline-variant/20 pt-sm">
        <span className="text-caption text-on-surface-variant">{pedido.pagamento}</span>
        <span className="font-headline-md text-headline-md text-primary">
          {brl(pedido.total)}
        </span>
      </div>

      {pedido.status !== "Entregue" && (
        <button
          onClick={() => avancarStatus(pedido.id)}
          className="mt-sm flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-label-md font-semibold text-on-primary active:scale-[0.98]"
        >
          {PROX_ROTULO[pedido.status]}
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
