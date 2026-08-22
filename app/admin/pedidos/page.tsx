"use client";

import { useState } from "react";
import { brl } from "@/lib/catalogo";
import {
  usePedidosLive,
  avancarStatus,
  definirStatus,
  marcarPago,
  excluirPedido,
  FLUXO,
  type PedidoLive,
  type StatusLive,
} from "@/lib/pedidos-store";
import { comandaPedidoLive, linkWhatsApp } from "@/lib/pedido-msg";

const STATUS_CHIP: Record<StatusLive, string> = {
  Novo: "bg-error-container text-on-error-container",
  Preparando: "bg-warning-amber/20 text-secondary",
  "Em rota": "bg-primary-container/15 text-primary",
  Entregue: "bg-tertiary-container/40 text-tertiary",
};

const CANAIS = ["Todos", "Delivery", "PDV", "Atacado"] as const;
const ETAPAS = ["Todos", ...FLUXO] as const;

const hora = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const subtotalDe = (p: PedidoLive) => p.itens.reduce((s, i) => s + i.preco, 0);

export default function AdminPedidos() {
  const pedidos = usePedidosLive();
  const [canal, setCanal] = useState<(typeof CANAIS)[number]>("Todos");
  const [etapa, setEtapa] = useState<(typeof ETAPAS)[number]>("Todos");
  const [selId, setSelId] = useState<string | null>(null);

  const lista = pedidos.filter(
    (p) =>
      (canal === "Todos" || p.canal === canal) &&
      (etapa === "Todos" || p.status === etapa)
  );
  const sel = pedidos.find((p) => p.id === selId) ?? null;
  const totalDia = pedidos.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Pedidos</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {pedidos.length} pedidos · {brl(totalDia)} — delivery, PDV e atacado.
        </p>
      </div>

      {/* Filtros */}
      <div className="space-y-sm">
        <div className="no-scrollbar flex gap-sm overflow-x-auto">
          {ETAPAS.map((e) => (
            <button
              key={e}
              onClick={() => setEtapa(e)}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-label-md transition-all active:scale-95 ${
                etapa === e
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex gap-sm overflow-x-auto">
          {CANAIS.map((c) => (
            <button
              key={c}
              onClick={() => setCanal(c)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-label-sm transition-colors ${
                canal === c
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-lg text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">
            receipt_long
          </span>
          <p className="mt-sm text-body-md text-on-surface-variant">
            Nenhum pedido nesta etapa. Delivery, PDV e atacado aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-sm">
          {lista.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelId(p.id)}
              className="flex w-full items-center gap-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all hover:border-primary/30 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-sm">
                  <span className="font-medium text-on-surface">{p.cliente}</span>
                  {p.pago && (
                    <span className="rounded-full bg-tertiary-container/40 px-2 py-0.5 text-[10px] font-semibold text-tertiary">
                      PAGO
                    </span>
                  )}
                </div>
                <p className="text-label-sm text-on-surface-variant">
                  {p.telefone || "sem telefone"} · #{p.numero}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-caption text-on-surface-variant">
                  <span className="rounded-full bg-surface-container px-2 py-0.5">
                    {p.canal}
                  </span>
                  {p.agendado && (
                    <span className="rounded-full bg-secondary-container px-2 py-0.5 font-semibold text-on-secondary-container">
                      Agendado
                    </span>
                  )}
                  <span>· {hora(p.criadoEm)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[p.status]}`}
                >
                  {p.status}
                </span>
                <span className="font-headline-md text-headline-md text-primary">
                  {brl(p.total)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Painel lateral (drawer à direita) */}
      {sel && (
        <PainelPedido pedido={sel} onFechar={() => setSelId(null)} />
      )}
    </div>
  );
}

function PainelPedido({
  pedido,
  onFechar,
}: {
  pedido: PedidoLive;
  onFechar: () => void;
}) {
  const [copiado, setCopiado] = useState("");
  const subtotal = subtotalDe(pedido);
  const extras = pedido.total - subtotal;
  const ehEntrega = pedido.modo === "entrega";
  const podeAvancar = pedido.status !== "Entregue";
  const zapCliente = (pedido.telefone ?? "").replace(/\D/g, "");

  function copiar(texto: string, marca: string) {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(marca);
      setTimeout(() => setCopiado(""), 1500);
    });
  }

  const infoTexto =
    `Pedido #${pedido.numero} — ${pedido.canal}\n` +
    `Cliente: ${pedido.cliente}${pedido.telefone ? ` (${pedido.telefone})` : ""}\n` +
    `${ehEntrega ? "Entrega" : "Retirada"}: ${pedido.entrega}\n` +
    pedido.itens.map((i) => `• ${i.qtd} ${i.nome} — ${brl(i.preco)}`).join("\n") +
    `\nTotal: ${brl(pedido.total)} · ${pedido.pagamento}`;

  function enviarCliente() {
    const texto =
      `Olá, ${pedido.cliente}! Sobre seu pedido #${pedido.numero} no Armazém do Queijo:\n` +
      `Status: ${pedido.status}.\n` +
      `Total: ${brl(pedido.total)}.`;
    const link = linkWhatsApp(pedido.telefone ?? "", texto);
    if (link) window.open(link, "_blank");
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onFechar}
        aria-hidden
      />
      {/* Drawer */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[30rem] flex-col overflow-y-auto bg-surface shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-surface px-md py-sm">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Pedido #{pedido.numero}
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              {hora(pedido.criadoEm)} · {pedido.canal}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <span
              className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[pedido.status]}`}
            >
              {pedido.status}
            </span>
            <button
              onClick={onFechar}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-md p-md">
          {/* Cliente */}
          <div className="rounded-lg border border-outline-variant/20 p-md">
            <p className="text-body-lg font-medium text-on-surface">
              {pedido.cliente}
            </p>
            {pedido.telefone ? (
              <a
                href={zapCliente ? `https://wa.me/55${zapCliente}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 flex items-center gap-1 text-label-md text-tertiary"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                {pedido.telefone}
              </a>
            ) : (
              <p className="text-label-sm text-on-surface-variant">sem telefone</p>
            )}
            <p className="mt-sm flex items-center gap-1 text-body-md text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                {ehEntrega ? "location_on" : "storefront"}
              </span>
              {pedido.entrega}
            </p>
          </div>

          {/* Itens */}
          <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/20">
            {pedido.itens.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-md py-2.5">
                <span className="text-body-md text-on-surface">
                  <span className="text-on-surface-variant">{it.qtd}</span> {it.nome}
                </span>
                <span className="font-medium text-primary">{brl(it.preco)}</span>
              </li>
            ))}
          </ul>

          {/* Resumo */}
          <div className="rounded-lg bg-cream-surface p-md">
            <div className="flex justify-between py-0.5 text-body-md text-on-surface-variant">
              <span>Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            {Math.abs(extras) >= 0.01 && (
              <div className="flex justify-between py-0.5 text-body-md text-on-surface-variant">
                <span>{extras > 0 ? "Frete / ajustes" : "Descontos"}</span>
                <span>{brl(extras)}</span>
              </div>
            )}
            <div className="my-sm border-t border-dashed border-outline/20" />
            <div className="flex justify-between">
              <span className="text-body-lg font-semibold">Total</span>
              <span className="font-headline-md text-headline-md text-primary">
                {brl(pedido.total)}
              </span>
            </div>
            <p className="mt-sm flex items-center justify-between text-label-md">
              <span className="text-on-surface-variant">
                Pagamento: {pedido.pagamento || "—"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-label-sm font-semibold ${
                  pedido.pago
                    ? "bg-tertiary-container/40 text-tertiary"
                    : "bg-error-container text-on-error-container"
                }`}
              >
                {pedido.pago ? "Pago" : "Não pago"}
              </span>
            </p>
          </div>

          {/* Etapas (status) */}
          <div>
            <p className="mb-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
              Etapa
            </p>
            <div className="flex flex-wrap gap-1">
              {FLUXO.map((s) => (
                <button
                  key={s}
                  onClick={() => definirStatus(pedido.id, s)}
                  className={`rounded-full px-3 py-1.5 text-label-sm ${
                    pedido.status === s
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-sm">
            <AcaoBtn
              icone={pedido.pago ? "check_circle" : "payments"}
              rotulo={pedido.pago ? "Pago ✓" : "Marcar pago"}
              onClick={() => marcarPago(pedido.id, !pedido.pago)}
              destaque={!pedido.pago}
            />
            <AcaoBtn
              icone="arrow_forward"
              rotulo={podeAvancar ? "Avançar etapa" : "Entregue"}
              onClick={() => podeAvancar && avancarStatus(pedido.id)}
              desabilitado={!podeAvancar}
            />
            <AcaoBtn
              icone="receipt_long"
              rotulo={copiado === "comanda" ? "Copiada!" : "Criar comanda"}
              onClick={() => copiar(comandaPedidoLive(pedido), "comanda")}
            />
            <AcaoBtn
              icone="content_copy"
              rotulo={copiado === "info" ? "Copiado!" : "Copiar dados"}
              onClick={() => copiar(infoTexto, "info")}
            />
            {zapCliente && (
              <AcaoBtn
                icone="chat"
                rotulo="Enviar ao cliente"
                onClick={enviarCliente}
              />
            )}
            <AcaoBtn
              icone="delete"
              rotulo="Excluir"
              perigo
              onClick={() => {
                if (confirm(`Excluir o pedido #${pedido.numero}?`)) {
                  excluirPedido(pedido.id);
                  onFechar();
                }
              }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function AcaoBtn({
  icone,
  rotulo,
  onClick,
  destaque,
  perigo,
  desabilitado,
}: {
  icone: string;
  rotulo: string;
  onClick: () => void;
  destaque?: boolean;
  perigo?: boolean;
  desabilitado?: boolean;
}) {
  const cls = perigo
    ? "border border-danger-red/40 text-danger-red"
    : destaque
      ? "bg-primary text-on-primary"
      : "border border-outline-variant text-on-surface";
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      className={`flex items-center justify-center gap-1 rounded-lg py-2.5 text-label-md active:scale-95 disabled:opacity-40 ${cls}`}
    >
      <span className="material-symbols-outlined text-[18px]">{icone}</span>
      {rotulo}
    </button>
  );
}
