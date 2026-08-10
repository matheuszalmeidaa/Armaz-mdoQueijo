"use client";

import { useState } from "react";
import { brl } from "@/lib/catalogo";
import { REGRAS } from "@/lib/regras";

const HOJE = new Date("2026-08-10T00:00:00");

type PedidoHist = { numero: string; data: string; resumo: string; total: number };
type Cliente = {
  nome: string;
  telefone: string;
  endereco: string;
  desde: string;
  pedidos: number;
  gasto: number;
  ultimaCompra: string;
  cashback: number;
  historico: PedidoHist[];
};

const CLIENTES: Cliente[] = [
  { nome: "Juliana Reis", telefone: "(73) 99810-2233", endereco: "Rua das Palmeiras, 45 — Centro", desde: "2025-02-10", pedidos: 20, gasto: 2310, ultimaCompra: "2026-08-07", cashback: 68.4, historico: [
    { numero: "8399", data: "07/08", resumo: "Canastra 500g · Mel", total: 132.5 },
    { numero: "8351", data: "28/07", resumo: "Tábua de Frios", total: 124.9 },
    { numero: "8302", data: "15/07", resumo: "Gouda Pesto 300g", total: 118.0 },
  ] },
  { nome: "Mariana Silveira", telefone: "(73) 99811-2345", endereco: "Rua das Flores, 45 — Centro", desde: "2025-05-22", pedidos: 14, gasto: 1240, ultimaCompra: "2026-08-08", cashback: 37.2, historico: [
    { numero: "8421", data: "09/08", resumo: "Figueira 300g · Geleia", total: 142.5 },
    { numero: "8360", data: "30/07", resumo: "Morro Azul 120g", total: 76.9 },
  ] },
  { nome: "João Carlos Ramos", telefone: "(73) 99822-4455", endereco: "Av. da Roça, 890 — Jardim", desde: "2025-07-01", pedidos: 9, gasto: 890, ultimaCompra: "2026-08-05", cashback: 22.5, historico: [
    { numero: "8420", data: "05/08", resumo: "Gouda Pesto 200g", total: 89.9 },
  ] },
  { nome: "Roberto Oliveira", telefone: "(73) 99833-6677", endereco: "Rua Cemitério, 110 — Itabuna", desde: "2026-01-14", pedidos: 6, gasto: 720, ultimaCompra: "2026-07-28", cashback: 14.4, historico: [
    { numero: "8330", data: "28/07", resumo: "Tábua · Mel", total: 156.9 },
  ] },
  { nome: "Carlos Nunes", telefone: "(73) 99844-8899", endereco: "Rua Nova, 12 — Centro", desde: "2026-06-03", pedidos: 3, gasto: 210, ultimaCompra: "2026-08-01", cashback: 6.3, historico: [
    { numero: "8415", data: "01/08", resumo: "Figueira 100g", total: 41.1 },
  ] },
  { nome: "Bruno Costa", telefone: "(73) 99855-1122", endereco: "Rua do Sol, 200 — Bairro", desde: "2025-11-20", pedidos: 4, gasto: 430, ultimaCompra: "2026-07-02", cashback: 12.9, historico: [
    { numero: "8210", data: "02/07", resumo: "Mix de Defumados", total: 68.0 },
  ] },
  { nome: "Ana Paula Mendes", telefone: "(73) 99866-3344", endereco: "Rua Alta, 77 — Centro", desde: "2025-03-15", pedidos: 11, gasto: 1510, ultimaCompra: "2026-06-15", cashback: 45.3, historico: [
    { numero: "8155", data: "15/06", resumo: "Canastra · Geleia · Mel", total: 210.3 },
  ] },
  { nome: "Fernanda Lima", telefone: "(73) 99877-5566", endereco: "Rua das Acácias, 210 — Centro", desde: "2025-09-08", pedidos: 8, gasto: 980, ultimaCompra: "2026-05-30", cashback: 29.4, historico: [
    { numero: "8090", data: "30/05", resumo: "Gorgonzola · Tábua", total: 189.4 },
  ] },
];

