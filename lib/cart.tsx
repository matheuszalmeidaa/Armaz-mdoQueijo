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

type CartCtx = {
  itens: ItemCarrinho[];
  add: (item: ItemCarrinho) => void;
  remover: (key: string) => void;
  limpar: () => void;
  total: number;
  qtdItens: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "armazem-carrinho";

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [hidratado, setHidratado] = useState(false);

  // Carrega do localStorage no cliente
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItens(JSON.parse(raw));
    } catch {}
    setHidratado(true);
  }, []);

  // Persiste
  useEffect(() => {
    if (hidratado) localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens, hidratado]);

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

  const remover = (key: string) =>
    setItens((prev) => prev.filter((x) => x.key !== key));
  const limpar = () => setItens([]);

  const total = itens.reduce((s, x) => s + x.precoLinha, 0);
  const qtdItens = itens.reduce((s, x) => s + x.qtd, 0);

  return (
    <Ctx.Provider value={{ itens, add, remover, limpar, total, qtdItens }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return c;
}
