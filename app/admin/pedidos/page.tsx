"use client";

import { useMemo, useState } from "react";
import { brl } from "@/lib/catalogo";
import { usePedidosLive, FLUXO } from "@/lib/pedidos-store";
import {
  tipoDe,
  pagamentoDe,
  ehHoje,
  LABEL_STATUS,
} from "@/lib/pedido-ui";
import { CardPedido } from "@/components/CardPedido";
import { PainelPedido } from "@/components/PainelPedido";

const TIPOS = ["Todos", "Atacado", "Retirada", "Delivery"] as const;
const STATUS = ["Todos", ...FLUXO] as const;
const PAGTOS = ["Todos", "pago", "parcial", "pendente"] as const;
const PERIODOS = ["Tudo", "Hoje"] as const;

export default function AdminPedidos() {
  const pedidos = usePedidosLive();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("Todos");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("Todos");
  const [pagto, setPagto] = useState<(typeof PAGTOS)[number]>("Todos");
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Tudo");
  const [selId, setSelId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (tipo !== "Todos" && tipoDe(p) !== tipo) return false;
      if (status !== "Todos" && p.status !== status) return false;
      if (pagto !== "Todos" && pagamentoDe(p) !== pagto) return false;
      if (periodo === "Hoje" && !ehHoje(p.criadoEm)) return false;
      if (q) {
        const alvo = `${p.numero} ${p.cliente} ${p.telefone ?? ""}`.toLowerCase();
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
  }, [pedidos, busca, tipo, status, pagto, periodo]);

  const sel = pedidos.find((p) => p.id === selId) ?? null;
  const totalFiltrado = lista.reduce((s, p) => s + p.total, 0);

  function toast(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2200);
  }

  return (
    <div className="space-y-md">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Pedidos</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Central de consulta e gerenciamento — {lista.length} pedido(s) ·{" "}
          {brl(totalFiltrado)}.
        </p>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5">
        <span className="material-symbols-outlined text-on-surface-variant">search</span>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nº do pedido, cliente ou telefone..."
          className="w-full bg-transparent text-body-md outline-none placeholder:text-on-surface-variant/60"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="material-symbols-outlined text-on-surface-variant"
          >
            close
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-sm">
        <Filtro rotulo="Tipo" opcoes={TIPOS} valor={tipo} onSel={setTipo} />
        <Filtro
          rotulo="Status"
          opcoes={STATUS}
          valor={status}
          onSel={setStatus}
          label={(s) => (s in LABEL_STATUS ? LABEL_STATUS[s as never] : s)}
        />
        <div className="flex flex-wrap gap-md">
          <Filtro rotulo="Pagamento" opcoes={PAGTOS} valor={pagto} onSel={setPagto} />
          <Filtro rotulo="Período" opcoes={PERIODOS} valor={periodo} onSel={setPeriodo} />
        </div>
      </div>

      {/* Lista (grade de cards) */}
      {lista.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-lg text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">
            receipt_long
          </span>
          <p className="mt-sm text-body-md text-on-surface-variant">
            Nenhum pedido com esses filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((p) => (
            <CardPedido key={p.id} pedido={p} onClick={() => setSelId(p.id)} maxItens={3} />
          ))}
        </div>
      )}

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

function Filtro<T extends string>({
  rotulo,
  opcoes,
  valor,
  onSel,
  label,
}: {
  rotulo: string;
  opcoes: readonly T[];
  valor: T;
  onSel: (v: T) => void;
  label?: (v: T) => string;
}) {
  return (
    <div>
      <span className="mb-1 block text-label-sm text-on-surface-variant">{rotulo}</span>
      <div className="no-scrollbar flex gap-1 overflow-x-auto">
        {opcoes.map((o) => (
          <button
            key={o}
            onClick={() => onSel(o)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-label-sm capitalize transition-colors ${
              valor === o
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {label ? label(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}
