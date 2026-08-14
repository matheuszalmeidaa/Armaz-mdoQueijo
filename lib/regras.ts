// ============================================================
// REGRAS DO ESTABELECIMENTO
// Hoje ficam aqui (valores padrão). No futuro virão do Supabase e serão
// EDITÁVEIS pelo lojista no Painel do Lojista — cada loja define as suas.
// Centralizado para nunca espalhar número mágico pelo app.
// ============================================================

import type { DadosCheckout } from "./cart";

export const REGRAS = {
  frete: 15.0, // taxa padrão (usada se nenhuma zona for escolhida)
  descontoPix: 0.05, // 5% no Pix
  tempoEntregaMin: 45, // minutos
  tempoEntregaMax: 60,
  cashback: { ativo: true, percent: 0.03 }, // 3% de volta em créditos
};

// Zonas de entrega — taxa e prazo por região
export type Zona = { id: string; nome: string; taxa: number; prazo: string };
export const ZONAS: Zona[] = [
  { id: "centro", nome: "Centro", taxa: 8.0, prazo: "25–35 min" },
  { id: "proximo", nome: "Bairros próximos", taxa: 12.0, prazo: "35–50 min" },
  { id: "distante", nome: "Bairros distantes", taxa: 18.0, prazo: "50–70 min" },
];

// Lojas para retirada no balcão
export type LojaRetirada = { id: string; nome: string; endereco: string };
export const LOJAS_RETIRADA: LojaRetirada[] = [
  { id: "centro", nome: "Loja Centro", endereco: "Rua das Amendoeiras, 124 — Centro" },
  { id: "bairro", nome: "Loja Bairro", endereco: "Av. da Roça, 890 — Jardim das Flores" },
];

// Cupons de desconto
export type Cupom = {
  codigo: string;
  tipo: "percent" | "reais";
  valor: number;
  descricao: string;
};
export const CUPONS: Cupom[] = [
  { codigo: "BEMVINDO10", tipo: "percent", valor: 10, descricao: "10% de desconto" },
  { codigo: "ROCA20", tipo: "reais", valor: 20, descricao: "R$ 20 de desconto" },
];

// Cupom já com regra de mínimo e estado (o config-store passa uma lista destes).
export type CupomAplicavel = {
  codigo: string;
  tipo: "percent" | "reais";
  valor: number;
  minimo: number; // 0 = sem mínimo
  descricao: string;
  ativo: boolean;
};

// Procura um cupom ATIVO pelo código, na lista fornecida (config da loja) ou nos
// padrões. A validade por VALOR MÍNIMO é checada no cálculo (calcularResumo).
export function buscarCupom(
  codigo?: string,
  cupons?: CupomAplicavel[]
): CupomAplicavel | null {
  if (!codigo) return null;
  const alvo = codigo.trim().toUpperCase();
  const lista: CupomAplicavel[] =
    cupons ?? CUPONS.map((c) => ({ ...c, minimo: 0, ativo: true }));
  return lista.find((c) => c.ativo && c.codigo.toUpperCase() === alvo) ?? null;
}

// Config aplicada nos cálculos. Os padrões vêm de REGRAS; o lojista pode
// sobrescrever via config-store (que passa um ConfigLoja compatível aqui).
export type RegrasCalculo = {
  frete: number;
  descontoPix: number;
  tempoEntregaMin: number;
  tempoEntregaMax: number;
  cupons?: CupomAplicavel[];
};

export function freteDe(dados: DadosCheckout, cfg: RegrasCalculo = REGRAS): number {
  if (dados.modo === "retirada") return 0;
  const z = ZONAS.find((z) => z.id === dados.zonaId);
  return z ? z.taxa : cfg.frete;
}

export function prazoDe(dados: DadosCheckout, cfg: RegrasCalculo = REGRAS): string {
  if (dados.modo === "retirada") return "pronto para retirada";
  const z = ZONAS.find((z) => z.id === dados.zonaId);
  return z ? z.prazo : `${cfg.tempoEntregaMin}–${cfg.tempoEntregaMax} min`;
}

// Cálculo único do resumo — usado no carrinho E na revisão (sempre iguais)
export function calcularResumo(
  subtotal: number,
  dados: DadosCheckout,
  cfg: RegrasCalculo = REGRAS
) {
  const frete = freteDe(dados, cfg);
  const descontoPix =
    (dados.pagamento ?? "pix") === "pix" ? subtotal * cfg.descontoPix : 0;
  const cupom = buscarCupom(dados.cupom, cfg.cupons);
  const atingiuMinimo = !!cupom && subtotal >= cupom.minimo;
  const descontoCupom =
    !cupom || !atingiuMinimo
      ? 0
      : cupom.tipo === "percent"
        ? (subtotal * cupom.valor) / 100
        : cupom.valor;
  const total = Math.max(0, subtotal + frete - descontoPix - descontoCupom);
  return { subtotal, frete, descontoPix, descontoCupom, cupom, atingiuMinimo, total };
}
