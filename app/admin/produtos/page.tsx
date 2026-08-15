"use client";

import Link from "next/link";
import { brl } from "@/lib/catalogo";
import { useCatalogo, excluirProduto } from "@/lib/catalogo-store";

export default function AdminProdutos() {
  const CATALOGO = useCatalogo();
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
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary shadow active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Novo produto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 text-label-sm uppercase tracking-wide text-on-surface-variant">
              <th className="px-md py-3 font-medium">Produto</th>
              <th className="px-md py-3 font-medium">Categoria</th>
              <th className="px-md py-3 font-medium">Tipo</th>
              <th className="px-md py-3 text-right font-medium">Preço</th>
              <th className="px-md py-3"></th>
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
                <td className="px-md py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/admin/produtos/${p.id}/editar`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${p.nome}" do catálogo?`))
                          excluirProduto(p.id);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-danger-red hover:bg-surface-container active:scale-95"
                      title="Excluir"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-caption text-on-surface-variant">
        Cada produto é por peso (preço/kg + faixas de desconto) ou por unidade.
        Salvar reflete no delivery e no PDV em qualquer aparelho.
      </p>
    </div>
  );
}
