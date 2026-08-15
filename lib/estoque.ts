// Estoque de loja única (saldo, mínimo e validade por produto). Os dados vivem no
// Supabase (estoque-store) e são injetados aqui via setEstoqueLive, para os
// helpers (badges, alertas) funcionarem sem virar hook. Sem dados, tudo é
// tratado como "sem controle" (não bloqueia venda).

import { getProduto, listaLive } from "./catalogo";

export type SaldoProduto = {
  saldo: number;
  min: number;
  validade?: string; // YYYY-MM-DD do lote mais próximo do vencimento
};

export type EstoqueMapa = Record<string, SaldoProduto>;

// Mapa vivo (produtoId -> saldo), preenchido pelo estoque-store a partir do banco.
let LIVE_ESTOQUE: EstoqueMapa = {};
export function setEstoqueLive(m: EstoqueMapa) {
  LIVE_ESTOQUE = m || {};
}
export function saldoDe(produtoId: string): SaldoProduto | null {
  return LIVE_ESTOQUE[produtoId] ?? null;
}

export type Status = "esgotado" | "baixo" | "ok";

export function statusSaldo(s: SaldoProduto): Status {
  if (s.saldo <= 0) return "esgotado";
  if (s.min > 0 && s.saldo < s.min) return "baixo";
  return "ok";
}

export function unidadeDe(produtoId: string): "kg" | "un" {
  const p = getProduto(produtoId);
  return p?.tipo === "peso" ? "kg" : "un";
}

export function nomeDe(produtoId: string): string {
  return getProduto(produtoId)?.nome ?? produtoId;
}

export function iconeDe(produtoId: string): string {
  return getProduto(produtoId)?.icone ?? "inventory_2";
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

// Lista de itens de estoque, um por produto do catálogo (mesmo sem saldo lançado).
export type LinhaEstoque = SaldoProduto & { produtoId: string };

export function linhasEstoque(mapa: EstoqueMapa = LIVE_ESTOQUE): LinhaEstoque[] {
  return listaLive().map((p) => ({
    produtoId: p.id,
    saldo: mapa[p.id]?.saldo ?? 0,
    min: mapa[p.id]?.min ?? 0,
    validade: mapa[p.id]?.validade,
  }));
}

// --- Resumos para os alertas ---
export function contarAlertas(mapa: EstoqueMapa = LIVE_ESTOQUE) {
  let vencendo = 0;
  let baixo = 0;
  let esgotado = 0;
  for (const e of linhasEstoque(mapa)) {
    const d = diasParaVencer(e.validade);
    if (d !== null && d <= 7 && e.saldo > 0) vencendo++;
    const st = statusSaldo(e);
    if (st === "esgotado") esgotado++;
    else if (st === "baixo") baixo++;
  }
  return { vencendo, baixo, esgotado };
}

export function vencendoEmBreve(dias = 7, mapa: EstoqueMapa = LIVE_ESTOQUE) {
  return linhasEstoque(mapa)
    .map((e) => ({ ...e, dias: diasParaVencer(e.validade) }))
    .filter((e) => e.dias !== null && e.dias <= dias && e.saldo > 0)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
}
