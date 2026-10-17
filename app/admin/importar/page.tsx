"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Produto, ProdutoCfg } from "@/lib/catalogo";
import { brl } from "@/lib/catalogo";
import { importarProdutos } from "@/lib/catalogo-store";
import { lerConfig, salvarConfig } from "@/lib/config-store";

const ICONE: Record<string, string> = {
  queijo: "nutrition",
  doce: "icecream",
  mel: "water_drop",
  charcut: "restaurant",
  defum: "outdoor_grill",
  salame: "outdoor_grill",
  linguic: "outdoor_grill",
  congel: "ac_unit",
  café: "local_cafe",
  cafe: "local_cafe",
  risoto: "ramen_dining",
  biscoit: "cookie",
  manteiga: "water_drop",
};
function iconeDe(cat: string, nome: string) {
  const s = `${cat} ${nome}`.toLowerCase();
  for (const k of Object.keys(ICONE)) if (s.includes(k)) return ICONE[k];
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
function precoNum(v: string) {
  const s = String(v).replace(/[^\d,.]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".");
  return Number(s) || 0;
}

// Parser CSV robusto: respeita campos entre aspas (com ; , e quebras de linha
// dentro) e aspas escapadas ("").
function parseCSV(texto: string): string[][] {
  const delim = (texto.split("\n")[0].match(/;/g)?.length ?? 0) >=
    (texto.split("\n")[0].match(/,/g)?.length ?? 0)
    ? ";"
    : ",";
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else {
      if (c === '"') aspas = true;
      else if (c === delim) {
        linha.push(campo);
        campo = "";
      } else if (c === "\n") {
        linha.push(campo);
        linhas.push(linha);
        linha = [];
        campo = "";
      } else if (c !== "\r") campo += c;
    }
  }
  if (campo.length || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((x) => x.trim()));
}

// Descobre o índice de cada coluna pelo cabeçalho.
function mapearColunas(header: string[]) {
  const norm = header.map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim());
  const acha = (...alvos: string[]) =>
    norm.findIndex((h) => alvos.some((a) => h.includes(a)));
  return {
    nome: acha("produto", "nome"),
    categoria: acha("categoria"),
    preco: acha("preco", "preço", "valor"),
    descricao: acha("descricao", "descrição", "desc"),
    imagem: acha("imagem", "imag", "url", "foto"),
    disp: acha("disponib"),
  };
}

