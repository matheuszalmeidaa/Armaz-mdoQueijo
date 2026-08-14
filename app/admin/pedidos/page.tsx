"use client";

import { useState } from "react";
import { brl } from "@/lib/catalogo";
import {
  usePedidosLive,
  avancarStatus,
  type PedidoLive,
  type StatusLive,
} from "@/lib/pedidos-store";

const STATUS_CHIP: Record<StatusLive, string> = {
  Novo: "bg-error-container text-on-error-container",
  Preparando: "bg-warning-amber/20 text-secondary",
  "Em rota": "bg-primary-container/15 text-primary",
  Entregue: "bg-tertiary-container/40 text-tertiary",
};

const CANAIS = ["Todos", "Delivery", "PDV"] as const;

const hora = (ms: number) =>
  new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const subtotalDe = (p: PedidoLive) => p.itens.reduce((s, i) => s + i.preco, 0);

export default function AdminPedidos() {
  const pedidos = usePedidosLive();
  const [canal, setCanal] = useState<(typeof CANAIS)[number]>("Todos");
  const [selId, setSelId] = useState<string | null>(null);

  const lista =
    canal === "Todos" ? pedidos : pedidos.filter((p) => p.canal === canal);
  const sel = pedidos.find((p) => p.id === selId) ?? null;
  const totalDia = pedidos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Pedidos
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {pedidos.length} pedidos · {brl(totalDia)} — delivery e PDV.
          </p>
        </div>
        <div className="flex rounded-lg border border-outline-variant p-1">
          {CANAIS.map((c) => (
            <button
              key={c}
              onClick={() => setCanal(c)}
              className={`rounded-md px-4 py-1.5 text-label-md transition-colors ${
                canal === c ? "bg-primary text-on-primary" : "text-on-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {pedidos.length === 0 && (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-lg text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">
            receipt_long
          </span>
          <p className="mt-sm text-body-md text-on-surface-variant">
            Nenhum pedido ainda. Os pedidos do delivery e as vendas do PDV
            aparecem aqui automaticamente.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-lg lg:flex-row">
        {/* Lista */}
        <div
          className={
            sel ? "hidden lg:block lg:w-[360px] lg:flex-shrink-0" : "w-full"
          }
        >
          <div className="space-y-sm">
            {lista.map((p) => {
              const ativo = sel?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelId(p.id)}
                  className={`w-full rounded-xl border bg-surface-container-lowest p-md text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all active:scale-[0.99] ${
                    ativo
                      ? "border-primary ring-1 ring-primary"
                      : "border-outline-variant/10 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">#{p.numero}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-body-md text-on-surface">
                      {p.cliente}
                    </span>
                    <span className="font-headline-md text-headline-md text-primary">
                      {brl(p.total)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-sm text-caption text-on-surface-variant">
                    <span className="rounded-full bg-surface-container px-2 py-0.5">
                      {p.canal}
                    </span>
                    <span>
                      {p.itens.length} {p.itens.length === 1 ? "item" : "itens"}
                    </span>
                    <span>·</span>
                    <span>{hora(p.criadoEm)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhe */}
        {sel && (
          <div className="w-full lg:flex-1">
            <DetalhePedido pedido={sel} onFechar={() => setSelId(null)} />
          </div>
        )}
      </div>

      {!sel && pedidos.length > 0 && (
        <p className="text-caption text-on-surface-variant">
          Toque num pedido para ver os detalhes ao lado.
        </p>
      )}
    </div>
  );
}

function DetalhePedido({
  pedido,
  onFechar,
}: {
  pedido: PedidoLive;
  onFechar: () => void;
}) {
  const subtotal = subtotalDe(pedido);
  const extras = pedido.total - subtotal; // frete/descontos embutidos
  const ehEntrega = pedido.modo === "entrega";
  const podeAvancar = pedido.status !== "Entregue";

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:sticky lg:top-20">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
        <div className="flex items-center gap-sm">
          <button
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 lg:hidden"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Pedido #{pedido.numero}
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              {hora(pedido.criadoEm)} · {pedido.canal}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[pedido.status]}`}
          >
            {pedido.status}
          </span>
          <button
            onClick={onFechar}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container lg:flex"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="space-y-md p-md">
        {/* Cliente + entrega */}
        <div className="grid gap-sm sm:grid-cols-2">
          <InfoBloco icone="person" rotulo="Cliente">
            <p className="text-body-lg text-on-surface">{pedido.cliente}</p>
            {pedido.telefone && (
              <p className="text-label-sm text-on-surface-variant">
                {pedido.telefone}
              </p>
            )}
          </InfoBloco>
          <InfoBloco
            icone={ehEntrega ? "location_on" : "storefront"}
            rotulo={ehEntrega ? "Entrega" : "Retirada / Balcão"}
          >
            <p className="text-body-md text-on-surface">{pedido.entrega}</p>
          </InfoBloco>
        </div>

        {/* Itens */}
        <div>
          <h3 className="mb-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
            Itens
          </h3>
          <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/20">
            {pedido.itens.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-md py-2.5">
                <span className="text-body-md text-on-surface">
                  <span className="text-on-surface-variant">{it.qtd}</span>{" "}
                  {it.nome}
                </span>
                <span className="font-medium text-primary">{brl(it.preco)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Resumo */}
        <div className="rounded-lg bg-cream-surface p-md">
          <Linha rotulo="Subtotal" valor={brl(subtotal)} />
          {Math.abs(extras) >= 0.01 && (
            <Linha
              rotulo={extras > 0 ? "Frete / ajustes" : "Descontos"}
              valor={brl(extras)}
            />
          )}
          <div className="my-sm border-t border-dashed border-outline/20" />
          <Linha rotulo="Total" valor={brl(pedido.total)} destaque />
          <p className="mt-sm flex items-center gap-1 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">
              {pedido.pagamento.includes("Pix")
                ? "qr_code_2"
                : pedido.pagamento.includes("inheiro")
                  ? "payments"
                  : "credit_card"}
            </span>
            Pago em {pedido.pagamento}
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-sm">
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-3 text-label-md text-on-surface">
            <span className="material-symbols-outlined text-[20px]">print</span>
            Imprimir
          </button>
          <button
            onClick={() => podeAvancar && avancarStatus(pedido.id)}
            disabled={!podeAvancar}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-3 text-label-md font-semibold text-on-primary disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
            {podeAvancar ? "Avançar status" : "Entregue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBloco({
  icone,
  rotulo,
  children,
}: {
  icone: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/20 p-sm">
      <span className="mb-1 flex items-center gap-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">
          {icone}
        </span>
        {rotulo}
      </span>
      {children}
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          destaque
            ? "text-body-lg font-semibold text-on-surface"
            : "text-body-md text-on-surface-variant"
        }
      >
        {rotulo}
      </span>
      <span
        className={
          destaque
            ? "font-headline-md text-headline-md text-primary"
            : "text-body-md text-on-surface"
        }
      >
        {valor}
      </span>
    </div>
  );
}
