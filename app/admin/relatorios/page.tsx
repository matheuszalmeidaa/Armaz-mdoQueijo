import { brl } from "@/lib/catalogo";

const MESES = [
  { mes: "Mar", valor: 38200 },
  { mes: "Abr", valor: 41500 },
  { mes: "Mai", valor: 39800 },
  { mes: "Jun", valor: 45200, pico: true },
  { mes: "Jul", valor: 52100, pico: true },
  { mes: "Ago", valor: 48600 },
];

const CANAIS = [
  { nome: "Delivery", valor: 30130, cls: "bg-primary" },
  { nome: "PDV", valor: 18470, cls: "bg-secondary" },
];

const LOJAS = [
  { nome: "Loja Centro", valor: 28190 },
  { nome: "Loja Bairro", valor: 20410 },
];

const TOP = [
  { nome: "Queijo Figueira", valor: 8400 },
  { nome: "Gouda Pesto Verde", valor: 6200 },
  { nome: "Queijo Morro Azul", valor: 5100 },
  { nome: "Tábua de Frios", valor: 4800 },
  { nome: "Mel de Florada", valor: 3200 },
];

export default function AdminRelatorios() {
  const maxMes = Math.max(...MESES.map((m) => m.valor));
  const totalCanal = CANAIS.reduce((s, c) => s + c.valor, 0);
  const totalLoja = LOJAS.reduce((s, l) => s + l.valor, 0);
  const maxTop = Math.max(...TOP.map((t) => t.valor));

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Relatórios
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Visão de agosto/2026 — vendas por loja e canal, tendência e mais
          vendidos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <Kpi rotulo="Receita do mês" valor={brl(48600)} delta="+7% vs. jul" positivo />
        <Kpi rotulo="Ticket médio" valor={brl(72.15)} delta="+2% vs. jul" positivo />
        <Kpi rotulo="Perda estimada" valor={brl(1240)} delta="2,5% da receita" />
      </div>

      {/* Tendência mensal */}
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="mb-1 font-headline-md text-headline-md text-primary">
          Vendas por mês
        </h2>
        <p className="mb-md text-label-sm text-on-surface-variant">
          Barras destacadas = pico de gorgonzola (festas de junho/julho).
        </p>
        <div className="flex h-48 items-end gap-md">
          {MESES.map((m) => (
            <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-caption text-on-surface-variant">
                {(m.valor / 1000).toFixed(0)}k
              </span>
              <div
                className={`w-full rounded-t-md ${
                  m.pico ? "bg-primary" : "bg-primary-container/30"
                }`}
                style={{ height: `${(m.valor / maxMes) * 140}px` }}
              />
              <span className="text-label-sm text-on-surface">{m.mes}</span>
            </div>
          ))}
        </div>
        <div className="mt-md flex items-start gap-sm rounded-lg bg-cream-surface px-md py-2.5">
          <span className="material-symbols-outlined text-secondary">
            calendar_month
          </span>
          <p className="text-body-md text-on-surface-variant">
            <strong className="text-on-surface">Sazonalidade:</strong> jun–jul
            puxam o gorgonzola. Vale reforçar a compra nesses meses.
          </p>
        </div>
      </section>

      <div className="grid gap-md lg:grid-cols-2">
        {/* Por canal */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="mb-md font-headline-md text-headline-md text-primary">
            Vendas por canal
          </h2>
          <div className="mb-md flex h-4 overflow-hidden rounded-full">
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

        {/* Por loja */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="mb-md font-headline-md text-headline-md text-primary">
            Vendas por loja
          </h2>
          <div className="space-y-md">
            {LOJAS.map((l) => (
              <div key={l.nome}>
                <div className="mb-1 flex items-center justify-between text-body-md">
                  <span className="text-on-surface">{l.nome}</span>
                  <span className="text-on-surface-variant">{brl(l.valor)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(l.valor / totalLoja) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Top produtos */}
      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="mb-md font-headline-md text-headline-md text-primary">
          Mais vendidos (no mês)
        </h2>
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
      </section>

      <p className="text-caption text-on-surface-variant">
        * Dados de teste. Ao ligar o Supabase, tudo isto é calculado das vendas
        reais (delivery + PDV), por loja e por período.
      </p>
    </div>
  );
}

function Kpi({
  rotulo,
  valor,
  delta,
  positivo,
}: {
  rotulo: string;
  valor: string;
  delta: string;
  positivo?: boolean;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
        {rotulo}
      </p>
      <p className="mt-1 font-display text-headline-lg text-on-surface">
        {valor}
      </p>
      <p
        className={`mt-1 text-label-sm ${
          positivo ? "text-tertiary" : "text-on-surface-variant"
        }`}
      >
        {delta}
      </p>
    </div>
  );
}
