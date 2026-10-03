"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Produto } from "@/lib/catalogo";
import { brl } from "@/lib/catalogo";
import { importarProdutos } from "@/lib/catalogo-store";

const ICONE: Record<string, string> = {
  queijo: "nutrition",
  doce: "icecream",
  mel: "water_drop",
  charcutaria: "restaurant",
};
function iconeDe(cat: string) {
  const c = (cat || "").toLowerCase();
  for (const k of Object.keys(ICONE)) if (c.includes(k)) return ICONE[k];
  return "nutrition";
}
function slug(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || Math.random().toString(36).slice(2)
  );
}
const num = (v: string) =>
  Number(String(v).replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".")) || 0;

export default function ImportarPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [csv, setCsv] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [preview, setPreview] = useState<Produto[]>([]);
  const [msg, setMsg] = useState("");

  async function buscarLink() {
    if (!url.trim()) return;
    setBuscando(true);
    setMsg("");
    try {
      const r = await fetch(`/api/importar-ola?url=${encodeURIComponent(url.trim())}`);
      const j = await r.json();
      if (j.error) setMsg(j.error);
      else {
        setPreview(j.produtos ?? []);
        setMsg(j.aviso ?? `${(j.produtos ?? []).length} produto(s) encontrados.`);
      }
    } catch {
      setMsg("Falha ao buscar o link.");
    }
    setBuscando(false);
  }

  function processarCsv() {
    // Formato: nome ; categoria ; preço ; descrição   (ou separado por vírgula)
    const linhas = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const out: Produto[] = [];
    for (const l of linhas) {
      const partes = l.split(/[;\t]|,(?=\s)/).map((s) => s.trim());
      const [nome, categoria = "Importados", preco = "0", descricao = ""] = partes;
      if (!nome || /^nome$/i.test(nome)) continue; // ignora cabeçalho
      out.push({
        id: slug(nome),
        nome,
        categoria: categoria || "Importados",
        icone: iconeDe(categoria),
        img: "",
        descricao: descricao || undefined,
        tipo: "unidade",
        preco: num(preco),
      });
    }
    setPreview(out);
    setMsg(`${out.length} produto(s) prontos para importar.`);
  }

  function importar() {
    if (preview.length === 0) return;
    importarProdutos(preview.map((produto) => ({ produto })));
    setMsg(`✓ ${preview.length} produto(s) importados!`);
    setTimeout(() => router.push("/admin/produtos"), 900);
  }

  return (
    <div className="mx-auto max-w-[48rem] space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Importar produtos
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Traga vários produtos de uma vez — pelo link do OlaClick ou colando uma
          planilha. Depois você ajusta preço/foto/peso em Produtos.
        </p>
      </div>

      {/* Importar do OlaClick */}
      <section className="space-y-sm rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Do link do OlaClick
        </h2>
        <div className="flex gap-sm">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://armazem-do-queijo.ola.click/products"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md outline-none focus:border-primary"
          />
          <button
            onClick={buscarLink}
            disabled={buscando || !url.trim()}
            className="flex-shrink-0 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary active:scale-95 disabled:opacity-40"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </section>

      {/* Importar por CSV */}
      <section className="space-y-sm rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Ou colar planilha (CSV)
        </h2>
        <p className="text-label-sm text-on-surface-variant">
          Uma linha por produto, separado por <strong>;</strong> :{" "}
          <code>nome ; categoria ; preço ; descrição</code>
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={5}
          placeholder={"Queijo Canastra ; Queijos ; 89,90 ; Meia cura\nMel Silvestre ; Mel ; 32,00"}
          className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 font-mono text-body-md outline-none focus:border-primary"
        />
        <button
          onClick={processarCsv}
          disabled={!csv.trim()}
          className="rounded-lg border border-outline-variant px-md py-2 text-label-md text-primary disabled:opacity-40"
        >
          Processar lista
        </button>
      </section>

      {msg && (
        <p className="rounded-lg bg-cream-surface px-md py-2.5 text-body-md text-on-surface-variant">
          {msg}
        </p>
      )}

      {/* Prévia */}
      {preview.length > 0 && (
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-sm flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Prévia ({preview.length})
            </h2>
            <button
              onClick={importar}
              className="rounded-lg bg-primary px-lg py-2.5 text-label-md font-semibold text-on-primary shadow active:scale-95"
            >
              Importar {preview.length} produto(s)
            </button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-body-md">
              <thead className="text-label-sm uppercase text-on-surface-variant">
                <tr className="border-b border-outline-variant/20">
                  <th className="py-2">Produto</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2 text-right">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {preview.map((p, i) => (
                  <tr key={i}>
                    <td className="py-2 text-on-surface">{p.nome}</td>
                    <td className="py-2 text-on-surface-variant">{p.categoria}</td>
                    <td className="py-2 text-right text-primary">
                      {p.tipo === "unidade" ? brl(p.preco) : "por peso"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-sm text-label-sm text-on-surface-variant">
            Produtos com o mesmo nome de um já existente serão atualizados. Foto,
            peso e preço de atacado você ajusta depois em Produtos.
          </p>
        </section>
      )}
    </div>
  );
}
