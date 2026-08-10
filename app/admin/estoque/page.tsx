import Link from "next/link";
import {
  ESTOQUE,
  contarAlertas,
  vencendoEmBreve,
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
  const alertas = contarAlertas();
  const vencendo = vencendoEmBreve(7);

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Estoque
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Inventário separado por loja. A venda dá baixa; quando zera, esgota no
            catálogo.
          </p>
        </div>
        <Link
          href="/admin/estoque/entrada"
          className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary shadow active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">
            add_box
          </span>
          Entrada de mercadoria
        </Link>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <CardAlerta
          icone="schedule"
          rotulo="Vencendo (7 dias)"
          valor={alertas.vencendo}
          cor="warning-amber"
        />
        <CardAlerta
          icone="trending_down"
          rotulo="Abaixo do mínimo"
          valor={alertas.baixo}
          cor="secondary"
        />
        <CardAlerta
          icone="production_quantity_limits"
          rotulo="Esgotados"
          valor={alertas.esgotado}
          cor="error"
        />
      </div>

      {/* Vencendo em breve (FEFO) */}
      {vencendo.length > 0 && (
        <section className="rounded-xl border-l-4 border-warning-amber bg-cream-surface p-md">
          <div className="mb-sm flex items-center gap-sm">
            <span className="material-symbols-outlined text-warning-amber">
              priority_high
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Vender primeiro (vencendo)
            </h2>
          </div>
          <p className="mb-md text-body-md text-on-surface-variant">
            Priorize estes no balcão e no delivery para não virar perda.
          </p>
          <ul className="space-y-sm">
            {vencendo.map((e) => (
              <li
                key={e.produtoId}
                className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-md py-2.5"
              >
                <span className="flex items-center gap-sm text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-primary/50">
                    {iconeDe(e.produtoId)}
                  </span>
                  {nomeDe(e.produtoId)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${
                    (e.dias ?? 0) <= 3
                      ? "bg-error-container text-on-error-container"
                      : "bg-warning-amber/20 text-secondary"
                  }`}
                >
                  {e.dias === 0
                    ? "vence hoje"
                    : e.dias === 1
                      ? "vence amanhã"
                      : `vence em ${e.dias} dias`}
                </span>
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
                          <span className="material-symbols-outlined text-[18px] text-primary/40">
                            {iconeDe(e.produtoId)}
                          </span>
                        </div>
                        <span className="font-medium">{nomeDe(e.produtoId)}</span>
                      </div>
                    </td>
                    <CelulaLoja saldo={e.centro} un={un} />
                    <CelulaLoja saldo={e.bairro} un={un} />
                    <td className="px-md py-3 text-right font-medium text-primary">
                      {fmtQtd(total, un)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-sm text-caption text-on-surface-variant">
          * Dados de teste. Ao ligar o Supabase, os saldos passam a cair na venda
          e a validação de pedido (pediu 3, só há 2) entra no delivery.
        </p>
      </section>
    </div>
  );
}

function CelulaLoja({ saldo, un }: { saldo: SaldoLoja; un: "kg" | "un" }) {
  const st = statusSaldo(saldo);
  const chip = CHIP[st];
  return (
    <td className="px-md py-3">
      <div className="flex items-center gap-sm">
        <span
          className={
            st === "esgotado" ? "text-on-surface-variant" : "font-medium"
          }
        >
          {fmtQtd(saldo.saldo, un)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-label-sm font-medium ${chip.cls}`}
        >
          {chip.label}
        </span>
      </div>
      <span className="text-caption text-on-surface-variant">
        mín. {fmtQtd(saldo.min, un)}
      </span>
    </td>
  );
}

function CardAlerta({
  icone,
  rotulo,
  valor,
  cor,
}: {
  icone: string;
  rotulo: string;
  valor: number;
  cor: "warning-amber" | "secondary" | "error";
}) {
  const map = {
    "warning-amber": "text-warning-amber",
    secondary: "text-secondary",
    error: "text-error",
  } as const;
  return (
    <div className="flex items-center gap-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <span className={`material-symbols-outlined text-[32px] ${map[cor]}`}>
        {icone}
      </span>
      <div>
        <p className="font-display text-headline-lg text-on-surface">{valor}</p>
        <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
      </div>
    </div>
  );
}