export default function ImportarPage() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{ produto: Produto; cfg: ProdutoCfg }[]>([]);
  const [msg, setMsg] = useState("");

  function lerArquivo(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result ?? "");
      setCsv(txt);
      processar(txt);
    };
    reader.readAsText(file);
  }

  function processar(texto: string) {
    const linhas = parseCSV(texto);
    if (linhas.length < 2) {
      setMsg("Arquivo vazio ou sem linhas.");
      setPreview([]);
      return;
    }
    const col = mapearColunas(linhas[0]);
    const temHeader = col.nome >= 0;
    const corpo = temHeader ? linhas.slice(1) : linhas;
    // Sem header reconhecido: assume nome;categoria;preco;descricao
    const idx = temHeader
      ? col
      : { nome: 0, categoria: 1, preco: 2, descricao: 3, imagem: 4, disp: -1 };

    const out: { produto: Produto; cfg: ProdutoCfg }[] = [];
    const vistos = new Set<string>();
    for (const l of corpo) {
      const nome = (l[idx.nome] ?? "").trim();
      if (!nome || /^produto\s*\d*$/i.test(nome)) continue; // ignora placeholders
      const chave = nome.toLowerCase();
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const categoria = (l[idx.categoria] ?? "Importados").trim() || "Importados";
      const descricao = (l[idx.descricao] ?? "").trim() || undefined;
      const img = idx.imagem >= 0 ? (l[idx.imagem] ?? "").trim() : "";
      const cfg: ProdutoCfg = img ? { fotos: [{ url: img }] } : {};
      out.push({
        produto: {
          id: slug(nome),
          nome,
          categoria,
          icone: iconeDe(categoria, nome),
          img,
          descricao,
          tipo: "unidade",
          preco: precoNum(l[idx.preco] ?? "0"),
        },
        cfg,
      });
    }
    setPreview(out);
    setMsg(`${out.length} produto(s) prontos para importar.`);
  }

  function importar() {
    if (preview.length === 0) return;
    // Registra as categorias novas na config (senão não aparecem na loja).
    const cfg = lerConfig();
    const novas = [...new Set(preview.map((p) => p.produto.categoria))];
    const faltam = novas.filter((c) => c && !cfg.categorias.includes(c));
    if (faltam.length)
      salvarConfig({ ...cfg, categorias: [...cfg.categorias, ...faltam] });
    importarProdutos(preview);
    setMsg(`✓ ${preview.length} produto(s) importados!`);
    setTimeout(() => router.push("/admin/produtos"), 1000);
  }

  const categorias = [...new Set(preview.map((p) => p.produto.categoria))];

  return (
    <div className="mx-auto max-w-[52rem] space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Importar produtos
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Envie a planilha (CSV) com os produtos — o sistema lê nome, categoria,
          preço, descrição e foto. Depois você ajusta peso/atacado em Produtos.
        </p>
      </div>

      <section className="space-y-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <label className="flex cursor-pointer items-center justify-center gap-sm rounded-lg border-2 border-dashed border-primary/40 bg-primary-container/5 py-6 text-primary hover:border-primary">
          <span className="material-symbols-outlined text-[28px]">upload_file</span>
          <span className="text-body-lg font-medium">Escolher arquivo CSV</span>
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => lerArquivo(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <details>
          <summary className="cursor-pointer text-label-md text-secondary">
            ou colar o texto do CSV
          </summary>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            placeholder="Cole aqui o conteúdo do CSV..."
            className="mt-sm w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 font-mono text-label-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => processar(csv)}
            disabled={!csv.trim()}
            className="mt-sm rounded-lg border border-outline-variant px-md py-2 text-label-md text-primary disabled:opacity-40"
          >
            Processar texto
          </button>
        </details>
      </section>

      {msg && (
        <p className="rounded-lg bg-cream-surface px-md py-2.5 text-body-md text-on-surface-variant">
          {msg}
        </p>
      )}

      {preview.length > 0 && (
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Prévia ({preview.length})
              </h2>
              <p className="text-label-sm text-on-surface-variant">
                {categorias.length} categorias: {categorias.slice(0, 6).join(", ")}
                {categorias.length > 6 ? "…" : ""}
              </p>
            </div>
            <button
              onClick={importar}
              className="rounded-lg bg-primary px-lg py-2.5 text-label-md font-semibold text-on-primary shadow active:scale-95"
            >
              Importar {preview.length} produto(s)
            </button>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full text-left text-body-md">
              <thead className="sticky top-0 bg-surface-container-lowest text-label-sm uppercase text-on-surface-variant">
                <tr className="border-b border-outline-variant/20">
                  <th className="py-2">Foto</th>
                  <th className="py-2">Produto</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2 text-right">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {preview.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1.5">
                      {p.produto.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.produto.img}
                          alt=""
                          className="h-9 w-9 rounded object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant/40">
                          image
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-on-surface">{p.produto.nome}</td>
                    <td className="py-1.5 text-label-sm text-on-surface-variant">
                      {p.produto.categoria}
                    </td>
                    <td className="py-1.5 text-right text-primary">
                      {brl(p.produto.tipo === "unidade" ? p.produto.preco : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-sm text-label-sm text-on-surface-variant">
            As categorias novas são criadas automaticamente. Fotos entram pela URL
            do OlaClick (depois dá pra subir pro Storage em cada produto).
          </p>
        </section>
      )}
    </div>
  );
}
