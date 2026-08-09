const KPIS = [
  {
    icone: "payments",
    rotulo: "Vendas hoje",
    valor: "R$ 2.450,80",
    delta: "+12% vs. ontem",
    positivo: true,
  },
  {
    icone: "receipt_long",
    rotulo: "Novos pedidos",
    valor: "34",
    delta: "5 pendentes",
    positivo: true,
  },
  {
    icone: "shopping_cart",
    rotulo: "Ticket médio",
    valor: "R$ 72,15",
    delta: "-3% vs. média",
    positivo: false,
  },
  {
    icone: "local_shipping",
    rotulo: "Entregas ativas",
    valor: "12",
    delta: "8 concluídas",
    positivo: true,
  },
];

const PEDIDOS = [
  { id: "#8421", cliente: "Mariana Silveira", canal: "Delivery", status: "Preparando", cor: "bg-warning-amber", total: "R$ 142,50" },
  { id: "#8420", cliente: "João Carlos Ramos", canal: "Delivery", status: "Em rota", cor: "bg-tertiary", total: "R$ 89,90" },
  { id: "#8419", cliente: "Balcão — Loja Centro", canal: "PDV", status: "Concluído", cor: "bg-outline", total: "R$ 54,00" },
  { id: "#8418", cliente: "Roberto Oliveira", canal: "Delivery", status: "Aceito", cor: "bg-secondary", total: "R$ 210,30" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-lg">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-md xl:grid-cols-4">
        {KPIS.map((k) => (
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
            <p
              className={`mt-1 text-label-sm ${
                k.positivo ? "text-tertiary" : "text-danger-red"
              }`}
            >
              {k.delta}
            </p>
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
            <a href="#" className="text-label-md text-secondary">
              Ver todos
            </a>
          </div>
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
                {PEDIDOS.map((p) => (
                  <tr key={p.id} className="text-body-md text-on-surface">
                    <td className="py-3 font-medium text-primary">{p.id}</td>
                    <td className="py-3">{p.cliente}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm">
                        {p.canal}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${p.cor}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium">{p.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Coluna lateral */}
        <div className="space-y-md">
          {/* Status da operação */}
          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="mb-md font-headline-md text-headline-md text-primary">
              Status da operação
            </h2>
            <div className="space-y-sm">
              <LinhaStatus icone="inventory_2" texto="Queijos para embalar" valor="14" />
              <LinhaStatus icone="schedule" texto="Tempo médio de preparo" valor="18m" />
              <LinhaStatus icone="warning" texto="Lotes vencendo (7 dias)" valor="3" alerta />
            </div>
          </section>

          {/* Meta diária */}
          <section className="rounded-xl bg-primary p-md text-on-primary shadow-lg">
            <span className="text-label-sm uppercase tracking-wide text-primary-fixed-dim">
              Meta diária
            </span>
            <div className="mt-1 flex items-end justify-between">
              <span className="font-display text-headline-lg text-cream-surface">
                R$ 3.200
              </span>
              <span className="text-label-md text-primary-fixed">76% atingido</span>
            </div>
            <div className="mt-sm h-2 overflow-hidden rounded-full bg-primary-container">
              <div className="h-full rounded-full bg-cream-surface" style={{ width: "76%" }} />
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
