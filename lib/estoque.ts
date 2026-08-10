// Estoque de EXEMPLO (maquete). Vem da espinha (lotes por loja) ao ligar o
// Supabase. Inventário SEPARADO por loja, com saldo, mínimo e validade do lote
// mais próximo. Dados montados pra mostrar todos os estados: ok, baixo, esgotado
// e vencendo.

import { getProduto } from "./catalogo";

export const LOJAS_ESTOQUE = [
  { id: "centro", nome: "Loja Centro" },
  { id: "bairro", nome: "Loja Bairro" },
] as const;

export type SaldoLoja = { saldo: number; min: number };
export type EstoqueItem = {
  produtoId: string;
  validade?: string; // YYYY-MM-DD do lote mais próximo do vencimento
  centro: SaldoLoja;
  bairro: SaldoLoja;
};

// "Hoje" fixo pra maquete (bate com a data do projeto).
export const HOJE = new Date("2026-08-09T00:00:00");

export const ESTOQUE: EstoqueItem[] = [
  { produtoId: "figueira", validade: "2026-08-14", centro: { saldo: 4.2, min: 2 }, bairro: { saldo: 0.8, min: 1.5 } },
  { produtoId: "gouda-pesto", validade: "2026-09-20", centro: { saldo: 2.5, min: 1 }, bairro: { saldo: 3.1, min: 1 } },
  { produtoId: "morro-azul", validade: "2026-08-12", centro: { saldo: 0, min: 0.5 }, bairro: { saldo: 1.2, min: 0.5 } },
  { produtoId: "borbinha", validade: "2026-10-01", centro: { saldo: 5, min: 2 }, bairro: { saldo: 4, min: 2 } },
  { produtoId: "geleia-amora", validade: "2027-01-10", centro: { saldo: 12, min: 6 }, bairro: { saldo: 3, min: 6 } },
  { produtoId: "mel-silvestre", validade: "2027-06-01", centro: { saldo: 8, min: 4 }, bairro: { saldo: 9, min: 4 } },
  { produtoId: "tabua-frios", validade: "2026-08-13", centro: { saldo: 2, min: 1 }, bairro: { saldo: 0, min: 1 } },
  { produtoId: "mix-defumados", validade: "2026-08-30", centro: { saldo: 6, min: 2 }, bairro: { saldo: 5, min: 2 } },
];

export type Status = "esgotado" | "baixo" | "ok";

export function statusSaldo(s: SaldoLoja): Status {
  if (s.saldo <= 0) return "esgotado";
  if (s.saldo < s.min) return "baixo";
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
  const d = new Date(validade + "T00:00:00");
  return Math.round((d.getTime() - HOJE.getTime()) / (1000 * 60 * 60 * 24));
}

// --- Resumos para os alertas ---
export function contarAlertas() {
  let vencendo = 0;
  let baixo = 0;
  let esgotado = 0;
  for (const e of ESTOQUE) {
    const d = diasParaVencer(e.validade);
    if (d !== null && d <= 7) vencendo++;
    for (const loja of ["centro", "bairro"] as const) {
      const st = statusSaldo(e[loja]);
      if (st === "esgotado") esgotado++;
      else if (st === "baixo") baixo++;
    }
  }
  return { vencendo, baixo, esgotado };
}

export function vencendoEmBreve(dias = 7) {
  return ESTOQUE.map((e) => ({ ...e, dias: diasParaVencer(e.validade) }))
    .filter((e) => e.dias !== null && e.dias <= dias)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
}

// Conferência: produtos que vencem em ~1 mês (8 a 35 dias) — gera a "demanda"
// de conferir se o estoque foi vendido antes de virar urgente (FEFO).
export function paraConferir(minDias = 8, maxDias = 35) {
  return ESTOQUE.map((e) => ({ ...e, dias: diasParaVencer(e.validade) }))
    .filter((e) => e.dias !== null && e.dias >= minDias && e.dias <= maxDias)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));
}
