import { CATALOGO, brl } from "@/lib/catalogo";

export default function AdminProdutos() {
  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Produtos
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {CATALOGO.length} produtos no catálogo — usados no delivery e no PDV.
          </p>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary shadow active:scale-[0.98]">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Novo produto
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 text-label-sm uppercase tracking-wide text-on-surface-variant">
              <th className="px-md py-3 font-medium">Produto</th>
              <th className="px-md py-3 font-medium">Categoria</th>
              <th className="px-md py-3 font-medium">Tipo</th>
              <th className="px-md py-3 text-right font-medium">Preço</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {CATALOGO.map((p) => (
              <tr key={p.id} className="text-body-md text-on-surface hover:bg-surface-container-low">
                <td className="px-md py-3">
                  <div className="flex items-center gap-sm">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-container to-primary-container/20">
                      <span className="material-symbols-outlined text-[20px] text-primary/40">
                        {p.icone}
                      </span>
                    </div>
                    <div className="leading-tight">
                      <p className="font-medium">{p.nome}</p>
                      <span className="text-label-sm text-on-surface-variant">
                        {p.produtor}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-md py-3">
                  <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm">
                    {p.categoria}
                  </span>
                </td>
                <td className="px-md py-3">
                  {p.tipo === "peso" ? (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-warning-amber/20 px-2 py-0.5 text-label-sm text-secondary">
                      <span className="material-symbols-outlined text-[14px]">
                        scale
                      </span>
                      Por peso
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm">
                      Unidade
                    </span>
                  )}
                </td>
                <td className="px-md py-3 text-right font-medium text-primary">
                  {p.tipo === "peso"
                    ? `${brl(p.faixas[0].kg)}/kg`
                    : brl(p.preco)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-caption text-on-surface-variant">
        * Edição e cadastro entram ao ligar o Supabase. Aqui já dá para ver o
        modelo: cada produto é por peso (preço/kg + faixas) ou por unidade.
      </p>
    </div>
  );
}
