"use client";

import { useState } from "react";
import { brl } from "@/lib/catalogo";

type Status =
  | "Novo"
  | "Aceito"
  | "Preparando"
  | "Em rota"
  | "Entregue"
  | "Concluído";

type Pedido = {
  id: string;
  cliente: string;
  canal: "Delivery" | "PDV";
  loja: "Centro" | "Bairro";
  itens: number;
  status: Status;
  total: number;
  hora: string;
};

const STATUS_CHIP: Record<Status, string> = {
  Novo: "bg-error-container text-on-error-container",
  Aceito: "bg-secondary-container text-on-secondary-container",
  Preparando: "bg-warning-amber/20 text-secondary",
  "Em rota": "bg-primary-container/15 text-primary",
  Entregue: "bg-tertiary-container/40 text-tertiary",
  Concluído: "bg-surface-container text-on-surface-variant",
};

const PEDIDOS: Pedido[] = [
  { id: "#8421", cliente: "Mariana Silveira", canal: "Delivery", loja: "Centro", itens: 3, status: "Preparando", total: 142.5, hora: "12:34" },
  { id: "#8420", cliente: "João Carlos Ramos", canal: "Delivery", loja: "Bairro", itens: 2, status: "Em rota", total: 89.9, hora: "12:20" },
  { id: "#8419", cliente: "Balcão", canal: "PDV", loja: "Centro", itens: 1, status: "Concluído", total: 54.0, hora: "12:15" },
  { id: "#8418", cliente: "Roberto Oliveira", canal: "Delivery", loja: "Centro", itens: 5, status: "Novo", total: 210.3, hora: "12:10" },
  { id: "#8417", cliente: "Ana Paula Mendes", canal: "Delivery", loja: "Bairro", itens: 2, status: "Entregue", total: 76.4, hora: "11:52" },
  { id: "#8416", cliente: "Balcão", canal: "PDV", loja: "Bairro", itens: 4, status: "Concluído", total: 132.0, hora: "11:40" },
  { id: "#8415", cliente: "Carlos Nunes", canal: "Delivery", loja: "Centro", itens: 1, status: "Aceito", total: 48.9, hora: "11:31" },
  { id: "#8414", cliente: "Balcão", canal: "PDV", loja: "Centro", itens: 2, status: "Concluído", total: 67.5, hora: "11:18" },
  { id: "#8413", cliente: "Fernanda Lima", canal: "Delivery", loja: "Bairro", itens: 3, status: "Entregue", total: 155.7, hora: "10:59" },
];

const CANAIS = ["Todos", "Delivery", "PDV"] as const;

export default function AdminPedidos() {
  const [canal, setCanal] = useState<(typeof CANAIS)[number]>("Todos");

  const lista =
    canal === "Todos" ? PEDIDOS : PEDIDOS.filter((p) => p.canal === canal);
  const totalDia = PEDIDOS.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Pedidos
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {PEDIDOS.length} pedidos hoje · {brl(totalDia)} — delivery e PDV no
            mesmo lugar.
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

      <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 text-label-sm uppercase tracking-wide text-on-surface-variant">
              <th className="px-md py-3 font-medium">Pedido</th>
              <th className="px-md py-3 font-medium">Cliente</th>
              <th className="px-md py-3 font-medium">Canal · Loja</th>
              <th className="px-md py-3 font-medium">Status</th>
              <th className="px-md py-3 text-right font-medium">Total</th>
              <th className="px-md py-3 text-right font-medium">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {lista.map((p) => (
              <tr key={p.id} className="text-body-md text-on-surface hover:bg-surface-container-low">
                <td className="px-md py-3 font-medium text-primary">{p.id}</td>
                <td className="px-md py-3">
                  {p.cliente}
                  <span className="block text-caption text-on-surface-variant">
                    {p.itens} {p.itens === 1 ? "item" : "itens"}
                  </span>
                </td>
                <td className="px-md py-3">
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm">
                    {p.canal}
                  </span>{" "}
                  <span className="text-label-sm text-on-surface-variant">
                    Loja {p.loja}
                  </span>
                </td>
                <td className="px-md py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[p.status]}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-md py-3 text-right font-medium">
                  {brl(p.total)}
                </td>
                <td className="px-md py-3 text-right text-on-surface-variant">
                  {p.hora}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-on-surface-variant">
        * Dados de teste. Ao ligar o Supabase, os pedidos entram aqui em tempo
        real (delivery e PDV), com atualização de status.
      </p>
    </div>
  );
}
