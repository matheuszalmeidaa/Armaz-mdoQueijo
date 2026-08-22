"use client";

// Estoque ao vivo no Supabase (/api/estoque, service_role) — agora por LOTES.
// Guarda { lotes, minimos } numa única linha JSON. Mantém o padrão das outras
// stores (fallback local, polling) e injeta no lib/estoque via setEstoqueLive.

import { useEffect, useState } from "react";
import {
  setEstoqueLive,
  type EstoqueDados,
  type Lote,
} from "./estoque";

const EVT = "estoque-change";

let modoServidor: boolean | null = null;
let cache: EstoqueDados = { lotes: [], minimos: {} };
let timer: ReturnType<typeof setInterval> | null = null;
let assinantes = 0;

function notificar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

// Aceita o formato novo { lotes, minimos } e migra o formato antigo
// ({ produtoId: { saldo, min, validade } }) para lotes.
function normalizar(bruto: unknown): EstoqueDados {
  const d = (bruto ?? {}) as Record<string, unknown>;
  if (Array.isArray(d.lotes)) {
    return {
      lotes: d.lotes as Lote[],
      minimos: (d.minimos as Record<string, number>) ?? {},
    };
  }
  // Formato antigo → migra
  const lotes: Lote[] = [];
  const minimos: Record<string, number> = {};
  for (const [produtoId, v] of Object.entries(d)) {
    const s = v as { saldo?: number; min?: number; validade?: string };
    if (typeof s?.saldo === "number" && s.saldo > 0) {
      lotes.push({
        id: crypto.randomUUID(),
        produtoId,
        qtd: s.saldo,
        usado: 0,
        entradaEm: Date.now(),
        validade: s.validade,
      });
    }
    if (typeof s?.min === "number" && s.min > 0) minimos[produtoId] = s.min;
  }
  return { lotes, minimos };
}

async function refetch() {
  try {
    const res = await fetch("/api/estoque", { cache: "no-store" });
    const j = await res.json();
    if (j.semBanco || j.error) {
      modoServidor = false;
    } else {
      modoServidor = true;
      cache = normalizar(j.saldos);
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

// Registra uma chegada: um ou mais lotes para o mesmo produto.
export function registrarChegada(
  produtoId: string,
  entradas: { qtd: number; validade?: string; codigo?: string }[]
) {
  const novos: Lote[] = entradas
    .filter((e) => e.qtd > 0)
    .map((e) => ({
      id: crypto.randomUUID(),
      produtoId,
      qtd: e.qtd,
      usado: 0,
      entradaEm: Date.now(),
      validade: e.validade || undefined,
      codigo: e.codigo || undefined,
    }));
  if (!novos.length) return;
  cache = { ...cache, lotes: [...cache.lotes, ...novos] };
  publicar();
}

export function definirMinimo(produtoId: string, min: number) {
  cache = { ...cache, minimos: { ...cache.minimos, [produtoId]: min } };
  publicar();
}

export function excluirLote(loteId: string) {
  cache = { ...cache, lotes: cache.lotes.filter((l) => l.id !== loteId) };
  publicar();
}

// Ajusta o "usado" de um lote (baixa manual/correção).
export function ajustarUsado(loteId: string, usado: number) {
  cache = {
    ...cache,
    lotes: cache.lotes.map((l) =>
      l.id === loteId ? { ...l, usado: Math.max(0, Math.min(l.qtd, usado)) } : l
    ),
  };
  publicar();
}

export function useEstoque(): EstoqueDados {
  const [dados, setDados] = useState<EstoqueDados>(() => cache);
  useEffect(() => {
    assinantes += 1;
    if (!timer) {
      refetch();
      timer = setInterval(refetch, 15000);
    }
    const h = () => setDados({ lotes: [...cache.lotes], minimos: { ...cache.minimos } });
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    setDados({ lotes: [...cache.lotes], minimos: { ...cache.minimos } });
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
  return dados;
}
