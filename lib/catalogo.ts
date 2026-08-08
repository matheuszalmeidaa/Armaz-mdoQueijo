// Catálogo de exemplo — dados reais da loja Fusqueijão (viriam da espinha).
// Fotos baixadas em /public/produtos (offline). Produtos por PESO têm
// preco_por_kg + faixas de desconto; por UNIDADE têm preco fixo.

export type Faixa = { min: number; kg: number };

type Base = {
  id: string;
  nome: string;
  produtor?: string;
  categoria: string;
  icone: string; // fallback quando a imagem falha
  img: string;
  descricao?: string;
  nota?: string; // aviso "Atenção..."
  origem?: string;
  intensidade?: string;
};

export type Produto = Base &
  (
    | { tipo: "peso"; pesos: number[]; faixas: Faixa[] }
    | { tipo: "unidade"; preco: number; precoAntigo?: number }
  );

export const CATEGORIAS = ["Queijos", "Doces", "Mel", "Charcutaria"] as const;

export const CATALOGO: Produto[] = [
  {
    id: "figueira",
    nome: "Queijo Figueira — Meia Cura",
    produtor: "Queijaria Bela Vista",
    categoria: "Queijos",
    icone: "nutrition",
    img: "/produtos/figueira.png",
    descricao:
      "Um meia cura de leite cru, casca natural e massa amanteigada. Derrete na boca e combina com geleias e um bom tinto.",
    origem: "Serra da Canastra, MG",
    intensidade: "Média",
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
    img: "/produtos/canastra.png",
    descricao:
      "Gouda cremoso com pesto de manjericão, ideal para tábuas e sanduíches quentes.",
    origem: "Pomerode, SC",
    intensidade: "Média-Alta",
    tipo: "peso",
    pesos: [200, 300, 400, 500],
    faixas: [
      { min: 200, kg: 410 },
      { min: 400, kg: 388 },
    ],
  },
  {
    id: "morro-azul",
    nome: "Queijo Morro Azul com Trufas Negras",
    produtor: "Canastra",
    categoria: "Queijos",
    icone: "nutrition",
    img: "/produtos/meiacura.png",
    descricao:
      "Uma obra-prima da queijaria brasileira, com trufas negras que criam um sabor terroso e sofisticado que derrete na boca.",
    nota: "Atenção: este queijo pode apresentar aroma forte e textura extremamente cremosa devido à maturação e presença de trufas negras.",
    origem: "Pomerode, SC",
    intensidade: "Média-Alta",
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
    img: "/produtos/canastra.png",
    descricao:
      "Queijo de casca lavada, macio e de sabor marcante. Um clássico da roça para quem gosta de intensidade.",
    origem: "Serra da Canastra, MG",
    intensidade: "Alta",
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
    img: "/produtos/geleia.png",
    descricao: "Geleia artesanal de frutas da estação. Par perfeito para queijos curados.",
    tipo: "unidade",
    preco: 28.5,
    precoAntigo: 34.0,
  },
  {
    id: "mel-silvestre",
    nome: "Mel de Florada Silvestre",
    produtor: "Apiário do Vale",
    categoria: "Mel",
    icone: "water_drop",
    img: "/produtos/mel.png",
    descricao: "Mel puro e natural, de florada silvestre. Sem adição de açúcares.",
    tipo: "unidade",
    preco: 32.0,
  },
  {
    id: "tabua-frios",
    nome: "Tábua de Frios Premium",
    produtor: "Seleção da Casa",
    categoria: "Charcutaria",
    icone: "restaurant",
    img: "/produtos/tabua.png",
    descricao: "Seleção artesanal de queijos e frios montada para receber bem.",
    tipo: "unidade",
    preco: 124.9,
  },
  {
    id: "mix-defumados",
    nome: "Mix de Defumados",
    produtor: "Seleção da Casa",
    categoria: "Charcutaria",
    icone: "outdoor_grill",
    img: "/produtos/defumados.png",
    descricao: "Lombo e costelinha defumados, prontos para a tábua.",
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
