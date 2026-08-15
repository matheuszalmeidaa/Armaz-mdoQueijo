"use client";

// Config por produto (vídeo e variantes), no localStorage — por enquanto sem
// backend. Chaveado por produtoId; ao ligar o Supabase, troca-se a persistência
// sem mexer nas telas. Mídia por URL (sem upload de arquivo hoje).

import { useEffect, useState } from "react";

export type Variante = {
  id: string;
  nome: string;
  preco?: number; // só se aplica a produto por UNIDADE
  descricao?: string;
  fotoUrl?: string;
};

export type ProdutoCfg = {
  videoUrl?: string;
  variantes?: Variante[];
};

const KEY = "armazem-produtos-cfg";
const EVT = "produtos-cfg-change";

type Mapa = Record<string, ProdutoCfg>;

function lerMapa(): Mapa {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Mapa;
  } catch {
    return {};
  }
}

export function lerProdutoCfg(id: string): ProdutoCfg {
  return lerMapa()[id] ?? {};
}

export function salvarProdutoCfg(id: string, cfg: ProdutoCfg) {
  const mapa = lerMapa();
  mapa[id] = cfg;
  localStorage.setItem(KEY, JSON.stringify(mapa));
  window.dispatchEvent(new Event(EVT));
}

export function useProdutoCfg(id: string): ProdutoCfg {
  const [cfg, setCfg] = useState<ProdutoCfg>({});
  useEffect(() => {
    const recomputar = () => setCfg(lerProdutoCfg(id));
    recomputar();
    window.addEventListener(EVT, recomputar);
    window.addEventListener("storage", recomputar);
    return () => {
      window.removeEventListener(EVT, recomputar);
      window.removeEventListener("storage", recomputar);
    };
  }, [id]);
  return cfg;
}
