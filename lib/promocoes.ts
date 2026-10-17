// Promoções automáticas: decide, a partir do histórico do cliente e das regras
// da loja, qual cupom aplicar sozinho no checkout. Função pura (sem React) para
// ser testável e reutilizável no carrinho/identificação.

import type { CupomAplicavel } from "./regras";
import type { PromoAuto, PromoRegra } from "./config-store";

// Códigos reservados aos cupons automáticos (não confundir com cupom manual).
export const CODIGOS_AUTO = ["ANIVERSARIO", "BEMVINDO", "VOLTEI"];

export type ContextoCliente = {
  qtdPedidos: number; // pedidos anteriores deste cliente (0 = nunca comprou)
  inativoDias: number; // dias desde o último pedido
  aniversario?: string; // "YYYY-MM-DD" (ou "DD/MM"); só mês/dia importam
};

function monta(
  codigo: string,
  descricao: string,
  r: PromoRegra
): CupomAplicavel {
  return {
    codigo,
    tipo: r.tipo,
    valor: r.valor,
    minimo: r.minimo || 0,
    descricao,
    ativo: true,
  };
}

// Mês (1..12) a partir de "YYYY-MM-DD" ou "DD/MM" ou "DD/MM/AAAA".
function mesDe(aniversario?: string): number | null {
  if (!aniversario) return null;
  const iso = aniversario.match(/^\d{4}-(\d{2})-\d{2}/);
  if (iso) return Number(iso[1]);
  const br = aniversario.match(/^\d{1,2}\/(\d{1,2})/);
  if (br) return Number(br[1]);
  return null;
}

// Descrição amigável do desconto (para mostrar ao cliente).
function rotuloDesconto(r: PromoRegra): string {
  return r.tipo === "percent"
    ? `${r.valor}% de desconto`
    : `R$ ${r.valor} de desconto`;
}

// Retorna o cupom automático aplicável (ou null). Prioridade: aniversário >
// 1ª compra > cliente inativo. Só um por pedido.
export function cupomAutomatico(
  promo: PromoAuto,
  ctx: ContextoCliente,
  hoje: Date = new Date()
): CupomAplicavel | null {
  if (!promo) return null;

  // 🎂 Aniversário: vale durante todo o mês de nascimento.
  if (promo.aniversario.ativo) {
    const mes = mesDe(ctx.aniversario);
    if (mes && mes === hoje.getMonth() + 1) {
      return monta(
        "ANIVERSARIO",
        `🎂 Feliz aniversário! ${rotuloDesconto(promo.aniversario)}`,
        promo.aniversario
      );
    }
  }

  // 🎁 Primeira compra.
  if (promo.primeiraCompra.ativo && ctx.qtdPedidos === 0) {
    return monta(
      "BEMVINDO",
      `🎁 Boas-vindas: ${rotuloDesconto(promo.primeiraCompra)}`,
      promo.primeiraCompra
    );
  }

  // 💛 Sentimos sua falta (cliente inativo).
  if (
    promo.inativo.ativo &&
    ctx.qtdPedidos > 0 &&
    ctx.inativoDias >= promo.inativo.dias
  ) {
    return monta(
      "VOLTEI",
      `💛 Sentimos sua falta: ${rotuloDesconto(promo.inativo)}`,
      promo.inativo
    );
  }

  return null;
}
