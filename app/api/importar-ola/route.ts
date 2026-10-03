import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Normaliza nome → id (slug).
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

const ICONE: Record<string, string> = {
  queijo: "nutrition",
  doce: "icecream",
  mel: "water_drop",
  charcutaria: "restaurant",
};
function iconeDe(cat: string) {
  const c = cat.toLowerCase();
  for (const k of Object.keys(ICONE)) if (c.includes(k)) return ICONE[k];
  return "nutrition";
}

type Bruto = Record<string, unknown>;

// Um objeto parece um produto? (tem nome e algum preço numérico)
function ehProduto(o: Bruto): boolean {
  const nome = o.name ?? o.title ?? o.product_name;
  const preco =
    o.price ?? o.base_price ?? o.final_price ?? o.amount ?? o.value;
  return typeof nome === "string" && nome.trim().length > 0 && preco != null;
}

// Varre o JSON recursivamente coletando produtos, carregando a categoria do
// ancestral mais próximo que tenha nome.
function coletar(
  valor: unknown,
  categoria: string,
  achados: { raw: Bruto; categoria: string }[],
  prof = 0
) {
  if (prof > 12 || valor == null) return;
  if (Array.isArray(valor)) {
    for (const v of valor) coletar(v, categoria, achados, prof + 1);
    return;
  }
  if (typeof valor !== "object") return;
  const o = valor as Bruto;
  if (ehProduto(o)) {
    achados.push({ raw: o, categoria });
    return; // não desce dentro de um produto
  }
  // Se este objeto tem um nome e filhos-lista, vira a categoria dos filhos.
  const nomeCat =
    (typeof o.name === "string" && o.name) ||
    (typeof o.title === "string" && o.title) ||
    categoria;
  for (const v of Object.values(o)) coletar(v, nomeCat || categoria, achados, prof + 1);
}

function normalizar(raw: Bruto, categoria: string) {
  const nome = String(raw.name ?? raw.title ?? raw.product_name ?? "").trim();
  if (!nome) return null;
  const preco = Number(
    raw.price ?? raw.base_price ?? raw.final_price ?? raw.amount ?? raw.value ?? 0
  );
  const desc = String(raw.description ?? raw.desc ?? "").trim() || undefined;
  let img = "";
  const im = raw.image ?? raw.photo ?? raw.picture ?? raw.image_url;
  if (typeof im === "string") img = im;
  else if (Array.isArray(raw.images) && raw.images[0]) {
    const f = raw.images[0] as Bruto | string;
    img = typeof f === "string" ? f : String((f as Bruto).url ?? "");
  }
  const cat = (categoria || "Importados").trim();
  return {
    id: slug(nome),
    nome,
    categoria: cat,
    icone: iconeDe(cat),
    img,
    descricao: desc,
    tipo: "unidade" as const,
    preco: isFinite(preco) ? preco : 0,
  };
}

async function buscar(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArmazemImport/1.0)",
        Accept: "application/json, text/html,*/*",
      },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

// GET /api/importar-ola?url=https://loja.ola.click/products
export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get("url") ?? "";
  if (!/ola\.click/.test(u))
    return NextResponse.json({ error: "Informe um link do OlaClick (ola.click)." }, { status: 400 });

  let base: string;
  try {
    base = new URL(u).origin;
  } catch {
    return NextResponse.json({ error: "Link inválido." }, { status: 400 });
  }

  // 1) Página inicial (SPA) — descobre URLs da api.ola.click e/ou estado embutido.
  const html = await buscar(base + "/");
  const textos: string[] = [];
  if (html) textos.push(html);

  const apiUrls = new Set<string>();
  for (const t of textos) {
    for (const m of t.matchAll(/https:\/\/api\.ola\.click\/[^\s"'<>\\]+/g)) {
      apiUrls.add(m[0].replace(/[),.]+$/, ""));
    }
  }
  // Tenta endpoints de menu/produtos/categorias encontrados.
  for (const api of Array.from(apiUrls).filter((x) =>
    /product|categor|menu|catalog/i.test(x)
  )) {
    const j = await buscar(api);
    if (j) textos.push(j);
  }

  // 2) Coleta produtos de todo JSON/HTML que conseguimos.
  const achados: { raw: Bruto; categoria: string }[] = [];
  for (const t of textos) {
    // tenta como JSON puro
    try {
      coletar(JSON.parse(t), "", achados);
      continue;
    } catch {
      /* não é JSON puro */
    }
    // tenta blocos JSON embutidos no HTML
    for (const m of t.matchAll(/(\{[^{}]*"(?:name|title)"[^{}]*"(?:price|base_price|amount)"[^{}]*\})/g)) {
      try {
        coletar(JSON.parse(m[1]), "", achados);
      } catch {
        /* ignora */
      }
    }
  }

  // Dedup por nome e normaliza.
  const vistos = new Set<string>();
  const produtos = [];
  for (const a of achados) {
    const p = normalizar(a.raw, a.categoria);
    if (!p) continue;
    const chave = p.nome.toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    produtos.push(p);
  }

  return NextResponse.json({
    produtos,
    total: produtos.length,
    diagnostico: {
      htmlRecebido: Boolean(html),
      apiUrls: Array.from(apiUrls).slice(0, 10),
    },
    aviso:
      produtos.length === 0
        ? "Não consegui extrair os produtos automaticamente. Use a importação por planilha (CSV) abaixo."
        : "Confira os preços antes de importar (podem vir em outro formato).",
  });
}
