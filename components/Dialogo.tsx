"use client";

// Modais bonitos no padrão da marca, com API por promessa — substituem os
// confirm()/prompt() nativos do navegador.
//   await confirmar({ mensagem: "Excluir?", perigo: true })  -> boolean
//   await perguntar({ mensagem: "Nome da categoria" })       -> string | null
// Monte <DialogHost/> uma vez (no layout do admin).

import { useEffect, useState } from "react";

type Base = {
  titulo?: string;
  mensagem: string;
  okLabel?: string;
  cancelLabel?: string;
  perigo?: boolean;
};
type ReqConfirm = Base & { tipo: "confirm"; resolve: (v: boolean) => void };
type ReqPrompt = Base & {
  tipo: "prompt";
  placeholder?: string;
  valorInicial?: string;
  resolve: (v: string | null) => void;
};
type Req = ReqConfirm | ReqPrompt;

let atual: Req | null = null;
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

export function confirmar(opts: Base): Promise<boolean> {
  return new Promise((resolve) => {
    atual = { tipo: "confirm", ...opts, resolve };
    notify();
  });
}

export function perguntar(
  opts: Base & { placeholder?: string; valorInicial?: string }
): Promise<string | null> {
  return new Promise((resolve) => {
    atual = { tipo: "prompt", ...opts, resolve };
    notify();
  });
}

export function DialogHost() {
  const [, force] = useState(0);
  const [valor, setValor] = useState("");

  useEffect(() => {
    const l = () => {
      setValor(atual?.tipo === "prompt" ? atual.valorInicial ?? "" : "");
      force((n) => n + 1);
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const req = atual;
  if (!req) return null;

  function cancelar() {
    const r = req!;
    atual = null;
    notify();
    if (r.tipo === "prompt") r.resolve(null);
    else r.resolve(false);
  }
  function confirmarOk() {
    const r = req!;
    atual = null;
    notify();
    if (r.tipo === "prompt") r.resolve(valor.trim() || null);
    else r.resolve(true);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={cancelar}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[26rem] rounded-2xl border border-outline-variant/10 bg-surface p-lg shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-start gap-sm">
          <span
            className={`material-symbols-outlined text-[24px] ${
              req.perigo ? "text-danger-red" : "text-primary"
            }`}
          >
            {req.perigo ? "warning" : req.tipo === "prompt" ? "edit" : "help"}
          </span>
          <div className="flex-grow">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {req.titulo ?? (req.perigo ? "Confirmar" : "Atenção")}
            </h2>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {req.mensagem}
            </p>
          </div>
        </div>

        {req.tipo === "prompt" && (
          <input
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmarOk();
              if (e.key === "Escape") cancelar();
            }}
            placeholder={req.placeholder}
            className="mt-md w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none placeholder:text-on-surface-variant/50 focus:border-primary"
          />
        )}

        <div className="mt-lg flex justify-end gap-sm">
          <button
            onClick={cancelar}
            className="rounded-lg border border-outline-variant px-lg py-2.5 text-label-md text-on-surface active:scale-95"
          >
            {req.cancelLabel ?? "Cancelar"}
          </button>
          <button
            onClick={confirmarOk}
            className={`rounded-lg px-lg py-2.5 text-label-md font-semibold text-on-primary shadow active:scale-95 ${
              req.perigo ? "bg-danger-red" : "bg-primary"
            }`}
          >
            {req.okLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
