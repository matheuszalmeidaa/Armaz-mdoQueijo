// Badges do produto na loja — geram urgência/destaque.
// "Esgotado" e "Últimas unidades" saem do ESTOQUE real (por isso são de verdade
// quando o Supabase ligar); "Novidade" e "Promoção" são tags do produto.

import { getProduto } from "./catalogo";
import { saldoDe, minimoDe, temControle, unidadeDe } from "./estoque";

export type Badge = {
  label: string;
  tipo: "esgotado" | "poucos" | "novidade" | "promo";
};

export const BADGE_CLS: Record<Badge["tipo"], string> = {
  esgotado: "bg-error-container text-on-error-container",
  poucos: "bg-warning-amber text-on-secondary-fixed",
  novidade: "bg-tertiary text-on-tertiary",
  promo: "bg-primary text-on-primary",
};

function saldoTotal(produtoId: string): number | null {
  // Sem controle de estoque (nenhum lote/mínimo) → não trata como esgotado.
  return temControle(produtoId) ? saldoDe(produtoId) : null;
}

export function estaEsgotado(produtoId: string): boolean {
  const t = saldoTotal(produtoId);
  return t !== null && t <= 0;
}

export function badgesDe(produtoId: string): Badge[] {
  const p = getProduto(produtoId);
  const total = saldoTotal(produtoId);
  const un = unidadeDe(produtoId);
  const badges: Badge[] = [];

  if (total !== null) {
    const min = minimoDe(produtoId);
    if (total <= 0) {
      badges.push({ label: "Esgotado", tipo: "esgotado" });
    } else if (min > 0 && total <= min) {
      // Abaixo do mínimo configurado → quase esgotando.
      badges.push({ label: "Quase esgotando", tipo: "poucos" });
    } else if (min === 0 && un === "un" && total <= 3) {
      badges.push({ label: `Últimas ${total} un`, tipo: "poucos" });
    } else if (min === 0 && un === "kg" && total <= 1.5) {
      badges.push({ label: "Acabando", tipo: "poucos" });
    }
  }

  if (p?.tipo === "unidade" && p.precoAntigo) {
    badges.push({ label: "Promoção", tipo: "promo" });
  }
  if (p?.novidade) {
    badges.push({ label: "Novidade", tipo: "novidade" });
  }
  return badges;
}
