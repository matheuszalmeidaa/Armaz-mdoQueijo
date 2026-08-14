"use client";

// Regras da loja editáveis pelo lojista, persistidas em localStorage (sem
// backend ainda). O checkout/carrinho leem daqui via useConfig(); ao ligar o
// Supabase, troca-se a persistência por uma tabela `configuracoes` por loja,
// SEM mexer nas telas. regras.ts guarda apenas os PADRÕES (não importa este
// arquivo — evita ciclo).

import { useEffect, useState } from "react";
import { REGRAS, CUPONS } from "./regras";

// Cupom configurável pelo lojista. `minimo` = "válido a partir de R$ X".
export type CupomCfg = {
  codigo: string;
  tipo: "percent" | "reais";
  valor: number;
  minimo: number; // 0 = sem mínimo
  descricao: string;
  ativo: boolean;
};

export type DiaHorario = { aberto: boolean; abre: string; fecha: string };
export type Excecao = {
  data: string; // "YYYY-MM-DD"
  aberto: boolean;
  abre: string;
  fecha: string;
  motivo: string;
};
export type Redes = { instagram: string; facebook: string; whatsapp: string };

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
  cupons: CupomCfg[];
  aceitaPedidos: boolean; // toggle mestre do delivery
  horarios: DiaHorario[]; // 0=domingo .. 6=sábado
  excecoes: Excecao[]; // dias personalizados (sobrepõem a semana)
  redes: Redes;
  heroImg: string; // banner da vitrine (URL ou caminho em /produtos); "" = gradiente
  heroTag: string; // etiqueta do banner
  heroTitulo: string; // título do banner
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
  cupons: CUPONS.map((c) => ({
    codigo: c.codigo,
    tipo: c.tipo,
    valor: c.valor,
    minimo: 0,
    descricao: c.descricao,
    ativo: true,
  })),
  aceitaPedidos: true,
  horarios: Array.from({ length: 7 }, () => ({
    aberto: true,
    abre: "08:00",
    fecha: "18:00",
  })),
  excecoes: [],
  redes: { instagram: "", facebook: "", whatsapp: "" },
  heroImg: "",
  heroTag: "SUGESTÃO DO DIA",
  heroTitulo: "Queijo Canastra com Mel de Laranjeira",
};

// Fotos disponíveis para o banner sem upload (as que já vêm no projeto).
export const FOTOS_VITRINE = [
  "/produtos/canastra.png",
  "/produtos/figueira.png",
  "/produtos/meiacura.png",
  "/produtos/tabua.png",
  "/produtos/defumados.png",
  "/produtos/geleia.png",
  "/produtos/mel.png",
];

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const hmParaMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Está aberta agora? Considera o toggle mestre, exceções do dia e o horário
// semanal. Retorna também um motivo amigável quando fechada.
export function lojaAbertaAgora(
  cfg: ConfigLoja,
  agora: Date = new Date()
): { aberta: boolean; motivo?: string } {
  if (!cfg.aceitaPedidos)
    return { aberta: false, motivo: "No momento não estamos aceitando pedidos." };

  const iso = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();

  const exc = cfg.excecoes.find((e) => e.data === iso);
  const dia = exc ?? cfg.horarios[agora.getDay()];
  if (!dia || !dia.aberto)
    return {
      aberta: false,
      motivo: (exc && exc.motivo) || "Estamos fechados hoje.",
    };

  const dentro = agoraMin >= hmParaMin(dia.abre) && agoraMin <= hmParaMin(dia.fecha);
  return dentro
    ? { aberta: true }
    : { aberta: false, motivo: `Atendemos hoje das ${dia.abre} às ${dia.fecha}.` };
}

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
