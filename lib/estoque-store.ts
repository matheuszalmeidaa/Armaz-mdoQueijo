"use client";

// Estoque ao vivo no Supabase (/api/estoque, service_role). Guarda um mapa
// produtoId -> {saldo,min,validade} numa única linha JSON. Mantém o padrão das
// outras stores (fallback local, polling). Injeta no lib/estoque via setEstoqueLive
// para os helpers/badges lerem sem virar hook.

import { useEffect, useState } from "react";
import { setEstoqueLive, type EstoqueMapa, type SaldoProduto } from "./estoque";

const EVT = "estoque-change";

let modoServidor: boolean | null = null;
let cache: EstoqueMapa = {};
let timer: ReturnType<typeof setInterval> | null = null;
let assinantes = 0;

function notificar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

async function refetch() {
  try {
    const res = await fetch("/api/estoque", { cache: "no-store" });
    const j = await res.json();
    if (j.semBanco || j.error) {
      modoServidor = false;
    } else {
      modoServidor = true;
      cache = j.saldos && typeof j.saldos === "object" ? j.saldos : {};
    }
  } catch {
    modoServidor = false;
  }
  setEstoqueLive(cache);
  notificar();
}

function publicar() {
  setEstoqueLive(cache);
  notificar();
  fetch("/api/estoque", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saldos: cache }),
  })
    .then(() => refetch())
    .catch(() => {});
}

// Define saldo/min/validade de um produto (edição direta).
export function salvarSaldo(produtoId: string, s: SaldoProduto) {
  cache = { ...cache, [produtoId]: s };
  publicar();
}

// Dá entrada: soma quantidade ao saldo atual (e atualiza validade se informada).
export function darEntrada(produtoId: string, qtd: number, validade?: string) {
  const atual = cache[produtoId] ?? { saldo: 0, min: 0 };
  cache = {
    ...cache,
    [produtoId]: {
      saldo: Math.max(0, (atual.saldo ?? 0) + qtd),
      min: atual.min ?? 0,
      validade: validade || atual.validade,
    },
  };
  publicar();
}

export function lerSaldo(produtoId: string): SaldoProduto {
  return cache[produtoId] ?? { saldo: 0, min: 0 };
}

export function useEstoque(): EstoqueMapa {
  const [mapa, setMapa] = useState<EstoqueMapa>(() => cache);
  useEffect(() => {
    assinantes += 1;
    if (!timer) {
      refetch();
      timer = setInterval(refetch, 15000);
    }
    const h = () => setMapa({ ...cache });
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    setMapa({ ...cache });
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
      assinantes = Math.max(0, assinantes - 1);
      if (assinantes === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);
  return mapa;
}
