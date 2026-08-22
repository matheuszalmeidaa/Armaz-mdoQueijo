// Estoque por LOTES (loja única). Cada chegada de mercadoria gera um ou mais
// lotes rastreáveis (quantidade, entrada, validade, usado). O saldo do produto é
// a soma do que resta em todos os lotes. Base para saída por validade (FEFO).
//
// Os dados vivem no Supabase (estoque-store) e são injetados aqui via
// setEstoqueLive, para helpers/badges lerem sem virar hook.

import { getProduto } from "./catalogo";

export type Lote = {
  id: string;
  produtoId: string;
  lojaId?: string; // loja onde o lote está (multi-loja); ausente = "sem loja"
  qtd: number; // quantidade recebida (na unidade de estoque do produto)
  usado: number; // quantidade já vendida/baixada
  entradaEm: number; // data de entrada (ms)
  validade?: string; // YYYY-MM-DD do vencimento
  codigo?: string; // código do lote, se houver
};

export type EstoqueDados = {
  lotes: Lote[];
  minimos: Record<string, number>; // produtoId -> nível mínimo p/ alerta
};

let LIVE: EstoqueDados = { lotes: [], minimos: {} };
export function setEstoqueLive(d: EstoqueDados) {
  LIVE = { lotes: d.lotes ?? [], minimos: d.minimos ?? {} };
}
export function estoqueLive(): EstoqueDados {
  return LIVE;
}

export function lotesDe(produtoId: string): Lote[] {
  return LIVE.lotes.filter((l) => l.produtoId === produtoId);
}

export function restanteLote(l: Lote): number {
  return Math.max(0, l.qtd - l.usado);
}

// Saldo total do produto (todas as lojas = estoque consolidado).
export function saldoDe(produtoId: string): number {
  return lotesDe(produtoId).reduce((s, l) => s + restanteLote(l), 0);
}

// Lotes/saldo de um produto numa loja específica.
export function lotesLoja(produtoId: string, lojaId?: string): Lote[] {
  return LIVE.lotes.filter(
    (l) => l.produtoId === produtoId && (l.lojaId ?? "") === (lojaId ?? "")
  );
}
export function saldoLoja(produtoId: string, lojaId?: string): number {
  return lotesLoja(produtoId, lojaId).reduce((s, l) => s + restanteLote(l), 0);
}
// Lojas que possuem lote deste produto (para o detalhamento por loja).
export function lojasComLote(produtoId: string): string[] {
  const set = new Set<string>();
  for (const l of lotesDe(produtoId)) set.add(l.lojaId ?? "");
  return Array.from(set);
}

export function minimoDe(produtoId: string): number {
  return LIVE.minimos[produtoId] ?? 0;
}

// Tem controle de estoque? (tem lote lançado ou mínimo definido)
export function temControle(produtoId: string): boolean {
  return lotesDe(produtoId).length > 0 || minimoDe(produtoId) > 0;
}

export type Status = "esgotado" | "baixo" | "ok";
export function statusDe(produtoId: string): Status {
  const saldo = saldoDe(produtoId);
  const min = minimoDe(produtoId);
  if (saldo <= 0) return "esgotado";
  if (min > 0 && saldo < min) return "baixo";
  return "ok";
}

export function unidadeDe(produtoId: string): "kg" | "un" {
  const p = getProduto(produtoId);
  return p?.tipo === "peso" ? "kg" : "un";
}

export function nomeDe(produtoId: string): string {
  return getProduto(produtoId)?.nome ?? produtoId;
}

export function fmtQtd(n: number, unidade: "kg" | "un"): string {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
  return `${v} ${unidade}`;
}

export function diasParaVencer(validade?: string): number | null {
  if (!validade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(validade + "T00:00:00");
  return Math.round((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// Validade mais próxima entre os lotes com saldo (FEFO).
export function proximaValidade(produtoId: string): string | undefined {
  return lotesDe(produtoId)
    .filter((l) => restanteLote(l) > 0 && l.validade)
    .map((l) => l.validade as string)
    .sort()[0];
}

// --- Resumos para alertas ---
export function contarAlertas() {
  let vencendo = 0;
  let baixo = 0;
  let esgotado = 0;
  const produtos = new Set(LIVE.lotes.map((l) => l.produtoId));
  for (const id of produtos) {
    const st = statusDe(id);
    if (st === "esgotado") esgotado++;
    else if (st === "baixo") baixo++;
  }
  for (const l of LIVE.lotes) {
    const d = diasParaVencer(l.validade);
    if (d !== null && d <= 7 && restanteLote(l) > 0) vencendo++;
  }
  return { vencendo, baixo, esgotado };
}

// Lotes vencendo em até `dias`, ordenados por validade (mais próximo primeiro).
export function lotesVencendo(dias = 7): Lote[] {
  return LIVE.lotes
    .filter((l) => {
      const d = diasParaVencer(l.validade);
      return d !== null && d <= dias && restanteLote(l) > 0;
    })
    .sort((a, b) => (a.validade ?? "").localeCompare(b.validade ?? ""));
}
