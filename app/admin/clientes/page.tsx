import { brl } from "@/lib/catalogo";

const HOJE = new Date("2026-08-09T00:00:00");

type Cliente = {
  nome: string;
  telefone: string;
  pedidos: number;
  gasto: number;
  ultimaCompra: string; // YYYY-MM-DD
};

const CLIENTES: Cliente[] = [
  { nome: "Juliana Reis", telefone: "(73) 99810-2233", pedidos: 20, gasto: 2310, ultimaCompra: "2026-08-07" },
  { nome: "Mariana Silveira", telefone: "(73) 99811-2345", pedidos: 14, gasto: 1240, ultimaCompra: "2026-08-08" },
  { nome: "João Carlos Ramos", telefone: "(73) 99822-4455", pedidos: 9, gasto: 890, ultimaCompra: "2026-08-05" },
  { nome: "Roberto Oliveira", telefone: "(73) 99833-6677", pedidos: 6, gasto: 720, ultimaCompra: "2026-07-28" },
  { nome: "Carlos Nunes", telefone: "(73) 99844-8899", pedidos: 3, gasto: 210, ultimaCompra: "2026-08-01" },
  { nome: "Bruno Costa", telefone: "(73) 99855-1122", pedidos: 4, gasto: 430, ultimaCompra: "2026-07-02" },
  { nome: "Ana Paula Mendes", telefone: "(73) 99866-3344", pedidos: 11, gasto: 1510, ultimaCompra: "2026-06-15" },
  { nome: "Fernanda Lima", telefone: "(73) 99877-5566", pedidos: 8, gasto: 980, ultimaCompra: "2026-05-30" },
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

export default function AdminClientes() {
  const enriquecidos = CLIENTES.map((c) => ({
    ...c,
    dias: diasDesde(c.ultimaCompra),
  })).sort((a, b) => a.dias - b.dias);

  const inativos = enriquecidos.filter((c) => c.dias > 30).length;
  const totalGasto = CLIENTES.reduce((s, c) => s + c.gasto, 0);

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Clientes
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {CLIENTES.length} clientes · {brl(totalGasto)} no total.
        </p>
      </div>

      {/* Destaques */}
      <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
        <CardKpi icone="group" rotulo="Clientes" valor={String(CLIENTES.length)} />
        <CardKpi
          icone="person_off"
          rotulo="Inativos (30+ dias)"
          valor={String(inativos)}
          alerta
        />
        <CardKpi
          icone="favorite"
          rotulo="Mais fiel"
          valor={enriquecidos.reduce((a, b) => (b.pedidos > a.pedidos ? b : a)).nome.split(" ")[0]}
        />
      </div>

      {inativos > 0 && (
        <div className="flex items-center gap-sm rounded-xl border-l-4 border-warning-amber bg-cream-surface px-md py-3">
          <span className="material-symbols-outlined text-warning-amber">
            campaign
          </span>
          <p className="text-body-md text-on-surface">
            <strong>{inativos} clientes</strong> não compram há mais de 30 dias.
            Uma boa hora para uma mensagem no WhatsApp com um cupom.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 text-label-sm uppercase tracking-wide text-on-surface-variant">
              <th className="px-md py-3 font-medium">Cliente</th>
              <th className="px-md py-3 text-right font-medium">Pedidos</th>
              <th className="px-md py-3 text-right font-medium">Total gasto</th>
              <th className="px-md py-3 font-medium">Última compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {enriquecidos.map((c) => {
              const inativo = c.dias > 30;
              return (
                <tr key={c.telefone} className="text-body-md text-on-surface hover:bg-surface-container-low">
                  <td className="px-md py-3">
                    <span className="font-medium">{c.nome}</span>
                    <span className="block text-caption text-on-surface-variant">
                      {c.telefone}
                    </span>
                  </td>
                  <td className="px-md py-3 text-right">{c.pedidos}</td>
                  <td className="px-md py-3 text-right font-medium text-primary">
                    {brl(c.gasto)}
                  </td>
                  <td className="px-md py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${
                        inativo
                          ? "bg-warning-amber/20 text-secondary"
                          : "bg-tertiary-container/40 text-tertiary"
                      }`}
                    >
                      {rotuloRecencia(c.dias)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-on-surface-variant">
        * Dados de teste. Ao ligar o Supabase, os clientes vêm das vendas
        (delivery e PDV) e a recência é calculada sozinha.
      </p>
    </div>
  );
}

function CardKpi({
  icone,
  rotulo,
  valor,
  alerta,
}: {
  icone: string;
  rotulo: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <div className="flex items-center gap-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <span
        className={`material-symbols-outlined text-[32px] ${
          alerta ? "text-warning-amber" : "text-secondary"
        }`}
      >
        {icone}
      </span>
      <div>
        <p className="font-display text-headline-md text-on-surface">{valor}</p>
        <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
      </div>
    </div>
  );
}
