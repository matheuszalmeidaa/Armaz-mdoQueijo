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

// Fotos hospedadas no CDN (dados de teste). Trocar por imagens próprias ao ligar
// o Supabase / Storage. O componente ProdutoImagem cai no ícone se alguma falhar.
const IMG = "https://lh3.googleusercontent.com/aida-public/";

export const CATALOGO: Produto[] = [
  {
    id: "figueira",
    nome: "Queijo Figueira — Meia Cura",
    produtor: "Queijaria Bela Vista",
    categoria: "Queijos",
    icone: "nutrition",
    img: IMG + "AB6AXuAS01cGkwzu9L8dwbQ0MaFboXxsyv8ndd1L03S3wrWn6rkt6yGAJ0-SC19z9UEVhkBicI93GNrnzN6KG31ouPxNfYw7jkY1xcHzOmaWAGWJD62PeuOcPn1GVQ0V-Z26esMQfP5Bgt12ES11aF-RQDu_buSO9qFocO94Sdncepo-IjWng2QnoSrtnT32DKUXOFyPne4vxcgVH7Qtwnlg3psYdo_j3Ckj_OFWLKeYEBCRKaAVbSbBm-qgSCl3d9dzceKb4k31Rh3Ox3UV=w640",
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
    img: IMG + "AB6AXuD0Ax1TeqEwkAj47pyq--4ygUX0plp83iQ-qwXVEnrMKxNDWQkvpQkntXKQbusFskLNPG93EYW5Vnhy7JfaO1gTPvTVPrGGEnZKUIRunb37QokJQs6Y5V6iQomY5uWbTma9WTHJ-jrFQ__IkGnf4xMnffalGAk4COw5hAGdp4LWwEvHfoqiwBa5jSMZ0ifSYoT2d2BMbmnv4EObNTde6_5SECw1Lkb9ln3a0c9olm5m1pLHJq46AOf-XQaRJ5qpeap_nUohHukPXg1u=w640",
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
    img: IMG + "AB6AXuD71tT5dLDZ222vAPQPMh-GajC37RmO8C0wf4C1sB3zCoY9SYH8WnVklm_pGR9COmzjpEgoN39CpT1HO_pnfDYa6YfgLqhJR44CJ3jDnS3mFQBWDY1YRh1e8flGeLlmRDXZ7HMTPCu0fJzATQ9ETysFM0g3dTPX3HzI6WVKeAXraxPlbXFw80P4Sb-icNitQnB9kXBpFItDyGXNAxQDSRx57cVH6vtfFFKzJ4aKJTDIqjTwPoBdrmaVpPve6pdJZQ47zL9U47iOF1wX=w640",
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
    img: IMG + "AB6AXuD0Ax1TeqEwkAj47pyq--4ygUX0plp83iQ-qwXVEnrMKxNDWQkvpQkntXKQbusFskLNPG93EYW5Vnhy7JfaO1gTPvTVPrGGEnZKUIRunb37QokJQs6Y5V6iQomY5uWbTma9WTHJ-jrFQ__IkGnf4xMnffalGAk4COw5hAGdp4LWwEvHfoqiwBa5jSMZ0ifSYoT2d2BMbmnv4EObNTde6_5SECw1Lkb9ln3a0c9olm5m1pLHJq46AOf-XQaRJ5qpeap_nUohHukPXg1u=w640",
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
    img: IMG + "AB6AXuC6wocuO_6fGNnoRo68gjYoHoJiVs-8L8VGl9pwZGrrkIVDOhqy1aDKweQCH7PWSAzDtM4BblCuotNFD3wOK0gve0yL5WbQhfkQBrpUTVnCsofh1BdZUVrrsRMjtberG1sEY0jCNVEwGapID1IKFjKyq1CzqybY4LUhsiBtvtVjfUfh7MIFvEPACBEdaxsEO2s2DIBhvz_3OjR4i_SkFF2v-1AsrkeVUgDSIToRct7os_RJVN5lwLj5e7Z8Z7ZZYqTeFS95AphuRSOH=w640",
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
    img: IMG + "AB6AXuCGnAKBRK1Hu04YMrTSbmRsyjd1YMUe098-PZ6PYS2Fl9KI6My6PdJHvFqswYiQXifd-h4SaS3CmP1xeM5n3BfCihtqu1kVT-dB2dT7smNf4dXzml2ntbN4X6emUrhgLMoVIHiQrlLO_y1SsHuDA-ZHfqQewEHyfmYWb5COh0KnpJ4GZF7OWD42tgAjrlrOckIE_uodSfEHAAnZwDculLcwL8nh5qg4Hs47qDsZpJDg0Im7dNvv4fsJ3RBJCUZab3KvQpFjnSS_ArYi=w640",
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
    img: IMG + "AB6AXuBel7UkOqnlA8p2V08Jr4qNxcD9w4E3PiQxX6WQcB1W7Yhg6gn1lFppm_xFxG5zr2tIvxxxm24pAteVMucp7a3-vdMUmeYyVYAI5bw9HMVfdo_fSz169E-mPN0qulSWcR_DoGOSkuDA842j6c7GBrC8kvweOgQQjG42m9MW71YfHmWuQyb7aEYgGJ0fTzouZV4M9SpDuoDhdKI02Zh2-PLjspPCPKR7SUHxc5vfezyO1GgyhXaDfwePm7H82k8LB8DbtiqW0sEExnx6=w640",
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
    img: IMG + "AB6AXuAcVFhL7aNKrgzZ6CyxXPCxINOHK6kQ006Rza0f_FivE9YBUHk82FUfZBZTdeG7vRdtqAvK_tgS4YEgUjwRyGb6VVq6E1L9vXzLdBYOZ0mdGkL4vWyXGYFk35k6Upn4ba6K6Tl0k4H6SlxGBDkeHckwfHhoIwcodzSBjRnr3sWRQ1doz5nTRrRF5HKdAVP0IDaYbr0_chhSP3kUsup-zu5_LUFEljRIDKwo4yKpfyDoCU2eX5z6pqHgyQ4WMOQ5NtX2-w2O_VjsL6mN=w640",
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
