"use client";

import { useEffect, useRef, useState } from "react";
import { usePedidosLive } from "@/lib/pedidos-store";
import { COLUNAS, colunaDe } from "@/lib/pedido-ui";
import { CardPedido } from "@/components/CardPedido";
import { PainelPedido } from "@/components/PainelPedido";

// --- Alerta sonoro (um único AudioContext, destravado no 1º gesto) ---
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}
function beep() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  try {
    const tocar = (freq: number, atraso: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = freq;
      const t = ctx.currentTime + atraso;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t);
      o.stop(t + 0.36);
    };
    tocar(880, 0);
    tocar(1175, 0.18);
  } catch {}
}

// Cores suaves por coluna (dentro do padrão da marca).
const COL_ACCENT: Record<string, string> = {
  ATACADO: "text-secondary",
  RETIRADA: "text-secondary",
  "PEDIDO NOVO": "text-error",
  SEPARADO: "text-secondary",
  "EM ROTA": "text-primary",
  ENTREGUE: "text-tertiary",
};

export default function Recebimento() {
  const pedidos = usePedidosLive();
  const [somOn, setSomOn] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const prevLen = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevLen.current !== null && pedidos.length > prevLen.current) {
      if (somOn) beep();
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
    prevLen.current = pedidos.length;
  }, [pedidos.length, somOn]);

  useEffect(() => {
    const destravar = () => {
      getCtx()?.resume().catch(() => {});
      window.removeEventListener("pointerdown", destravar);
      window.removeEventListener("keydown", destravar);
    };
    window.addEventListener("pointerdown", destravar);
    window.addEventListener("keydown", destravar);
    return () => {
      window.removeEventListener("pointerdown", destravar);
      window.removeEventListener("keydown", destravar);
    };
  }, []);

  const sel = pedidos.find((p) => p.id === selId) ?? null;
  const porColuna = (col: string) =>
    pedidos.filter((p) => colunaDe(p) === col);
  const novos = porColuna("PEDIDO NOVO").length;

  function toast(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2200);
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="flex items-center gap-sm font-headline-lg text-headline-lg text-primary">
            Recebimento
            {novos > 0 && (
              <span
                className={`rounded-full bg-error px-2.5 py-0.5 text-label-sm font-bold text-on-error ${flash ? "animate-pulse" : ""}`}
              >
                {novos} novo{novos === 1 ? "" : "s"}
              </span>
            )}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Painel operacional ao vivo. Quando entra um pedido novo, toca o alerta.
          </p>
        </div>
        <button
          onClick={() => {
            const novo = !somOn;
            setSomOn(novo);
            if (novo) beep();
          }}
          className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-label-md ${
            somOn
              ? "border-tertiary/40 text-tertiary"
              : "border-outline-variant text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {somOn ? "notifications_active" : "notifications_off"}
          </span>
          Som {somOn ? "ligado" : "desligado"}
        </button>
      </div>

      {/* Kanban — 6 colunas responsivas, sem scroll horizontal no desktop */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
        {COLUNAS.map((col) => {
          const cards = porColuna(col);
          const ehNovo = col === "PEDIDO NOVO";
          return (
            <div
              key={col}
              className={`flex flex-col rounded-xl p-2 ${
                ehNovo
                  ? "bg-error-container/15"
                  : "bg-surface-container/40"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-0.5">
                <h2
                  className={`text-[11px] font-bold uppercase leading-tight tracking-wide ${COL_ACCENT[col]}`}
                >
                  {col}
                </h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1.5 text-[11px] font-bold text-on-surface-variant">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-2">
                {cards.map((p) => (
                  <CardPedido
                    key={p.id}
                    pedido={p}
                    onClick={() => setSelId(p.id)}
                    maxItens={3}
                    novo={ehNovo}
                  />
                ))}
                {cards.length === 0 && (
                  <p className="py-3 text-center text-caption text-on-surface-variant/60">
                    —
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sel && (
        <PainelPedido pedido={sel} onFechar={() => setSelId(null)} toast={toast} />
      )}

      {msg && (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-on-surface px-md py-2.5 text-body-md text-surface shadow-lg">
          {msg}
        </div>
      )}
    </div>
  );
}
