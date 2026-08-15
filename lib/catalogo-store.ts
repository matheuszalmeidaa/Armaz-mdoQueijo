"use client";

// Catálogo ao vivo ligado ao Supabase (/api/catalogo, service_role). Guarda a
// lista de produtos + a config por produto (vídeo/variantes) numa única linha
// JSON. Mantém o catálogo semente (lib/catalogo) como fallback: se o banco
// estiver vazio ou fora do ar, as telas seguem com os produtos atuais.
//
// As telas usam useCatalogo() para a grade reativa; getProduto/precoBase (de
// lib/catalogo) leem a mesma lista viva via setLive().

import { useEffect, useState } from "react";
import {
  CATALOGO,
  setLive,
  listaLive,
  type Produto,
  type ProdutoCfg,
} from "./catalogo";

type CfgMapa = Record<string, ProdutoCfg>;

const EVT = "catalogo-change";

let modoServidor: boolean | null = null;
let cacheProdutos: Produto[] = CATALOGO;
let cacheCfg: CfgMapa = {};
let timer: ReturnType<typeof setInterval> | null = null;
let assinantes = 0;

function notificar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

async function refetch() {
  try {
    const res = await fetch("/api/catalogo", { cache: "no-store" });
    const j = await res.json();
    if (j.semBanco || j.error) {
      modoServidor = false;
    } else {
      modoServidor = true;
      if (Array.isArray(j.produtos) && j.produtos.length)
        cacheProdutos = j.produtos as Produto[];
      cacheCfg = j.cfg && typeof j.cfg === "object" ? (j.cfg as CfgMapa) : {};
    }
  } catch {
    modoServidor = false;
  }
  setLive(cacheProdutos);
  notificar();
}

// Publica a lista + cfg atuais no Supabase (e reflete localmente na hora).
function publicar() {
  setLive(cacheProdutos);
  notificar();
  fetch("/api/catalogo", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ produtos: cacheProdutos, cfg: cacheCfg }),
  })
    .then(() => refetch())
    .catch(() => {});
}

export function salvarProduto(p: Produto) {
  const existe = cacheProdutos.some((x) => x.id === p.id);
  cacheProdutos = existe
    ? cacheProdutos.map((x) => (x.id === p.id ? p : x))
    : [...cacheProdutos, p];
  publicar();
}

export function excluirProduto(id: string) {
  cacheProdutos = cacheProdutos.filter((x) => x.id !== id);
  if (cacheCfg[id]) {
    const { [id]: _, ...resto } = cacheCfg;
    cacheCfg = resto;
  }
  publicar();
}

export function lerCfg(id: string): ProdutoCfg {
  return cacheCfg[id] ?? {};
}

export function salvarCfg(id: string, cfg: ProdutoCfg) {
  cacheCfg = { ...cacheCfg, [id]: cfg };
  publicar();
}

function assinar(recomputar: () => void) {
  assinantes += 1;
  if (!timer) {
    refetch();
    timer = setInterval(refetch, 15000);
  } else {
    recomputar();
  }
  window.addEventListener(EVT, recomputar);
  window.addEventListener("storage", recomputar);
  return () => {
    window.removeEventListener(EVT, recomputar);
    window.removeEventListener("storage", recomputar);
    assinantes = Math.max(0, assinantes - 1);
    if (assinantes === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function useCatalogo(): Produto[] {
  const [lista, setLista] = useState<Produto[]>(() => listaLive());
  useEffect(() => assinar(() => setLista([...cacheProdutos])), []);
  return lista;
}

export function useProdutoCfg(id: string): ProdutoCfg {
  const [cfg, setCfg] = useState<ProdutoCfg>(() => lerCfg(id));
  useEffect(() => assinar(() => setCfg(lerCfg(id))), [id]);
  return cfg;
}

// Mapa completo de config (usado pelo catálogo de atacado para filtrar produtos).
export function useCfgMapa(): CfgMapa {
  const [m, setM] = useState<CfgMapa>(() => ({ ...cacheCfg }));
  useEffect(() => assinar(() => setM({ ...cacheCfg })), []);
  return m;
}
