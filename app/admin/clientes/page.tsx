"use client";

import { useState } from "react";
import { brl } from "@/lib/catalogo";
import { useConfig } from "@/lib/config-store";
import {
  useClientes,
  usePedidosLive,
  chaveCliente,
  type ClienteAgg,
  type PedidoLive,
} from "@/lib/pedidos-store";

function rotuloRecencia(dias: number) {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

function dataCurta(ms: number) {
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function soDigitos(t?: string) {
  return (t ?? "").replace(/\D/g, "");
}

export default function AdminClientes() {
  const clientes = useClientes();
  const pedidos = usePedidosLive();
  const cfg = useConfig();
  const [selChave, setSelChave] = useState<string | null>(null);

  const sel = clientes.find((c) => c.chave === selChave) ?? null;
  const inativos = clientes.filter((c) => c.inativoDias > 30).length;
  const totalGasto = clientes.reduce((s, c) => s + c.totalGasto, 0);

  if (clientes.length === 0) {
    return (
      <div className="space-y-lg">
        <h1 className="font-headline-lg text-headline-lg text-primary">Clientes</h1>
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-lg text-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50">
            group
          </span>
          <p className="mt-sm text-body-md text-on-surface-variant">
            Nenhum cliente ainda. Assim que entrar o primeiro pedido (delivery ou
            PDV), ele aparece aqui — com recência, total gasto e histórico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Clientes</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {clientes.length} clientes · {brl(totalGasto)} no total. Toque num
          cliente para ver o histórico.
        </p>
      </div>

      {inativos > 0 && !sel && (
        <div className="flex items-center gap-sm rounded-xl border-l-4 border-warning-amber bg-cream-surface px-md py-3">
          <span className="material-symbols-outlined text-warning-amber">
            campaign
          </span>
          <p className="text-body-md text-on-surface">
            <strong>{inativos} clientes</strong> não compram há mais de 30 dias.
            Boa hora pra um WhatsApp com cupom.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-lg lg:flex-row">
        {/* Lista */}
        <div
          className={
            sel ? "hidden lg:block lg:w-[360px] lg:flex-shrink-0" : "w-full"
          }
        >
          <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <table className="w-full min-w-[320px] text-left">
              <tbody className="divide-y divide-outline-variant/20">
                {clientes.map((c) => {
                  const inativo = c.inativoDias > 30;
                  const ativo = sel?.chave === c.chave;
                  return (
                    <tr
                      key={c.chave}
                      onClick={() => setSelChave(c.chave)}
                      className={`cursor-pointer text-body-md text-on-surface ${
                        ativo
                          ? "bg-primary-container/10"
                          : "hover:bg-surface-container-low"
                      }`}
                    >
                      <td className="px-md py-3">
                        <span className="font-medium">{c.nome}</span>
                        <span className="block text-caption text-on-surface-variant">
                          {c.qtdPedidos} pedidos · {brl(c.totalGasto)}
                        </span>
                      </td>
                      <td className="px-md py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${
                            inativo
                              ? "bg-warning-amber/20 text-secondary"
                              : "bg-tertiary-container/40 text-tertiary"
                          }`}
                        >
                          {rotuloRecencia(c.inativoDias)}
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
            <DetalheCliente
              cliente={sel}
              pedidos={pedidos}
              cashbackAtivo={cfg.cashbackAtivo}
              cashbackPercent={cfg.cashbackPercent}
              onFechar={() => setSelChave(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DetalheCliente({
  cliente,
  pedidos,
  cashbackAtivo,
  cashbackPercent,
  onFechar,
}: {
  cliente: ClienteAgg;
  pedidos: PedidoLive[];
  cashbackAtivo: boolean;
  cashbackPercent: number;
  onFechar: () => void;
}) {
  const historico = pedidos
    .filter((p) => chaveCliente(p) === cliente.chave)
    .slice(0, 8);
  const cashback = cliente.totalGasto * cashbackPercent;
  const zap = soDigitos(cliente.telefone);

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:sticky lg:top-20">
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
        <div className="flex items-center gap-sm">
          <button
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 lg:hidden"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-container/10 text-primary">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              {cliente.nome}
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              Último pedido {rotuloRecencia(cliente.inativoDias)}
            </span>
          </div>
        </div>
        <button
          onClick={onFechar}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container lg:flex"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="space-y-md p-md">
        {/* Cadastro */}
        <div className="grid gap-sm sm:grid-cols-2">
          <Info icone="call" rotulo="Telefone">
            {cliente.telefone || "—"}
          </Info>
          <Info icone="sell" rotulo="Canais">
            {cliente.canais.join(" · ")}
          </Info>
        </div>

        {/* Stats + cashback */}
        <div className="grid grid-cols-3 gap-sm">
          <Stat rotulo="Pedidos" valor={String(cliente.qtdPedidos)} />
          <Stat rotulo="Total gasto" valor={brl(cliente.totalGasto)} />
          {cashbackAtivo && (
            <Stat rotulo="Cashback" valor={brl(cashback)} destaque />
          )}
        </div>

        {/* Histórico */}
        <div>
          <h3 className="mb-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
            Últimos pedidos
          </h3>
          <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/20">
            {historico.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-md py-2.5"
              >
                <div className="leading-tight">
                  <p className="text-body-md text-on-surface">
                    <span className="text-primary">#{p.numero}</span> ·{" "}
                    {p.itens.map((it) => it.nome).join(", ")}
                  </p>
                  <span className="text-caption text-on-surface-variant">
                    {dataCurta(p.criadoEm)} · {p.canal}
                  </span>
                </div>
                <span className="font-medium text-primary">{brl(p.total)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-sm">
          <a
            href={zap ? `https://wa.me/55${zap}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-3 text-label-md text-tertiary ${
              zap ? "" : "pointer-events-none opacity-40"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function Info({
  icone,
  rotulo,
  children,
}: {
  icone: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/20 p-sm">
      <span className="mb-1 flex items-center gap-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">
          {icone}
        </span>
        {rotulo}
      </span>
      <p className="text-body-md text-on-surface">{children}</p>
    </div>
  );
}

function Stat({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-sm text-center ${
        destaque ? "bg-tertiary-container/30" : "bg-surface-container-low"
      }`}
    >
      <p
        className={`font-headline-md text-headline-md ${
          destaque ? "text-tertiary" : "text-primary"
        }`}
      >
        {valor}
      </p>
      <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
    </div>
  );
}
