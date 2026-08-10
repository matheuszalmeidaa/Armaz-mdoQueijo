"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOGO, brl } from "@/lib/catalogo";
import {
  ESTOQUE,
  LOJAS_ESTOQUE,
  contarAlertas,
  vencendoEmBreve,
  paraConferir,
  statusSaldo,
  unidadeDe,
  nomeDe,
  iconeDe,
  fmtQtd,
  type SaldoLoja,
  type Status,
} from "@/lib/estoque";

const CHIP: Record<Status, { label: string; cls: string }> = {
  ok: { label: "Ok", cls: "bg-tertiary-container/40 text-tertiary" },
  baixo: { label: "Baixo", cls: "bg-warning-amber/20 text-secondary" },
  esgotado: { label: "Esgotado", cls: "bg-error-container text-on-error-container" },
};

export default function AdminEstoque() {
  const [modal, setModal] = useState<null | "transferencia" | "perda">(null);
  const [conferidos, setConferidos] = useState<string[]>([]);

  const alertas = contarAlertas();
  const vencendo = vencendoEmBreve(7);
  const conferir = paraConferir().filter((e) => !conferidos.includes(e.produtoId));

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Estoque
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Inventário separado por loja. Venda dá baixa; quando zera, esgota no
            catálogo.
          </p>
        </div>
        <div className="flex flex-wrap gap-sm">
          <button
            onClick={() => setModal("transferencia")}
            className="flex items-center gap-1 rounded-lg border border-outline-variant px-md py-2.5 text-label-md text-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
            Transferência
          </button>
          <button
            onClick={() => setModal("perda")}
            className="flex items-center gap-1 rounded-lg border border-outline-variant px-md py-2.5 text-label-md text-danger-red active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            Perda / devolução
          </button>
          <Link
            href="/admin/estoque/entrada"
            className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary shadow active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">add_box</span>
            Entrada
          </Link>
        </div>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <CardAlerta icone="schedule" rotulo="Vencendo (7 dias)" valor={alertas.vencendo} cor="warning-amber" />
        <CardAlerta icone="trending_down" rotulo="Abaixo do mínimo" valor={alertas.baixo} cor="secondary" />
        <CardAlerta icone="production_quantity_limits" rotulo="Esgotados" valor={alertas.esgotado} cor="error" />
      </div>

      {/* Vencendo em breve (FEFO) */}
      {vencendo.length > 0 && (
        <section className="rounded-xl border-l-4 border-warning-amber bg-cream-surface p-md">
          <div className="mb-sm flex items-center gap-sm">
            <span className="material-symbols-outlined text-warning-amber">priority_high</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Vender primeiro (vencendo)
            </h2>
          </div>
          <p className="mb-md text-body-md text-on-surface-variant">
            Priorize estes no balcão e no delivery para não virar perda.
          </p>
          <ul className="space-y-sm">
            {vencendo.map((e) => (
              <li key={e.produtoId} className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-md py-2.5">
                <span className="flex items-center gap-sm text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-primary/50">{iconeDe(e.produtoId)}</span>
                  {nomeDe(e.produtoId)}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${(e.dias ?? 0) <= 3 ? "bg-error-container text-on-error-container" : "bg-warning-amber/20 text-secondary"}`}>
                  {e.dias === 0 ? "vence hoje" : e.dias === 1 ? "vence amanhã" : `vence em ${e.dias} dias`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Conferência (vencendo no mês) */}
      {conferir.length > 0 && (
        <section className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-1 flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary">fact_check</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Conferência de validade
            </h2>
          </div>
          <p className="mb-md text-body-md text-on-surface-variant">
            Vencem em ~1 mês. Confira se o estoque está girando — marque como
            conferido quando checar.
          </p>
          <ul className="space-y-sm">
            {conferir.map((e) => (
              <li key={e.produtoId} className="flex items-center justify-between gap-sm rounded-lg bg-surface-container-low px-md py-2.5">
                <span className="flex items-center gap-sm text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-primary/50">{iconeDe(e.produtoId)}</span>
                  {nomeDe(e.produtoId)}
                  <span className="text-label-sm text-on-surface-variant">
                    · vence em {e.dias} dias
                  </span>
                </span>
                <button
                  onClick={() => setConferidos((prev) => [...prev, e.produtoId])}
                  className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-tertiary active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Conferir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Estoque por loja */}
      <section>
        <h2 className="mb-sm font-headline-md text-headline-md text-primary">
          Estoque por loja
        </h2>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="px-md py-3 font-medium">Produto</th>
                <th className="px-md py-3 font-medium">Loja Centro</th>
                <th className="px-md py-3 font-medium">Loja Bairro</th>
                <th className="px-md py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {ESTOQUE.map((e) => {
                const un = unidadeDe(e.produtoId);
                const total = e.centro.saldo + e.bairro.saldo;
                return (
                  <tr key={e.produtoId} className="text-body-md text-on-surface">
                    <td className="px-md py-3">
                      <div className="flex items-center gap-sm">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-container to-primary-container/20">
                          <span className="material-symbols-outlined text-[18px] text-primary/40">{iconeDe(e.produtoId)}</span>
                        </div>
                        <span className="font-medium">{nomeDe(e.produtoId)}</span>
                      </div>
                    </td>
                    <CelulaLoja saldo={e.centro} un={un} />
                    <CelulaLoja saldo={e.bairro} un={un} />
                    <td className="px-md py-3 text-right font-medium text-primary">{fmtQtd(total, un)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-sm text-caption text-on-surface-variant">
          * Dados de teste. Ao ligar o Supabase, os saldos caem na venda e a
          validação de pedido (pediu 3, só há 2) entra no delivery.
        </p>
      </section>

      {modal === "transferencia" && (
        <ModalTransferencia onFechar={() => setModal(null)} />
      )}
      {modal === "perda" && <ModalPerda onFechar={() => setModal(null)} />}
    </div>
  );
}

function CelulaLoja({ saldo, un }: { saldo: SaldoLoja; un: "kg" | "un" }) {
  const st = statusSaldo(saldo);
  const chip = CHIP[st];
  return (
    <td className="px-md py-3">
      <div className="flex items-center gap-sm">
        <span className={st === "esgotado" ? "text-on-surface-variant" : "font-medium"}>
          {fmtQtd(saldo.saldo, un)}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-label-sm font-medium ${chip.cls}`}>
          {chip.label}
        </span>
      </div>
      <span className="text-caption text-on-surface-variant">mín. {fmtQtd(saldo.min, un)}</span>
    </td>
  );
}

function CardAlerta({ icone, rotulo, valor, cor }: { icone: string; rotulo: string; valor: number; cor: "warning-amber" | "secondary" | "error"; }) {
  const map = { "warning-amber": "text-warning-amber", secondary: "text-secondary", error: "text-error" } as const;
  return (
    <div className="flex items-center gap-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <span className={`material-symbols-outlined text-[32px] ${map[cor]}`}>{icone}</span>
      <div>
        <p className="font-display text-headline-lg text-on-surface">{valor}</p>
        <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
      </div>
    </div>
  );
}

// ---------------- Modais ----------------
function Overlay({ children, onFechar }: { children: React.ReactNode; onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onFechar}>
      <div className="max-h-[92dvh] w-full max-w-[28rem] overflow-y-auto rounded-t-xl bg-surface-container-low p-lg sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalTransferencia({ onFechar }: { onFechar: () => void }) {
  const [produtoId, setProdutoId] = useState(CATALOGO[0].id);
  const [de, setDe] = useState("centro");
  const [qtd, setQtd] = useState("");
  const [ok, setOk] = useState(false);
  const un = unidadeDe(produtoId);
  const para = de === "centro" ? "bairro" : "centro";
  const nomeLoja = (id: string) => LOJAS_ESTOQUE.find((l) => l.id === id)?.nome;

  function transferir() {
    if ((Number(qtd.replace(",", ".")) || 0) <= 0) return;
    setOk(true);
    setTimeout(onFechar, 900);
  }

  return (
    <Overlay onFechar={onFechar}>
      <h3 className="mb-md font-headline-md text-headline-md text-primary">
        Transferência entre lojas
      </h3>
      <Label>Produto</Label>
      <Select value={produtoId} onChange={setProdutoId}>
        {CATALOGO.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </Select>

      <div className="mt-md flex items-end gap-sm">
        <div className="flex-1">
          <Label>De</Label>
          <Select value={de} onChange={setDe}>
            {LOJAS_ESTOQUE.map((l) => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </Select>
        </div>
        <span className="material-symbols-outlined mb-2.5 text-primary">arrow_forward</span>
        <div className="flex-1">
          <Label>Para</Label>
          <div className="mt-1 rounded-lg border border-outline-variant bg-surface-container px-md py-2.5 text-body-lg text-on-surface">
            {nomeLoja(para)}
          </div>
        </div>
      </div>

      <div className="mt-md">
        <Label>Quantidade ({un})</Label>
        <input
          value={qtd}
          onChange={(e) => setQtd(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-headline-md outline-none focus:border-primary"
        />
      </div>

      <button
        onClick={transferir}
        className="mt-lg w-full rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
      >
        {ok ? "Transferido ✓" : "Transferir"}
      </button>
      <p className="mt-sm text-caption text-on-surface-variant">
        Sai de {nomeLoja(de)} e entra em {nomeLoja(para)}. (Maquete)
      </p>
    </Overlay>
  );
}

function ModalPerda({ onFechar }: { onFechar: () => void }) {
  const [produtoId, setProdutoId] = useState(CATALOGO[0].id);
  const [loja, setLoja] = useState("centro");
  const [qtd, setQtd] = useState("");
  const [motivo, setMotivo] = useState("Vencido");
  const [ok, setOk] = useState(false);
  const un = unidadeDe(produtoId);

  function registrar() {
    if ((Number(qtd.replace(",", ".")) || 0) <= 0) return;
    setOk(true);
    setTimeout(onFechar, 900);
  }

  return (
    <Overlay onFechar={onFechar}>
      <h3 className="mb-md font-headline-md text-headline-md text-primary">
        Perda / devolução
      </h3>
      <Label>Produto</Label>
      <Select value={produtoId} onChange={setProdutoId}>
        {CATALOGO.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </Select>

      <div className="mt-md grid grid-cols-2 gap-sm">
        <div>
          <Label>Loja</Label>
          <Select value={loja} onChange={setLoja}>
            {LOJAS_ESTOQUE.map((l) => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Quantidade ({un})</Label>
          <input
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-md">
        <Label>Motivo</Label>
        <Select value={motivo} onChange={setMotivo}>
          <option>Vencido</option>
          <option>Quebra / avaria</option>
          <option>Devolução à fábrica</option>
        </Select>
      </div>

      <button
        onClick={registrar}
        className="mt-lg w-full rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
      >
        {ok ? "Registrado ✓" : "Registrar baixa"}
      </button>
      <p className="mt-sm text-caption text-on-surface-variant">
        Baixa o saldo da loja e entra no relatório de perdas. (Maquete)
      </p>
    </Overlay>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-label-md text-on-surface">{children}</label>;
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
    >
      {children}
    </select>
  );
}
