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
// Preço de atacado (fluxo à parte em /pedidos-atacado). Por quilo ou por peça,
// com faixas de volume ("a partir de N → R$ X" o kg/peça).
export type FaixaAtacado = { min: number; preco: number };
export type Atacado = {
  ativo: boolean;
  unidade: "kg" | "peca";
  minimo?: number; // quantidade mínima do pedido de atacado (kg/peças)
  faixas: FaixaAtacado[];
};
// Forma de venda de um canal: por peça, por quilo, ou ambas.
export type FormaVenda = { peca: boolean; kg: boolean };

export type Foto = { url: string; path?: string };
export type ProdutoCfg = {
  videoUrl?: string;
  variantes?: Variante[];
  atacado?: Atacado;
  fotos?: Foto[]; // galeria (a 1ª é a principal, usada nos cards)
  oculto?: boolean; // ocultar do catálogo do cliente (loja/atacado)
  // NOVO — regras por canal (todas opcionais; ausência = comportamento atual):
  pesoMedioG?: number; // peso médio por peça (g); referência p/ estoque peça↔kg
  vendaPdv?: FormaVenda; // como vende no PDV
  vendaDelivery?: FormaVenda; // como vende no Delivery
};

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

// --- Atacado ---
// Preço por kg/peça para uma quantidade: usa a maior faixa cujo mínimo cabe na
// quantidade (abaixo da menor faixa, usa o preço de entrada).
export function precoAtacado(a: Atacado, qtd: number): number {
  const ordenadas = [...a.faixas].sort((x, y) => x.min - y.min);
  let preco = ordenadas[0]?.preco ?? 0;
  for (const f of ordenadas) if (qtd >= f.min) preco = f.preco;
  return preco;
}

// Quantidade mínima do pedido de atacado: o que o lojista definiu, ou 1 (o
// cliente pode levar 1 kg/peça se não houver mínimo definido).
export function minimoAtacado(a: Atacado): number {
  return a.minimo && a.minimo > 0 ? a.minimo : 1;
}
