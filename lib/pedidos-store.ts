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
  telefone?: string;
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

type NovoPedido = Omit<PedidoLive, "id" | "numero" | "criadoEm" | "status">;

function inserir(
  p: NovoPedido,
  opts: { status?: StatusLive; marcarUltimo?: boolean } = {}
) {
  const lista = ler();
  const pedido: PedidoLive = {
    ...p,
    id: crypto.randomUUID(),
    numero: String(8400 + lista.length + Math.floor(Math.random() * 90)),
    criadoEm: Date.now(),
    status: opts.status ?? "Novo",
  };
  salvar([pedido, ...lista]);
  if (opts.marcarUltimo) localStorage.setItem(KEY_ULTIMO, pedido.id);
  return pedido;
}

// Pedido do DELIVERY: entra como "Novo" e vira o "último pedido" que o cliente
// acompanha em /pedido.
export function adicionarPedido(p: NovoPedido) {
  return inserir(p, { status: "Novo", marcarUltimo: true });
}

// Venda do PDV: venda de balcão já concluída — entra como "Entregue" e NÃO vira
// o pedido acompanhado pelo cliente. Aparece na gestão, relatórios e clientes.
export function registrarVendaPDV(p: Omit<NovoPedido, "canal" | "modo" | "entrega">) {
  return inserir(
    { ...p, canal: "PDV", modo: "retirada", entrega: "Venda no balcão (PDV)" },
    { status: "Entregue", marcarUltimo: false }
  );
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

// --- Clientes derivados dos pedidos ---
export type ClienteAgg = {
  chave: string; // telefone (ou nome quando sem telefone)
  nome: string;
  telefone?: string;
  qtdPedidos: number;
  totalGasto: number;
  ultimoPedidoEm: number;
  inativoDias: number;
  canais: Array<"Delivery" | "PDV">;
};

// Chave de identidade do cliente: telefone (só dígitos) ou, sem telefone, o nome.
export const chaveCliente = (p: { telefone?: string; cliente: string }) =>
  (p.telefone && p.telefone.replace(/\D/g, "")) || p.cliente;

function agregarClientes(lista: PedidoLive[]): ClienteAgg[] {
  const mapa = new Map<string, ClienteAgg>();
  for (const p of lista) {
    const chave = chaveCliente(p);
    if (!chave) continue;
    const atual = mapa.get(chave);
    if (atual) {
      atual.qtdPedidos += 1;
      atual.totalGasto += p.total;
      if (p.criadoEm > atual.ultimoPedidoEm) atual.ultimoPedidoEm = p.criadoEm;
      if (!atual.canais.includes(p.canal)) atual.canais.push(p.canal);
      if (!atual.telefone && p.telefone) atual.telefone = p.telefone;
    } else {
      mapa.set(chave, {
        chave,
        nome: p.cliente,
        telefone: p.telefone,
        qtdPedidos: 1,
        totalGasto: p.total,
        ultimoPedidoEm: p.criadoEm,
        inativoDias: 0,
        canais: [p.canal],
      });
    }
  }
  const agora = Date.now();
  return Array.from(mapa.values())
    .map((c) => ({
      ...c,
      inativoDias: Math.floor((agora - c.ultimoPedidoEm) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => b.ultimoPedidoEm - a.ultimoPedidoEm);
}

export function useClientes(): ClienteAgg[] {
  const [lista, setLista] = useState<ClienteAgg[]>([]);
  useEffect(() => setLista(agregarClientes(ler())), []);
  useAssinatura(() => setLista(agregarClientes(ler())));
  return lista;
}
