"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ItemCarrinho = {
  key: string; // produtoId + peso (para diferenciar pesos do mesmo produto)
  produtoId: string;
  nome: string;
  icone: string;
  pesoG?: number; // presente em produtos por peso
  qtd: number; // produtos por unidade
  precoLinha: number; // preço já calculado desta linha
};

export type DadosCheckout = {
  nome?: string;
  telefone?: string;
  // Endereço estruturado + string formatada para exibição/mensagem.
  endereco?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
  pagamento?: "pix" | "cartao" | "dinheiro";
  trocoPara?: number; // quando pagamento = dinheiro
  modo?: "entrega" | "retirada";
  zonaId?: string;
  lojaRetiradaId?: string;
  cupom?: string;
};

type CartCtx = {
  itens: ItemCarrinho[];
  add: (item: ItemCarrinho) => void;
  alterarQtd: (key: string, delta: number) => void;
  remover: (key: string) => void;
  limpar: () => void;
  total: number;
  qtdItens: number;
  dados: DadosCheckout;
  setDados: (patch: Partial<DadosCheckout>) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "armazem-carrinho";
const DADOS_KEY = "armazem-checkout";

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [dados, setDadosState] = useState<DadosCheckout>({
    pagamento: "pix",
    modo: "entrega",
  });
  const [hidratado, setHidratado] = useState(false);

  // Carrega do localStorage no cliente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItens(JSON.parse(raw));
      const rawDados = localStorage.getItem(DADOS_KEY);
      if (rawDados) setDadosState(JSON.parse(rawDados));
    } catch {}
    setHidratado(true);
  }, []);

  // Persiste
  useEffect(() => {
    if (hidratado) localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens, hidratado]);

  useEffect(() => {
    if (hidratado) localStorage.setItem(DADOS_KEY, JSON.stringify(dados));
  }, [dados, hidratado]);

  const setDados = (patch: Partial<DadosCheckout>) =>
    setDadosState((prev) => ({ ...prev, ...patch }));

  function add(item: ItemCarrinho) {
    setItens((prev) => {
      const i = prev.findIndex((x) => x.key === item.key);
      if (i === -1) return [...prev, item];
      // mesmo produto+peso -> soma quantidade e preço da linha
      const copia = [...prev];
      copia[i] = {
        ...copia[i],
        qtd: copia[i].qtd + item.qtd,
        precoLinha: copia[i].precoLinha + item.precoLinha,
      };
      return copia;
    });
  }

  // Muda a quantidade escalando o preço da linha (unitário = precoLinha/qtd).
  function alterarQtd(key: string, delta: number) {
    setItens((prev) =>
      prev.map((x) => {
        if (x.key !== key) return x;
        const novaQtd = Math.max(1, x.qtd + delta);
        const unit = x.precoLinha / x.qtd;
        return { ...x, qtd: novaQtd, precoLinha: unit * novaQtd };
      })
    );
  }

  const remover = (key: string) =>
    setItens((prev) => prev.filter((x) => x.key !== key));
  const limpar = () => setItens([]);

  const total = itens.reduce((s, x) => s + x.precoLinha, 0);
  const qtdItens = itens.reduce((s, x) => s + x.qtd, 0);

  return (
    <Ctx.Provider
      value={{ itens, add, alterarQtd, remover, limpar, total, qtdItens, dados, setDados }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return c;
}
