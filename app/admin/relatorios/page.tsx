"use client";

import { brl } from "@/lib/catalogo";
import { usePedidosLive } from "@/lib/pedidos-store";

const DIA_MS = 24 * 60 * 60 * 1000;

export default function AdminRelatorios() {
  const pedidos = usePedidosLive();

  const receita = pedidos.reduce((s, p) => s + p.total, 0);
  const nPedidos = pedidos.length;
  const ticket = nPedidos ? receita / nPedidos : 0;

  // Por canal (Delivery x PDV)
  const canaisMap = { Delivery: 0, PDV: 0 };
  for (const p of pedidos) canaisMap[p.canal] += p.total;
  const CANAIS = [
    { nome: "Delivery", valor: canaisMap.Delivery, cls: "bg-primary" },
    { nome: "PDV", valor: canaisMap.PDV, cls: "bg-secondary" },
  ];
  const totalCanal = receita || 1;

  // Últimos 7 dias
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const DIAS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje.getTime() - (6 - i) * DIA_MS);
    const fim = d.getTime() + DIA_MS;
    const valor = pedidos
      .filter((p) => p.criadoEm >= d.getTime() && p.criadoEm < fim)
      .reduce((s, p) => s + p.total, 0);
    return {
      rotulo: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      valor,
    };
  });
  const maxDia = Math.max(1, ...DIAS.map((d) => d.valor));

  // Mais vendidos (agrega itens de todos os pedidos por nome)
  const prodMap = new Map<string, number>();
  for (const p of pedidos)
    for (const it of p.itens)
      prodMap.set(it.nome, (prodMap.get(it.nome) ?? 0) + it.preco);
  const TOP = Array.from(prodMap.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);
  const maxTop = Math.max(1, ...TOP.map((t) => t.valor));

  const vazio = nPedidos === 0;

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Relatórios
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Calculado das vendas reais (delivery + PDV).
        </p>
      </div>

      {vazio && (
        <div className="flex items-center gap-sm rounded-xl border border-outline-variant/40 bg-cream-surface p-md">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-body-md text-on-surface-variant">
            Ainda sem vendas registradas. Assim que entrarem pedidos (delivery)
            e vendas (PDV), os números aparecem aqui.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <Kpi rotulo="Receita total" valor={brl(receita)} sub={`${nPedidos} pedido(s)`} />
        <Kpi rotulo="Ticket médio" valor={brl(ticket)} sub="por pedido" />
        <Kpi
          rotulo="Delivery x PDV"
          valor={`${Math.round((canaisMap.Delivery / totalCanal) * 100)}% / ${Math.round(
            (canaisMap.PDV / totalCanal) * 100
          )}%`}
          sub="participação"
        />
      </div>

      {/* Últimos 7 dias */}
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="mb-md font-headline-md text-headline-md text-primary">
          Vendas — últimos 7 dias
        </h2>
        <div className="flex h-48 items-end gap-md">
          {DIAS.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-caption text-on-surface-variant">
                {d.valor > 0 ? `${(d.valor / 1000).toFixed(1)}k` : ""}
              </span>
              <div
                className="w-full rounded-t-md bg-primary-container/30"
                style={{ height: `${(d.valor / maxDia) * 140}px` }}
              />
              <span className="text-label-sm capitalize text-on-surface">
                {d.rotulo}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-md lg:grid-cols-2">
        {/* Por canal */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="mb-md font-headline-md text-headline-md text-primary">
            Vendas por canal
          </h2>
          <div className="mb-md flex h-4 overflow-hidden rounded-full bg-surface-container">
            {CANAIS.map((c) => (
              <div
                key={c.nome}
                className={c.cls}
                style={{ width: `${(c.valor / totalCanal) * 100}%` }}
              />
            ))}
          </div>
          <div className="space-y-sm">
            {CANAIS.map((c) => (
              <div key={c.nome} className="flex items-center justify-between">
                <span className="flex items-center gap-sm text-body-md text-on-surface">
                  <span className={`h-3 w-3 rounded-full ${c.cls}`} />
                  {c.nome}
                </span>
                <span className="text-body-md text-on-surface-variant">
                  {brl(c.valor)}{" "}
                  <span className="text-label-sm">
                    ({Math.round((c.valor / totalCanal) * 100)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Top produtos */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="mb-md font-headline-md text-headline-md text-primary">
            Mais vendidos
          </h2>
          {TOP.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">
              Sem itens ainda.
            </p>
          ) : (
            <div className="space-y-md">
              {TOP.map((t, i) => (
                <div key={t.nome} className="flex items-center gap-md">
                  <span className="w-5 text-right font-display text-headline-md text-primary/40">
                    {i + 1}
                  </span>
                  <div className="flex-grow">
                    <div className="mb-1 flex items-center justify-between text-body-md">
                      <span className="text-on-surface">{t.nome}</span>
                      <span className="text-on-surface-variant">{brl(t.valor)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${(t.valor / maxTop) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  rotulo,
  valor,
  sub,
}: {
  rotulo: string;
  valor: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
        {rotulo}
      </p>
      <p className="mt-1 font-display text-headline-lg text-on-surface">
        {valor}
      </p>
      <p className="mt-1 text-label-sm text-on-surface-variant">{sub}</p>
    </div>
  );
}
