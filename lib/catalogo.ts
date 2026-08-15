// Tipos e helpers do catálogo. Os produtos reais vêm do Supabase (catalogo-store)
// e o lojista cadastra em Produtos → Novo produto. Produtos por PESO têm
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
  novidade?: boolean; // tag manual "Novidade"
  vinculadoId?: string; // "Vai bem com" — produto sugerido junto no carrinho
};

export type Produto = Base &
  (
    | { tipo: "peso"; pesos: number[]; faixas: Faixa[] }
    | { tipo: "unidade"; preco: number; precoAntigo?: number }
  );

export const CATEGORIAS = ["Queijos", "Doces", "Mel", "Charcutaria"] as const;

// Config extra por produto (vídeo/variantes), guardada junto do catálogo.
export type Variante = {
  id: string;
  nome: string;
  preco?: number; // só se aplica a produto por UNIDADE
  descricao?: string;
  fotoUrl?: string;
};
export type ProdutoCfg = { videoUrl?: string; variantes?: Variante[] };

// Catálogo começa VAZIO — o lojista cadastra os produtos reais em
// Produtos → Novo produto (salvos no Supabase via catalogo-store). A lista viva
// (setLive) é preenchida pelo banco; sem banco/produtos, a loja fica vazia.
export const CATALOGO: Produto[] = [];

// Lista "viva": começa com o catálogo semente e é substituída pelo que vem do
// Supabase (via catalogo-store). Assim getProduto/precoBase seguem funcionando
// em qualquer tela sem virar hook — e caem na semente se o banco falhar.
let LIVE: Produto[] = CATALOGO;
export function listaLive(): Produto[] {
  return LIVE;
}
export function setLive(l: Produto[]) {
  LIVE = l.length ? l : CATALOGO;
}

export const getProduto = (id: string) => LIVE.find((p) => p.id === id);

// "Vai bem com": o produto que o lojista vinculou a este (sugerido no carrinho).
export const getVinculado = (id: string) => {
  const p = getProduto(id);
  return p?.vinculadoId ? getProduto(p.vinculadoId) : undefined;
};

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
