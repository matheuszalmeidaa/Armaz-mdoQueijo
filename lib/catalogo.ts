// Catálogo de exemplo — dados reais da loja Fusqueijão (viriam da espinha).
// Produtos por PESO têm preco_por_kg + faixas de desconto por volume.
// Produtos por UNIDADE têm preco fixo.

export type Faixa = { min: number; kg: number };

export type Produto = {
  id: string;
  nome: string;
  produtor?: string;
  categoria: string;
  icone: string; // Material Symbol (placeholder no lugar da foto)
} & (
  | { tipo: "peso"; pesos: number[]; faixas: Faixa[] }
  | { tipo: "unidade"; preco: number }
);

export const CATEGORIAS = ["Queijos", "Doces", "Mel", "Charcutaria"] as const;

export const CATALOGO: Produto[] = [
  {
    id: "figueira",
    nome: "Queijo Figueira — Meia Cura",
    produtor: "Queijaria Bela Vista",
    categoria: "Queijos",
    icone: "nutrition",
    tipo: "peso",
    pesos: [200, 300, 400, 500, 750, 1000],
    faixas: [
      { min: 200, kg: 411 },
      { min: 500, kg: 385 },
      { min: 1000, kg: 360 },
    ],
  },
  {
    id: "gouda-pesto",
    nome: "Gouda Pesto Verde",
    produtor: "Canastra",
    categoria: "Queijos",
    icone: "nutrition",
    tipo: "peso",
    pesos: [200, 300, 400, 500],
    faixas: [
      { min: 200, kg: 410 },
      { min: 400, kg: 388 },
    ],
  },
  {
    id: "morro-azul",
    nome: "Queijo Morro Azul",
    produtor: "Canastra",
    categoria: "Queijos",
    icone: "nutrition",
    tipo: "peso",
    pesos: [120, 240, 360, 480],
    faixas: [
      { min: 120, kg: 540 },
      { min: 360, kg: 510 },
    ],
  },
  {
    id: "borbinha",
    nome: "Queijo Borbinha",
    produtor: "Canastra",
    categoria: "Queijos",
    icone: "nutrition",
    tipo: "peso",
    pesos: [200, 270, 400, 540],
    faixas: [
      { min: 200, kg: 268 },
      { min: 400, kg: 250 },
    ],
  },
  {
    id: "geleia-amora",
    nome: "Geleia de Amora Artesanal",
    produtor: "Doce Vida",
    categoria: "Doces",
    icone: "icecream",
    tipo: "unidade",
    preco: 28.5,
  },
  {
    id: "mel-silvestre",
    nome: "Mel de Florada Silvestre",
    produtor: "Apiário do Vale",
    categoria: "Mel",
    icone: "water_drop",
    tipo: "unidade",
    preco: 32.0,
  },
  {
    id: "tabua-frios",
    nome: "Tábua de Frios Premium",
    produtor: "Seleção da Casa",
    categoria: "Charcutaria",
    icone: "restaurant",
    tipo: "unidade",
    preco: 124.9,
  },
  {
    id: "mix-defumados",
    nome: "Mix de Defumados",
    produtor: "Seleção da Casa",
    categoria: "Charcutaria",
    icone: "outdoor_grill",
    tipo: "unidade",
    preco: 68.0,
  },
];

export const getProduto = (id: string) => CATALOGO.find((p) => p.id === id);

// --- Helpers de preço ---
export function precoPorKg(p: Extract<Produto, { tipo: "peso" }>, pesoG: number) {
  return p.faixas
    .filter((f) => pesoG >= f.min)
    .reduce((maior, f) => (f.min > maior.min ? f : maior), p.faixas[0]).kg;
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const gramas = (g: number) => (g >= 1000 ? `${g / 1000}kg` : `${g}g`);

// Preço "a partir de" para o card da grade (menor preset)
export function precoBase(p: Produto) {
  if (p.tipo === "unidade") return p.preco;
  const menor = Math.min(...p.pesos);
  return (precoPorKg(p, menor) * menor) / 1000;
}
