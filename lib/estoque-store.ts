"use client";

// Estoque ao vivo no Supabase (/api/estoque, service_role) — agora por LOTES.
// Guarda { lotes, minimos } numa única linha JSON. Mantém o padrão das outras
// stores (fallback local, polling) e injeta no lib/estoque via setEstoqueLive.

import { useEffect, useState } from "react";
import {
  setEstoqueLive,
  restanteLote,
  type EstoqueDados,
  type Lote,
  type Movimento,
} from "./estoque";

const EVT = "estoque-change";

let modoServidor: boolean | null = null;
let cache: EstoqueDados = { lotes: [], minimos: {}, movimentos: [] };
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
      movimentos: (d.movimentos as Movimento[]) ?? [],
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
  return { lotes, minimos, movimentos: [] };
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

// Registra uma chegada: um ou mais lotes para o mesmo produto NUMA loja.
export function registrarChegada(
  produtoId: string,
  entradas: { qtd: number; validade?: string; codigo?: string }[],
  lojaId?: string
) {
  const novos: Lote[] = entradas
    .filter((e) => e.qtd > 0)
    .map((e) => ({
      id: crypto.randomUUID(),
      produtoId,
      lojaId: lojaId || undefined,
      qtd: e.qtd,
      usado: 0,
      entradaEm: Date.now(),
      validade: e.validade || undefined,
      codigo: e.codigo || undefined,
    }));
  if (!novos.length) return;
  const mov: Movimento = {
    id: crypto.randomUUID(),
    tipo: "entrada",
    produtoId,
    qtd: novos.reduce((s, l) => s + l.qtd, 0),
    destinoLojaId: lojaId || undefined,
    em: Date.now(),
  };
  cache = {
    ...cache,
    lotes: [...cache.lotes, ...novos],
    movimentos: [mov, ...cache.movimentos],
  };
  publicar();
}

// Transfere `qtd` de um produto da loja ORIGEM para a loja DESTINO.
// Consome os lotes da origem em FEFO (validade mais próxima primeiro),
// REDUZINDO a quantidade deles (não conta como venda), e cria lotes
// equivalentes na loja destino — mantendo o estoque real de cada loja.
export function transferirEstoque(
  produtoId: string,
  origemLojaId: string | undefined,
  destinoLojaId: string | undefined,
  qtd: number
): { ok: boolean; motivo?: string } {
  if (qtd <= 0) return { ok: false, motivo: "Quantidade inválida." };
  if ((origemLojaId ?? "") === (destinoLojaId ?? ""))
    return { ok: false, motivo: "Origem e destino não podem ser iguais." };

  // Lotes da origem com saldo, em FEFO (validade asc, depois entrada asc).
  const origem = cache.lotes
    .filter(
      (l) =>
        l.produtoId === produtoId &&
        (l.lojaId ?? "") === (origemLojaId ?? "") &&
        restanteLote(l) > 0
    )
    .sort(
      (a, b) =>
        (a.validade ?? "9999").localeCompare(b.validade ?? "9999") ||
        a.entradaEm - b.entradaEm
    );

  const disponivel = origem.reduce((s, l) => s + restanteLote(l), 0);
  if (qtd > disponivel + 1e-9)
    return {
      ok: false,
      motivo: `Saldo insuficiente na origem (disponível: ${disponivel}).`,
    };

  let restante = qtd;
  const lotesAtualizados = [...cache.lotes];
  const novosDestino: Lote[] = [];

  for (const l of origem) {
    if (restante <= 1e-9) break;
    const pega = Math.min(restanteLote(l), restante);
    // Reduz a quantidade do lote de origem (mantém o "usado" já vendido).
    const idx = lotesAtualizados.findIndex((x) => x.id === l.id);
    lotesAtualizados[idx] = { ...l, qtd: l.qtd - pega };
    // Cria lote equivalente no destino (preserva validade/código).
    novosDestino.push({
      id: crypto.randomUUID(),
      produtoId,
      lojaId: destinoLojaId || undefined,
      qtd: pega,
      usado: 0,
      entradaEm: Date.now(),
      validade: l.validade,
      codigo: l.codigo,
    });
    restante -= pega;
  }

  const mov: Movimento = {
    id: crypto.randomUUID(),
    tipo: "transferencia",
    produtoId,
    qtd,
    origemLojaId: origemLojaId || undefined,
    destinoLojaId: destinoLojaId || undefined,
    em: Date.now(),
  };

  cache = {
    ...cache,
    // Remove lotes de origem que zeraram (qtd 0 e sem usado) para não poluir.
    lotes: [...lotesAtualizados, ...novosDestino].filter(
      (l) => l.qtd > 0 || l.usado > 0
    ),
    movimentos: [mov, ...cache.movimentos],
  };
  publicar();
  return { ok: true };
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