function diasDesde(data: string) {
  const d = new Date(data + "T00:00:00");
  return Math.round((HOJE.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
function rotuloRecencia(dias: number) {
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}
function anoMes(data: string) {
  const d = new Date(data + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export default function AdminClientes() {
  const [sel, setSel] = useState<Cliente | null>(null);
  const enriquecidos = CLIENTES.map((c) => ({ ...c, dias: diasDesde(c.ultimaCompra) })).sort((a, b) => a.dias - b.dias);
  const inativos = enriquecidos.filter((c) => c.dias > 30).length;
  const totalGasto = CLIENTES.reduce((s, c) => s + c.gasto, 0);

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Clientes</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {CLIENTES.length} clientes · {brl(totalGasto)} no total. Toque num cliente para ver o histórico.
        </p>
      </div>

      {inativos > 0 && !sel && (
        <div className="flex items-center gap-sm rounded-xl border-l-4 border-warning-amber bg-cream-surface px-md py-3">
          <span className="material-symbols-outlined text-warning-amber">campaign</span>
          <p className="text-body-md text-on-surface">
            <strong>{inativos} clientes</strong> não compram há mais de 30 dias. Boa hora pra um WhatsApp com cupom.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-lg lg:flex-row">
        {/* Lista */}
        <div className={sel ? "hidden lg:block lg:w-[360px] lg:flex-shrink-0" : "w-full"}>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <table className="w-full min-w-[320px] text-left">
              <tbody className="divide-y divide-outline-variant/20">
                {enriquecidos.map((c) => {
                  const inativo = c.dias > 30;
                  const ativo = sel?.telefone === c.telefone;
                  return (
                    <tr
                      key={c.telefone}
                      onClick={() => setSel(c)}
                      className={`cursor-pointer text-body-md text-on-surface ${ativo ? "bg-primary-container/10" : "hover:bg-surface-container-low"}`}
                    >
                      <td className="px-md py-3">
                        <span className="font-medium">{c.nome}</span>
                        <span className="block text-caption text-on-surface-variant">
                          {c.pedidos} pedidos · {brl(c.gasto)}
                        </span>
                      </td>
                      <td className="px-md py-3 text-right">
                        <span className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${inativo ? "bg-warning-amber/20 text-secondary" : "bg-tertiary-container/40 text-tertiary"}`}>
                          {rotuloRecencia(c.dias)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhe */}
        {sel && (
          <div className="w-full lg:flex-1">
            <DetalheCliente cliente={sel} onFechar={() => setSel(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function DetalheCliente({ cliente, onFechar }: { cliente: Cliente; onFechar: () => void }) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:sticky lg:top-20">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
        <div className="flex items-center gap-sm">
          <button onClick={onFechar} className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 lg:hidden">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/10 text-primary">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">{cliente.nome}</h2>
            <span className="text-label-sm text-on-surface-variant">Cliente desde {anoMes(cliente.desde)}</span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button className="rounded-lg border border-outline-variant px-3 py-2 text-label-md text-on-surface">Editar</button>
          <button onClick={onFechar} className="hidden h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container lg:flex">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="space-y-md p-md">
        {/* Cadastro */}
        <div className="grid gap-sm sm:grid-cols-2">
          <Info icone="call" rotulo="Telefone">{cliente.telefone}</Info>
          <Info icone="location_on" rotulo="Endereço">{cliente.endereco}</Info>
        </div>

        {/* Stats + cashback */}
        <div className="grid grid-cols-3 gap-sm">
          <Stat rotulo="Pedidos" valor={String(cliente.pedidos)} />
          <Stat rotulo="Total gasto" valor={brl(cliente.gasto)} />
          {REGRAS.cashback.ativo && (
            <Stat rotulo="Cashback" valor={brl(cliente.cashback)} destaque />
          )}
        </div>

        {/* Histórico */}
        <div>
          <h3 className="mb-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
            Últimos pedidos
          </h3>
          <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/20">
            {cliente.historico.map((p) => (
              <li key={p.numero} className="flex items-center justify-between px-md py-2.5">
                <div className="leading-tight">
                  <p className="text-body-md text-on-surface">
                    <span className="text-primary">#{p.numero}</span> · {p.resumo}
                  </p>
                  <span className="text-caption text-on-surface-variant">{p.data}</span>
                </div>
                <span className="font-medium text-primary">{brl(p.total)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-sm">
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-3 text-label-md text-tertiary">
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Chamar no WhatsApp
          </button>
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-3 text-label-md font-semibold text-on-primary">
            <span className="material-symbols-outlined text-[20px]">local_activity</span>
            Enviar cupom
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ icone, rotulo, children }: { icone: string; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-outline-variant/20 p-sm">
      <span className="mb-1 flex items-center gap-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">{icone}</span>
        {rotulo}
      </span>
      <p className="text-body-md text-on-surface">{children}</p>
    </div>
  );
}

function Stat({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-lg p-sm text-center ${destaque ? "bg-tertiary-container/30" : "bg-surface-container-low"}`}>
      <p className={`font-headline-md text-headline-md ${destaque ? "text-tertiary" : "text-primary"}`}>{valor}</p>
      <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
    </div>
  );
}
