"use client";

// Fonte única de pedidos ao vivo. Agora ligada ao Supabase pelas rotas de
// servidor (/api/pedidos, service_role) — é o que faz o pedido do celular do
// cliente cair na loja em OUTRO aparelho. O localStorage segue como cache/reserva
// (aparelho que fez o pedido vê na hora; e se o servidor não tiver banco ainda,
// tudo continua funcionando localmente).
//
// As telas NÃO mudam: continuam usando usePedidosLive / useUltimoPedido /
// useClientes / adicionarPedido / registrarVendaPDV / avancarStatus.

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
  canal: "Delivery" | "PDV" | "Atacado";
  modo: "entrega" | "retirada";
  entrega: string;
  pagamento: string;
  itens: ItemLive[];
  total: number;
  status: StatusLive;
  agendado?: boolean; // pedido feito com a loja fechada (combinar horário)
  pago?: boolean; // marcado como pago na gestão
};

const KEY = "armazem-pedidos-live";
const KEY_ULTIMO = "armazem-ultimo-pedido";
const EVT = "pedidos-live-change";

// --- localStorage (cache / reserva sem banco) ---
function ler(): PedidoLive[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw === null) return [];
  try {
    return JSON.parse(raw) as PedidoLive[];
  } catch {
    return [];
  }
}

function salvarLocal(lista: PedidoLive[]) {
  localStorage.setItem(KEY, JSON.stringify(lista));
}

// --- Ponte com o servidor (Supabase via /api/pedidos) ---
type Row = {
  id: string;
  numero: string;
  cliente: string;
  telefone: string | null;
  canal: "Delivery" | "PDV" | "Atacado";
  modo: "entrega" | "retirada";
  entrega: string | null;
  pagamento: string | null;
  itens: ItemLive[] | null;
  total: number | string;
  status: StatusLive;
  agendado: boolean | null;
  pago?: boolean | null;
  criado_em: string;
};

function rowParaLive(r: Row): PedidoLive {
  return {
    id: r.id,
    numero: r.numero,
    criadoEm: new Date(r.criado_em).getTime(),
    cliente: r.cliente,
    telefone: r.telefone ?? undefined,
    canal: r.canal,
    modo: r.modo,
    entrega: r.entrega ?? "",
    pagamento: r.pagamento ?? "",
    itens: Array.isArray(r.itens) ? r.itens : [],
    total: Number(r.total) || 0,
    status: r.status,
    agendado: Boolean(r.agendado),
    pago: Boolean(r.pago),
  };
}

// Retorna a lista do servidor, ou null quando não há banco (modo local).
async function buscarServidor(): Promise<PedidoLive[] | null> {
  try {
    const res = await fetch("/api/pedidos", { cache: "no-store" });
    const j = await res.json();
    if (j.semBanco || j.error) return null;
    return (j.pedidos ?? []).map(rowParaLive);
  } catch {
    return null;
  }
}

function enviarServidor(p: PedidoLive) {
  fetch("/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: p.id,
      numero: p.numero,
      cliente: p.cliente,
      telefone: p.telefone ?? null,
      canal: p.canal,
      modo: p.modo,
      entrega: p.entrega,
      pagamento: p.pagamento,
      itens: p.itens,
      total: p.total,
      status: p.status,
      agendado: p.agendado ?? false,
    }),
  })
    .then(() => refetch())
    .catch(() => {});
}

