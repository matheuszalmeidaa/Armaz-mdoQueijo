"use client";

// "Espinha temporária" de pedidos ao vivo, no localStorage. Liga o Finalizar do
// delivery ao painel de recebimento e ao acompanhamento — sem backend.
// Ao ligar o Supabase, troca-se a implementação destas funções por realtime,
// SEM mexer nas telas.

import { useEffect, useState } from "react";

export type StatusLive = "Novo" | "Preparando" | "Em rota" | "Entregue";
export const FLUXO: StatusLive[] = ["Novo", "Preparando", "Em rota", "Entregue"];

export type ItemLive = { nome: string; qtd: string; preco: number };
export type PedidoLive = {
  id: string;
  numero: string;
  criadoEm: number;
  cliente: string;
  canal: "Delivery" | "PDV";
  modo: "entrega" | "retirada";
  entrega: string;
  pagamento: string;
  itens: ItemLive[];
  total: number;
  status: StatusLive;
};

const KEY = "armazem-pedidos-live";
const KEY_ULTIMO = "armazem-ultimo-pedido";
const EVT = "pedidos-live-change";

const SEED: PedidoLive[] = [
  {
    id: "seed-1", numero: "8402", criadoEm: Date.now() - 1000 * 60 * 6,
    cliente: "Fernanda Lima", canal: "Delivery", modo: "entrega",
    entrega: "Rua das Acácias, 210 — Centro", pagamento: "Maquineta (crédito)",
    total: 96.4, status: "Preparando",
    itens: [{ nome: "Queijo Canastra", qtd: "500g", preco: 84.4 }, { nome: "Mel Silvestre", qtd: "1 un", preco: 12.0 }],
  },
  {
    id: "seed-2", numero: "8403", criadoEm: Date.now() - 1000 * 60 * 2,
    cliente: "Carlos Nunes", canal: "Delivery", modo: "retirada",
    entrega: "Retirada — Loja Centro", pagamento: "Pix",
    total: 48.9, status: "Novo",
    itens: [{ nome: "Queijo Figueira", qtd: "300g", preco: 48.9 }],
  },
];

function ler(): PedidoLive[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw === null) {
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw) as PedidoLive[];
  } catch {
    return [];
  }
}

function salvar(lista: PedidoLive[]) {
  localStorage.setItem(KEY, JSON.stringify(lista));
  window.dispatchEvent(new Event(EVT));
}

export function adicionarPedido(p: Omit<PedidoLive, "id" | "numero" | "criadoEm" | "status">) {
  const lista = ler();
  const pedido: PedidoLive = {
    ...p,
    id: crypto.randomUUID(),
    numero: String(8400 + lista.length + Math.floor(Math.random() * 90)),
    criadoEm: Date.now(),
    status: "Novo",
  };
  salvar([pedido, ...lista]);
  localStorage.setItem(KEY_ULTIMO, pedido.id);
  return pedido;
}

export function atualizarStatus(id: string, status: StatusLive) {
  salvar(ler().map((p) => (p.id === id ? { ...p, status } : p)));
}

export function avancarStatus(id: string) {
  const lista = ler();
  const p = lista.find((x) => x.id === id);
  if (!p) return;
  const i = FLUXO.indexOf(p.status);
  if (i < FLUXO.length - 1) atualizarStatus(id, FLUXO[i + 1]);
}

// --- Hooks ---
function useAssinatura(recomputar: () => void) {
  useEffect(() => {
    const h = () => recomputar();
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function usePedidosLive(): PedidoLive[] {
  const [lista, setLista] = useState<PedidoLive[]>([]);
  useEffect(() => setLista(ler()), []);
  useAssinatura(() => setLista(ler()));
  return lista;
}

export function useUltimoPedido(): PedidoLive | undefined {
  const [pedido, setPedido] = useState<PedidoLive | undefined>(undefined);
  const recomputar = () => {
    const id = localStorage.getItem(KEY_ULTIMO);
    setPedido(ler().find((p) => p.id === id));
  };
  useEffect(recomputar, []);
  useAssinatura(recomputar);
  return pedido;
}
