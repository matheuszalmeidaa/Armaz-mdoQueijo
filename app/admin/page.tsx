"use client";

import Link from "next/link";
import { brl } from "@/lib/catalogo";
import { usePedidosLive, type StatusLive } from "@/lib/pedidos-store";

const DOT: Record<StatusLive, string> = {
  Novo: "bg-error",
  Preparando: "bg-warning-amber",
  "Em rota": "bg-primary",
  Entregue: "bg-tertiary",
};

const META_DIA = 3200;

export default function AdminDashboard() {
  const pedidos = usePedidosLive();

  const vendas = pedidos.reduce((s, p) => s + p.total, 0);
  const novos = pedidos.filter((p) => p.status === "Novo").length;
  const ticket = pedidos.length ? vendas / pedidos.length : 0;
  const ativas = pedidos.filter(
    (p) => p.status === "Preparando" || p.status === "Em rota"
  ).length;
  const concluidas = pedidos.filter((p) => p.status === "Entregue").length;
  const metaPct = Math.min(100, Math.round((vendas / META_DIA) * 100));

  const kpis = [
    { icone: "payments", rotulo: "Vendas", valor: brl(vendas), delta: `${pedidos.length} pedidos`, positivo: true },
    { icone: "receipt_long", rotulo: "Novos pedidos", valor: String(novos), delta: novos ? "aguardando" : "tudo em dia", positivo: true },
    { icone: "shopping_cart", rotulo: "Ticket médio", valor: brl(ticket), delta: "por pedido", positivo: true },
    { icone: "local_shipping", rotulo: "Entregas ativas", valor: String(ativas), delta: `${concluidas} concluídas`, positivo: true },
  ];

  const recentes = pedidos.slice(0, 6);

  return (
    <div className="space-y-lg">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.rotulo}
            className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                {k.rotulo}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant">
                {k.icone}
              </span>
            </div>
            <p className="mt-sm font-display text-headline-lg text-on-surface">
              {k.valor}
            </p>
            <p className="mt-1 text-label-sm text-tertiary">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-md lg:grid-cols-3">
        {/* Pedidos recentes */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:col-span-2">
          <div className="mb-md flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">
              Pedidos recentes
            </h2>
            <Link href="/admin/pedidos" className="text-label-md text-secondary">
              Ver todos
            </Link>
          </div>
          {recentes.length === 0 ? (
            <p className="py-6 text-center text-body-md text-on-surface-variant">
              Nenhum pedido ainda. Delivery e PDV aparecem aqui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Cliente</th>
                    <th className="pb-2 font-medium">Canal</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {recentes.map((p) => (
                    <tr key={p.id} className="text-body-md text-on-surface">
                      <td className="py-3 font-medium text-primary">#{p.numero}</td>
                      <td className="py-3">{p.cliente}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm">
                          {p.canal}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${DOT[p.status]}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {brl(p.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Coluna lateral */}
        <div className="space-y-md">
          {/* Status da operação */}
          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="mb-md font-headline-md text-headline-md text-primary">
              Status da operação
            </h2>
            <div className="space-y-sm">
              <LinhaStatus icone="notifications_active" texto="Pedidos novos" valor={String(novos)} alerta={novos > 0} />
              <LinhaStatus icone="local_shipping" texto="Entregas em andamento" valor={String(ativas)} />
              <LinhaStatus icone="check_circle" texto="Concluídos" valor={String(concluidas)} />
            </div>
          </section>

          {/* Meta diária */}
          <section className="rounded-xl bg-primary p-md text-on-primary shadow-lg">
            <span className="text-label-sm uppercase tracking-wide text-primary-fixed-dim">
              Meta diária
            </span>
            <div className="mt-1 flex items-end justify-between">
              <span className="font-display text-headline-lg text-cream-surface">
                {brl(META_DIA)}
              </span>
              <span className="text-label-md text-primary-fixed">
                {metaPct}% atingido
              </span>
            </div>
            <div className="mt-sm h-2 overflow-hidden rounded-full bg-primary-container">
              <div
                className="h-full rounded-full bg-cream-surface"
                style={{ width: `${metaPct}%` }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function LinhaStatus({
  icone,
  texto,
  valor,
  alerta,
}: {
  icone: string;
  texto: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-md py-2.5">
      <span className="flex items-center gap-sm text-body-md text-on-surface">
        <span
          className={`material-symbols-outlined text-[20px] ${
            alerta ? "text-warning-amber" : "text-secondary"
          }`}
        >
          {icone}
        </span>
        {texto}
      </span>
      <span
        className={`font-headline-md text-headline-md ${
          alerta ? "text-warning-amber" : "text-primary"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}