// --- Estado compartilhado + polling (quase tempo real) ---
// modoServidor: null = ainda não sabemos; true = banco ligado; false = só local.
let modoServidor: boolean | null = null;
let cacheLista: PedidoLive[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let assinantes = 0;

function notificar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

async function refetch() {
  const srv = await buscarServidor();
  if (srv === null) {
    modoServidor = false;
    cacheLista = ler();
  } else {
    modoServidor = true;
    cacheLista = srv;
  }
  notificar();
}

function iniciarPoll() {
  assinantes += 1;
  if (pollTimer) return;
  // Enquanto o servidor não responde, mostra o cache local na hora.
  if (modoServidor === null) cacheLista = ler();
  refetch();
  pollTimer = setInterval(refetch, 5000);
}

function pararPoll() {
  assinantes = Math.max(0, assinantes - 1);
  if (assinantes === 0 && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// Fonte de verdade para as telas: banco quando disponível, senão localStorage.
function snapshot(): PedidoLive[] {
  return modoServidor === false ? ler() : cacheLista;
}

// --- Escrita ---
function gerarNumero(qtd: number) {
  return String(8400 + qtd + Math.floor(Math.random() * 90));
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
    numero: gerarNumero(lista.length),
    criadoEm: Date.now(),
    status: opts.status ?? "Novo",
  };
  // Cache local imediato (o aparelho que fez o pedido vê na hora).
  salvarLocal([pedido, ...lista]);
  cacheLista = [pedido, ...cacheLista.filter((x) => x.id !== pedido.id)];
  if (opts.marcarUltimo) localStorage.setItem(KEY_ULTIMO, pedido.id);
  notificar();
  // Sobe para o Supabase em segundo plano — cruza aparelhos.
  enviarServidor(pedido);
  return pedido;
}

// Pedido do DELIVERY: entra como "Novo" e vira o "último pedido" acompanhado.
export function adicionarPedido(p: NovoPedido) {
  return inserir(p, { status: "Novo", marcarUltimo: true });
}

// Venda do PDV: já concluída — entra como "Entregue"; não é o pedido acompanhado.
export function registrarVendaPDV(
  p: Omit<NovoPedido, "canal" | "modo" | "entrega">
) {
  return inserir(
    { ...p, canal: "PDV", modo: "retirada", entrega: "Venda no balcão (PDV)" },
    { status: "Entregue", marcarUltimo: false }
  );
}

// Pedido de ATACADO: entra como "Novo" (vira comanda na gestão/recebimento) e
// segue também para o WhatsApp. Não é o pedido acompanhado pelo cliente.
export function registrarPedidoAtacado(
  p: Omit<NovoPedido, "canal" | "modo" | "entrega">
) {
  return inserir(
    { ...p, canal: "Atacado", modo: "retirada", entrega: "Atacado — combinar" },
    { status: "Novo", marcarUltimo: false }
  );
}

function atualizarStatusLocal(id: string, status: StatusLive) {
  salvarLocal(ler().map((p) => (p.id === id ? { ...p, status } : p)));
  cacheLista = cacheLista.map((p) => (p.id === id ? { ...p, status } : p));
  notificar();
}

export function atualizarStatus(id: string, status: StatusLive) {
  atualizarStatusLocal(id, status); // otimista
  fetch(`/api/pedidos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
    .then(() => refetch())
    .catch(() => {});
}

export function avancarStatus(id: string) {
  const fonte = cacheLista.length ? cacheLista : ler();
  const p = fonte.find((x) => x.id === id);
  if (!p) return;
  const i = FLUXO.indexOf(p.status);
  if (i < FLUXO.length - 1) atualizarStatus(id, FLUXO[i + 1]);
}

// Define um status específico (gestão pode pular etapas).
export function definirStatus(id: string, status: StatusLive) {
  atualizarStatus(id, status);
}

// Marca/desmarca pago (otimista + servidor).
export function marcarPago(id: string, pago: boolean) {
  salvarLocal(ler().map((p) => (p.id === id ? { ...p, pago } : p)));
  cacheLista = cacheLista.map((p) => (p.id === id ? { ...p, pago } : p));
  notificar();
  fetch(`/api/pedidos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pago }),
  })
    .then(() => refetch())
    .catch(() => {});
}

// Exclui/cancela um pedido (otimista + servidor).
export function excluirPedido(id: string) {
  salvarLocal(ler().filter((p) => p.id !== id));
  cacheLista = cacheLista.filter((p) => p.id !== id);
  notificar();
  fetch(`/api/pedidos/${id}`, { method: "DELETE" })
    .then(() => refetch())
    .catch(() => {});
}

// --- Hooks ---
function useLista(): PedidoLive[] {
  const [lista, setLista] = useState<PedidoLive[]>(() => snapshot());
  useEffect(() => {
    iniciarPoll();
    const h = () => setLista(snapshot());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    setLista(snapshot());
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
      pararPoll();
    };
  }, []);
  return lista;
}

export function usePedidosLive(): PedidoLive[] {
  return useLista();
}

export function useUltimoPedido(): PedidoLive | undefined {
  const lista = useLista();
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") setId(localStorage.getItem(KEY_ULTIMO));
  }, []);
  if (!id) return undefined;
  return lista.find((p) => p.id === id) ?? ler().find((p) => p.id === id);
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
  canais: Array<"Delivery" | "PDV" | "Atacado">;
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
  const lista = useLista();
  return agregarClientes(lista);
}
