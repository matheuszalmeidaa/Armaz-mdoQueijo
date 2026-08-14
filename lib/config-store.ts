"use client";

// Regras da loja editáveis pelo lojista, persistidas em localStorage (sem
// backend ainda). O checkout/carrinho leem daqui via useConfig(); ao ligar o
// Supabase, troca-se a persistência por uma tabela `configuracoes` por loja,
// SEM mexer nas telas. regras.ts guarda apenas os PADRÕES (não importa este
// arquivo — evita ciclo).

import { useEffect, useState } from "react";
import { REGRAS } from "./regras";

export type ConfigLoja = {
  frete: number; // taxa padrão de entrega (R$)
  descontoPix: number; // fração 0..1
  tempoEntregaMin: number; // minutos
  tempoEntregaMax: number; // minutos
  toleranciaCorte: number; // %
  whatsapp: string;
  somPedido: boolean;
  cashbackAtivo: boolean;
  cashbackPercent: number; // fração 0..1
};

export const CONFIG_PADRAO: ConfigLoja = {
  frete: REGRAS.frete,
  descontoPix: REGRAS.descontoPix,
  tempoEntregaMin: REGRAS.tempoEntregaMin,
  tempoEntregaMax: REGRAS.tempoEntregaMax,
  toleranciaCorte: 10,
  whatsapp: "(73) 99811-2345",
  somPedido: true,
  cashbackAtivo: REGRAS.cashback.ativo,
  cashbackPercent: REGRAS.cashback.percent,
};

const KEY = "armazem-config";
const EVT = "config-change";

export function lerConfig(): ConfigLoja {
  if (typeof window === "undefined") return CONFIG_PADRAO;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...CONFIG_PADRAO, ...JSON.parse(raw) } : CONFIG_PADRAO;
  } catch {
    return CONFIG_PADRAO;
  }
}

export function salvarConfig(c: ConfigLoja) {
  localStorage.setItem(KEY, JSON.stringify(c));
  window.dispatchEvent(new Event(EVT));
}

export function useConfig(): ConfigLoja {
  const [cfg, setCfg] = useState<ConfigLoja>(CONFIG_PADRAO);
  useEffect(() => {
    const recomputar = () => setCfg(lerConfig());
    recomputar();
    window.addEventListener(EVT, recomputar);
    window.addEventListener("storage", recomputar);
    return () => {
      window.removeEventListener(EVT, recomputar);
      window.removeEventListener("storage", recomputar);
    };
  }, []);
  return cfg;
}
