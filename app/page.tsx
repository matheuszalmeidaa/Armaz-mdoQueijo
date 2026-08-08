import Link from "next/link";

type Modulo = {
  href: string;
  icon: string;
  titulo: string;
  descricao: string;
  fase: string;
  ativo: boolean;
};

const modulos: Modulo[] = [
  {
    href: "/pdv",
    icon: "point_of_sale",
    titulo: "PDV",
    descricao:
      "Registra a venda em ≤3 toques, baixa o estoque na hora e aposenta o caderninho.",
    fase: "Fase 1",
    ativo: false,
  },
  {
    href: "/admin",
    icon: "dashboard",
    titulo: "Dashboard",
    descricao:
      "Vendas por loja e por canal, ticket médio, mais vendidos e alertas de validade.",
    fase: "Fase 2",
    ativo: false,
  },
  {
    href: "/loja",
    icon: "storefront",
    titulo: "Delivery",
    descricao:
      "A loja do cliente (Fusqueijão), reusando o mesmo catálogo. Substitui o OlaClick.",
    fase: "Fase 3",
    ativo: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-full">
      {/* Cabeçalho da marca */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <h1 className="font-display text-headline-lg tracking-tight text-primary">
            Armazém do Queijo
          </h1>
        </div>
        <span className="rounded-full bg-secondary-container px-3 py-1 text-label-sm font-medium text-on-secondary-container">
          MVP
        </span>
      </header>

      <div className="mx-auto max-w-4xl px-md pb-xl">
        {/* Hero */}
        <section className="mt-lg overflow-hidden rounded-xl bg-primary p-lg text-on-primary shadow-lg">
          <p className="text-label-md uppercase tracking-wide text-primary-fixed-dim">
            Uma plataforma. Três frentes.
          </p>
          <h2 className="mt-sm max-w-xl text-headline-lg leading-tight text-cream-surface">
            Delivery, PDV e estoque das duas lojas — no mesmo lugar, com os
            mesmos dados.
          </h2>
          <p className="mt-sm max-w-xl text-body-md text-primary-fixed">
            A espinha guarda produtos, estoque por loja e cada venda. PDV,
            delivery e dashboard são só janelas para o mesmo livro-caixa.
          </p>
        </section>

        {/* Módulos */}
        <section className="mt-xl">
          <div className="mb-md flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-primary">
              Módulos
            </h3>
            <span className="text-label-sm text-on-surface-variant">
              Construídos em ordem — cada fase entra em uso
            </span>
          </div>

          <div className="grid gap-gutter sm:grid-cols-3">
            {modulos.map((m) => (
              <ModuloCard key={m.href} modulo={m} />
            ))}
          </div>
        </section>

        {/* Espinha */}
        <section className="mt-xl rounded-xl border border-dashed border-outline/30 bg-cream-surface p-lg">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary">
              database
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              A espinha (Supabase)
            </h3>
          </div>
          <p className="mt-sm text-body-md text-on-surface-variant">
            Fonte única da verdade. Se está bem alimentada, todo indicador —
            mais vendido por época, cliente inativo, perda de produto — é só uma
            consulta.
          </p>
          <div className="mt-md flex flex-wrap gap-sm">
            {[
              "lojas",
              "produtos",
              "estoque",
              "movimentacoes",
              "vendas",
              "clientes",
            ].map((t) => (
              <code
                key={t}
                className="rounded-lg bg-surface-container px-3 py-1.5 text-label-sm text-on-surface"
              >
                {t}
              </code>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ModuloCard({ modulo }: { modulo: Modulo }) {
  return (
    <Link
      href={modulo.ativo ? modulo.href : "#"}
      aria-disabled={!modulo.ativo}
      className={`group flex flex-col rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all ${
        modulo.ativo
          ? "hover:-translate-y-0.5 hover:shadow-md"
          : "cursor-not-allowed opacity-70"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container/10 text-primary">
          <span className="material-symbols-outlined">{modulo.icon}</span>
        </div>
        <span className="rounded-full border border-outline-variant/40 px-2.5 py-0.5 text-label-sm text-on-surface-variant">
          {modulo.fase}
        </span>
      </div>
      <h4 className="mt-md font-headline-md text-headline-md text-primary">
        {modulo.titulo}
      </h4>
      <p className="mt-xs text-body-md text-on-surface-variant">
        {modulo.descricao}
      </p>
    </Link>
  );
}
