"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIAS, brl, type Produto, type FaixaAtacado } from "@/lib/catalogo";
import { useConfig, lerConfig, salvarConfig } from "@/lib/config-store";
import {
  useCatalogo,
  salvarProduto,
  lerCfg,
  salvarCfg,
} from "@/lib/catalogo-store";
import type { Variante } from "@/lib/produto-config-store";

type Faixa = { min: string; kg: string };

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

const ICONE_CATEGORIA: Record<string, string> = {
  Queijos: "nutrition",
  Doces: "icecream",
  Mel: "water_drop",
  Charcutaria: "restaurant",
};

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || crypto.randomUUID()
  );
}

export function FormProduto({
  inicial,
  titulo,
  rotuloAcao,
}: {
  inicial?: Produto;
  titulo: string;
  rotuloAcao: string;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [categoria, setCategoria] = useState<string>(
    inicial?.categoria ?? CATEGORIAS[0]
  );
  const [tipo, setTipo] = useState<"peso" | "unidade">(inicial?.tipo ?? "peso");

  // Por peso
  const [precoKg, setPrecoKg] = useState(
    inicial?.tipo === "peso" ? String(inicial.faixas[0]?.kg ?? "") : ""
  );
  const [pesos, setPesos] = useState<number[]>(
    inicial?.tipo === "peso" ? [...inicial.pesos] : [200, 300, 500]
  );
  const [novoPeso, setNovoPeso] = useState("");
  const [faixas, setFaixas] = useState<Faixa[]>(
    inicial?.tipo === "peso"
      ? inicial.faixas.map((f) => ({ min: String(f.min), kg: String(f.kg) }))
      : [{ min: "500", kg: "" }]
  );

  // Por unidade
  const [preco, setPreco] = useState(
    inicial?.tipo === "unidade" ? String(inicial.preco) : ""
  );

  const [fotos, setFotos] = useState<{ url: string; path?: string }[]>(
    inicial?.img ? [{ url: inicial.img }] : []
  );
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [vinculadoId, setVinculadoId] = useState(inicial?.vinculadoId ?? "");
  const [custo, setCusto] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [variantes, setVariantes] = useState<Variante[]>([]);
  // Atacado (fluxo à parte /pedidos-atacado)
  const [atacadoAtivo, setAtacadoAtivo] = useState(false);
  const [atacadoUnidade, setAtacadoUnidade] = useState<"kg" | "peca">("kg");
  const [atacadoMinimo, setAtacadoMinimo] = useState("");
  const [atacadoFaixas, setAtacadoFaixas] = useState<
    { min: string; preco: string }[]
  >([{ min: "", preco: "" }]);
  // Peso médio + forma de venda por canal
  const [pesoMedio, setPesoMedio] = useState("");
  const [pdvPeca, setPdvPeca] = useState(true);
  const [pdvKg, setPdvKg] = useState(false);
  const [delPeca, setDelPeca] = useState(true);
  const [delKg, setDelKg] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const router = useRouter();
  const catalogo = useCatalogo();
  const cfg = useConfig();
  const cats = cfg.categorias?.length ? cfg.categorias : CATEGORIAS;

  function novaCategoria() {
    const nome = window.prompt("Nome da nova categoria:")?.trim();
    if (!nome) return;
    const c = lerConfig();
    if (!c.categorias.includes(nome))
      salvarConfig({ ...c, categorias: [...c.categorias, nome] });
    setCategoria(nome);
  }

  // Carrega vídeo/variantes/atacado salvos deste produto uma vez (não a cada
  // polling, senão resetaria os campos enquanto o lojista edita).
  useEffect(() => {
    if (!inicial?.id) return;
    const c = lerCfg(inicial.id);
    setVideoUrl(c.videoUrl ?? "");
    setVariantes(c.variantes ?? []);
    if (c.atacado) {
      setAtacadoAtivo(c.atacado.ativo);
      setAtacadoUnidade(c.atacado.unidade);
      setAtacadoMinimo(c.atacado.minimo ? String(c.atacado.minimo) : "");
      setAtacadoFaixas(
        c.atacado.faixas.length
          ? c.atacado.faixas.map((f) => ({
              min: String(f.min),
              preco: String(f.preco),
            }))
          : [{ min: "", preco: "" }]
      );
    }
    if (c.fotos && c.fotos.length) setFotos(c.fotos);
    if (c.oculto) setOculto(true);
    if (c.pesoMedioG) setPesoMedio(String(c.pesoMedioG));
    if (c.vendaPdv) {
      setPdvPeca(c.vendaPdv.peca);
      setPdvKg(c.vendaPdv.kg);
    }
    if (c.vendaDelivery) {
      setDelPeca(c.vendaDelivery.peca);
      setDelKg(c.vendaDelivery.kg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial?.id]);

  async function enviarFotos(files: FileList | null) {
    if (!files || !files.length) return;
    setEnviandoFoto(true);
    const novas: { url: string; path?: string }[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await res.json();
        if (j.url) novas.push({ url: j.url, path: j.path });
      } catch {
        // ignora falha de um arquivo
      }
    }
    setFotos((f) => [...f, ...novas]);
    setEnviandoFoto(false);
  }
  function removerFoto(i: number) {
    const f = fotos[i];
    if (f?.path) {
      fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: f.path }),
      }).catch(() => {});
    }
    setFotos(fotos.filter((_, j) => j !== i));
  }
  function moverFoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= fotos.length) return;
    const arr = [...fotos];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setFotos(arr);
  }
  function definirPrincipal(i: number) {
    if (i === 0) return;
    const arr = [...fotos];
    const [f] = arr.splice(i, 1);
    arr.unshift(f);
    setFotos(arr);
  }

  function addPeso() {
    const g = parseInt(novoPeso);
    if (g > 0 && !pesos.includes(g)) setPesos([...pesos, g].sort((a, b) => a - b));
    setNovoPeso("");
  }

  function addVariante() {
    setVariantes([
      ...variantes,
      { id: crypto.randomUUID(), nome: "", descricao: "", fotoUrl: "" },
    ]);
  }
  function updVariante(i: number, patch: Partial<Variante>) {
    setVariantes(variantes.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  }
  function delVariante(i: number) {
    setVariantes(variantes.filter((_, j) => j !== i));
  }

  function acao() {
    const id = inicial?.id ?? slug(nome);
    const base = {
      id,
      nome: nome.trim(),
      produtor: inicial?.produtor,
      categoria,
      icone: inicial?.icone ?? ICONE_CATEGORIA[categoria] ?? "nutrition",
      img: fotos[0]?.url ?? "",
      descricao: descricao.trim() || undefined,
      nota: inicial?.nota,
      origem: inicial?.origem,
      intensidade: inicial?.intensidade,
      novidade: inicial?.novidade,
      vinculadoId: vinculadoId || undefined,
    };

    let produto: Produto;
    if (tipo === "peso") {
      const pesosOrd = [...pesos].sort((a, b) => a - b);
      const minPeso = pesosOrd[0] ?? 200;
      const kgBase = num(precoKg);
      const extras = faixas
        .map((f) => ({ min: parseInt(f.min) || 0, kg: num(f.kg) }))
        .filter((f) => f.kg > 0 && f.min > minPeso)
        .sort((a, b) => a.min - b.min);
      const faixasFinal = [
        { min: minPeso, kg: kgBase > 0 ? kgBase : extras[0]?.kg ?? 0 },
        ...extras,
      ];
      produto = { ...base, tipo: "peso", pesos: pesosOrd, faixas: faixasFinal };
    } else {
      produto = {
        ...base,
        tipo: "unidade",
        preco: num(preco),
        precoAntigo:
          inicial?.tipo === "unidade" ? inicial.precoAntigo : undefined,
      };
    }

    // Salva o produto e a config (vídeo/variantes) no Supabase — reflete no
    // delivery e no PDV em qualquer aparelho.
    const faixasAtacado: FaixaAtacado[] = atacadoFaixas
      .map((f) => ({ min: num(f.min), preco: num(f.preco) }))
      .filter((f) => f.min > 0 && f.preco > 0)
      .sort((a, b) => a.min - b.min);

    salvarProduto(produto);
    salvarCfg(id, {
      videoUrl: videoUrl.trim() || undefined,
      fotos: fotos.length ? fotos : undefined,
      oculto: oculto || undefined,
      pesoMedioG: num(pesoMedio) || undefined,
      vendaPdv: { peca: pdvPeca, kg: pdvKg },
      vendaDelivery: { peca: delPeca, kg: delKg },
      variantes: variantes
        .map((v) => ({ ...v, nome: v.nome.trim() }))
        .filter((v) => v.nome),
      atacado:
        atacadoAtivo && faixasAtacado.length
          ? {
              ativo: true,
              unidade: atacadoUnidade,
              minimo: num(atacadoMinimo) || undefined,
              faixas: faixasAtacado,
            }
          : undefined,
    });
    setSalvo(true);
    setTimeout(() => router.push("/admin/produtos"), 700);
  }

  const previewPreco =
    tipo === "peso" && precoKg && pesos.length
      ? (Number(precoKg) * Math.min(...pesos)) / 1000
      : tipo === "unidade" && preco
        ? Number(preco)
        : 0;

  // Margem (só pra consulta do lojista): compara custo com o preço de venda.
  const precoRef =
    tipo === "peso"
      ? Number(precoKg.replace(",", "."))
      : Number(preco.replace(",", "."));
  const custoNum = Number(custo.replace(",", "."));
  const margem =
    precoRef > 0 && custoNum > 0
      ? Math.round((1 - custoNum / precoRef) * 100)
      : null;

  return (
    <div className="mx-auto max-w-[48rem] space-y-lg">
      <div className="flex items-center gap-sm">
        <Link
          href="/admin/produtos"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">{titulo}</h1>
      </div>

      {/* Básico */}
      <Secao titulo="Informações básicas">
        <div>
          <label className="block text-label-md text-on-surface">Fotos</label>
          <p className="mb-sm text-label-sm text-on-surface-variant">
            Envie uma ou várias fotos do computador/celular. A 1ª é a principal
            (usada nos cards). Toque numa foto para torná-la principal.
          </p>
          <div className="flex flex-wrap gap-sm">
            {fotos.map((f, i) => (
              <div
                key={f.url}
                className={`group relative h-24 w-24 overflow-hidden rounded-lg border-2 ${
                  i === 0 ? "border-primary" : "border-outline-variant/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={`Foto ${i + 1}`}
                  onClick={() => definirPrincipal(i)}
                  className="h-full w-full cursor-pointer object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-0 top-0 bg-primary px-1 text-[9px] font-bold text-on-primary">
                    PRINCIPAL
                  </span>
                )}
                <div className="absolute bottom-0 right-0 flex bg-black/50">
                  <button
                    type="button"
                    onClick={() => moverFoto(i, -1)}
                    className="material-symbols-outlined text-[16px] text-white"
                    title="Mover p/ esquerda"
                  >
                    chevron_left
                  </button>
                  <button
                    type="button"
                    onClick={() => moverFoto(i, 1)}
                    className="material-symbols-outlined text-[16px] text-white"
                    title="Mover p/ direita"
                  >
                    chevron_right
                  </button>
                  <button
                    type="button"
                    onClick={() => removerFoto(i)}
                    className="material-symbols-outlined text-[16px] text-white"
                    title="Excluir"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline/40 bg-surface-container-low text-on-surface-variant hover:border-primary/40">
              <span className="material-symbols-outlined text-[28px]">
                {enviandoFoto ? "hourglass_top" : "add_photo_alternate"}
              </span>
              <span className="text-label-sm">
                {enviandoFoto ? "Enviando..." : "Adicionar"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => enviarFotos(e.target.files)}
                className="hidden"
                disabled={enviandoFoto}
              />
            </label>
          </div>
        </div>
        <Campo rotulo="Nome do produto">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Queijo Canastra Meia Cura"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </Campo>
        <div className="grid gap-md sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-label-md text-on-surface">Categoria</label>
              <button
                type="button"
                onClick={novaCategoria}
                className="text-label-sm text-secondary"
              >
                + Nova categoria
              </button>
            </div>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            >
              {[...new Set([...cats, categoria].filter(Boolean))].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label-md text-on-surface">
              Como é vendido
            </label>
            <div className="mt-1 flex rounded-lg border border-outline-variant p-1">
              <BotaoTipo ativo={tipo === "peso"} onClick={() => setTipo("peso")} icone="scale" label="Por peso" />
              <BotaoTipo ativo={tipo === "unidade"} onClick={() => setTipo("unidade")} icone="package_2" label="Por unidade" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-label-md text-on-surface">
            Código de barras
          </label>
          <div className="mt-1 flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
            <span className="material-symbols-outlined text-on-surface-variant">
              barcode_scanner
            </span>
            <input
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              placeholder="Bipe o produto ou digite o código"
              className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            Usado pra bipar no PDV e dar baixa no estoque.
          </p>
        </div>
        <label className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5">
          <input
            type="checkbox"
            checked={oculto}
            onChange={(e) => setOculto(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          <span className="text-body-md text-on-surface">
            Ocultar do catálogo do cliente (não aparece na loja nem no atacado)
          </span>
        </label>
      </Secao>

      {tipo === "peso" ? (
        <Secao titulo="Preço por peso">
          <Campo rotulo="Preço por quilo" prefixo="R$" sufixo="/kg">
            <input
              value={precoKg}
              onChange={(e) => setPrecoKg(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-full bg-transparent text-body-lg outline-none"
            />
          </Campo>
          <Campo rotulo="Custo por quilo (quanto você pagou — só pra você)" prefixo="R$" sufixo="/kg">
            <input
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-full bg-transparent text-body-lg outline-none"
            />
          </Campo>
          {margem !== null && <MargemLinha margem={margem} />}

          <div>
            <label className="block text-label-md text-on-surface">
              Pesos oferecidos ao cliente
            </label>
            <p className="mb-sm text-label-sm text-on-surface-variant">
              O cliente toca um destes — não digita peso livre.
            </p>
            <div className="flex flex-wrap items-center gap-sm">
              {pesos.map((g) => (
                <span
                  key={g}
                  className="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-label-md text-primary"
                >
                  {g >= 1000 ? `${g / 1000}kg` : `${g}g`}
                  <button
                    onClick={() => setPesos(pesos.filter((x) => x !== g))}
                    className="material-symbols-outlined text-[16px] text-primary/60 hover:text-danger-red"
                  >
                    close
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 rounded-full border border-dashed border-outline/40 px-2 py-1">
                <input
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPeso()}
                  inputMode="numeric"
                  placeholder="ex: 400"
                  className="w-16 bg-transparent text-label-md outline-none placeholder:text-on-surface-variant/50"
                />
                <button onClick={addPeso} className="material-symbols-outlined text-[18px] text-primary">
                  add_circle
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-label-md text-on-surface">
              Desconto por volume (opcional)
            </label>
            <p className="mb-sm text-label-sm text-on-surface-variant">
              Preço/kg menor a partir de certo peso — sobe o ticket.
            </p>
            <div className="space-y-sm">
              {faixas.map((f, i) => (
                <div key={i} className="flex items-center gap-sm">
                  <span className="text-body-md text-on-surface-variant">a partir de</span>
                  <div className="flex w-28 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                    <input
                      value={f.min}
                      onChange={(e) => setFaixas(faixas.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)))}
                      inputMode="numeric"
                      className="w-full bg-transparent text-body-md outline-none"
                    />
                    <span className="text-label-sm text-on-surface-variant">g</span>
                  </div>
                  <span className="material-symbols-outlined text-outline">arrow_forward</span>
                  <div className="flex w-32 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                    <span className="text-label-sm text-on-surface-variant">R$</span>
                    <input
                      value={f.kg}
                      onChange={(e) => setFaixas(faixas.map((x, j) => (j === i ? { ...x, kg: e.target.value } : x)))}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="w-full bg-transparent text-body-md outline-none"
                    />
                    <span className="text-label-sm text-on-surface-variant">/kg</span>
                  </div>
                  <button onClick={() => setFaixas(faixas.filter((_, j) => j !== i))} className="material-symbols-outlined text-danger-red">
                    delete
                  </button>
                </div>
              ))}
              <button
                onClick={() => setFaixas([...faixas, { min: "", kg: "" }])}
                className="flex items-center gap-1 text-label-md text-secondary"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Adicionar faixa
              </button>
            </div>
          </div>
        </Secao>
      ) : (
        <Secao titulo="Preço por unidade">
          <Campo rotulo="Preço" prefixo="R$" sufixo="/un">
            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-full bg-transparent text-body-lg outline-none"
            />
          </Campo>
          <Campo rotulo="Custo por unidade (quanto você pagou — só pra você)" prefixo="R$" sufixo="/un">
            <input
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="w-full bg-transparent text-body-lg outline-none"
            />
          </Campo>
          {margem !== null && <MargemLinha margem={margem} />}
        </Secao>
      )}

      <Secao titulo="Descrição">
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Sobre o produto, origem, sugestão de consumo..."
          className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md outline-none focus:border-primary"
        />
      </Secao>

      <Secao titulo="Sugerir junto (Vai bem com)">
        <p className="text-label-sm text-on-surface-variant">
          Quando o cliente adiciona este produto, sugerimos o escolhido abaixo no
          carrinho — pra subir o ticket com combinações que fazem sentido.
        </p>
        <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
          <span className="material-symbols-outlined text-on-surface-variant">
            recommend
          </span>
          <select
            value={vinculadoId}
            onChange={(e) => setVinculadoId(e.target.value)}
            className="w-full bg-transparent text-body-lg outline-none"
          >
            <option value="">Nenhum</option>
            {catalogo
              .filter((p) => p.id !== inicial?.id)
              .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </Secao>

      {/* Mídia — vídeo do produto */}
      <Secao titulo="Mídia (vídeo do produto)">
        <p className="text-label-sm text-on-surface-variant">
          Cole a URL de um vídeo (.mp4). O cliente vê um botão de play na foto do
          produto. Upload de arquivo entra com o Supabase.
        </p>
        <Campo rotulo="Vídeo (URL .mp4)">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://.../video.mp4"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </Campo>
      </Secao>

      {/* Variantes */}
      <Secao titulo="Variantes (ex.: kit, tamanho, sabor)">
        <p className="text-label-sm text-on-surface-variant">
          Cada variante pode ter nome, descrição e foto próprios
          {tipo === "unidade" ? " e preço." : " (o preço segue o peso)."}
        </p>
        <div className="space-y-md">
          {variantes.map((v, i) => (
            <div
              key={v.id}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-md"
            >
              <div className="flex items-center gap-sm">
                <input
                  value={v.nome}
                  onChange={(e) => updVariante(i, { nome: e.target.value })}
                  placeholder="Nome da variante (ex.: Kit 3 peças)"
                  className="w-full flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-lg outline-none focus:border-primary"
                />
                {tipo === "unidade" && (
                  <div className="flex w-28 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                    <span className="text-label-sm text-on-surface-variant">R$</span>
                    <input
                      value={v.preco != null ? String(v.preco) : ""}
                      onChange={(e) =>
                        updVariante(i, {
                          preco: Number(e.target.value.replace(",", ".")) || undefined,
                        })
                      }
                      inputMode="decimal"
                      placeholder="preço"
                      className="w-full bg-transparent text-body-md outline-none"
                    />
                  </div>
                )}
                <button
                  onClick={() => delVariante(i)}
                  className="material-symbols-outlined text-danger-red"
                  title="Excluir variante"
                >
                  delete
                </button>
              </div>
              <input
                value={v.descricao ?? ""}
                onChange={(e) => updVariante(i, { descricao: e.target.value })}
                placeholder="Descrição da variante (opcional)"
                className="mt-sm w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
              />
              <input
                value={v.fotoUrl ?? ""}
                onChange={(e) => updVariante(i, { fotoUrl: e.target.value })}
                placeholder="Foto da variante (URL) — opcional"
                className="mt-sm w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
              />
            </div>
          ))}
          <button
            onClick={addVariante}
            className="flex items-center gap-1 text-label-md text-secondary"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar variante
          </button>
        </div>
      </Secao>

      {/* Peso médio + venda por canal */}
      <Secao titulo="Peso médio e forma de venda por canal">
        <Campo rotulo="Peso médio por unidade" sufixo="g">
          <input
            value={pesoMedio}
            onChange={(e) => setPesoMedio(e.target.value)}
            inputMode="numeric"
            placeholder="ex: 500"
            className="w-full bg-transparent text-body-lg outline-none"
          />
        </Campo>
        <p className="text-label-sm text-on-surface-variant">
          Referência para vender por peça um produto pesado por kg (ex.: 1 peça ≈
          500 g). É uma média — não obriga todas as peças a terem esse peso.
        </p>

        <div className="grid gap-md sm:grid-cols-2">
          <FormaCanal
            titulo="No PDV (balcão)"
            peca={pdvPeca}
            kg={pdvKg}
            setPeca={setPdvPeca}
            setKg={setPdvKg}
          />
          <FormaCanal
            titulo="No Delivery"
            peca={delPeca}
            kg={delKg}
            setPeca={setDelPeca}
            setKg={setDelKg}
          />
        </div>
        <p className="text-label-sm text-on-surface-variant">
          Cada canal vende de forma independente. O atacado tem a própria
          configuração abaixo.
        </p>
      </Secao>

      {/* Atacado */}
      <Secao titulo="Atacado (venda por volume)">
        <p className="text-label-sm text-on-surface-variant">
          Ative para o produto aparecer no catálogo de atacado
          (/pedidos-atacado). Preço por volume: quanto maior a quantidade, menor
          o preço por {atacadoUnidade === "kg" ? "quilo" : "peça"}.
        </p>
        <label className="flex items-center gap-sm">
          <input
            type="checkbox"
            checked={atacadoAtivo}
            onChange={(e) => setAtacadoAtivo(e.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          <span className="text-body-lg text-on-surface">
            Vender este produto no atacado
          </span>
        </label>

        {atacadoAtivo && (
          <div className="space-y-md">
            <div className="grid gap-md sm:grid-cols-2">
              <div>
                <label className="block text-label-md text-on-surface">
                  Vendido por
                </label>
                <div className="mt-1 flex rounded-lg border border-outline-variant p-1">
                  <BotaoTipo
                    ativo={atacadoUnidade === "kg"}
                    onClick={() => setAtacadoUnidade("kg")}
                    icone="scale"
                    label="Quilo"
                  />
                  <BotaoTipo
                    ativo={atacadoUnidade === "peca"}
                    onClick={() => setAtacadoUnidade("peca")}
                    icone="package_2"
                    label="Peça"
                  />
                </div>
              </div>
              <Campo
                rotulo={`Pedido mínimo (${atacadoUnidade === "kg" ? "kg" : "peças"}) — opcional`}
              >
                <input
                  value={atacadoMinimo}
                  onChange={(e) => setAtacadoMinimo(e.target.value)}
                  inputMode="decimal"
                  placeholder="ex: 10"
                  className="w-full bg-transparent text-body-lg outline-none"
                />
              </Campo>
            </div>

            <div>
              <label className="block text-label-md text-on-surface">
                Faixas de preço por volume
              </label>
              <p className="mb-sm text-label-sm text-on-surface-variant">
                Ex.: a partir de 10 {atacadoUnidade === "kg" ? "kg" : "peças"} →
                R$ X {atacadoUnidade === "kg" ? "o kg" : "a peça"}.
              </p>
              <div className="space-y-sm">
                {atacadoFaixas.map((f, i) => (
                  <div key={i} className="flex items-center gap-sm">
                    <span className="text-body-md text-on-surface-variant">
                      a partir de
                    </span>
                    <div className="flex w-28 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                      <input
                        value={f.min}
                        onChange={(e) =>
                          setAtacadoFaixas(
                            atacadoFaixas.map((x, j) =>
                              j === i ? { ...x, min: e.target.value } : x
                            )
                          )
                        }
                        inputMode="decimal"
                        className="w-full bg-transparent text-body-md outline-none"
                      />
                      <span className="text-label-sm text-on-surface-variant">
                        {atacadoUnidade === "kg" ? "kg" : "pç"}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-outline">
                      arrow_forward
                    </span>
                    <div className="flex w-32 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                      <span className="text-label-sm text-on-surface-variant">R$</span>
                      <input
                        value={f.preco}
                        onChange={(e) =>
                          setAtacadoFaixas(
                            atacadoFaixas.map((x, j) =>
                              j === i ? { ...x, preco: e.target.value } : x
                            )
                          )
                        }
                        inputMode="decimal"
                        placeholder="0,00"
                        className="w-full bg-transparent text-body-md outline-none"
                      />
                      <span className="text-label-sm text-on-surface-variant">
                        /{atacadoUnidade === "kg" ? "kg" : "pç"}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setAtacadoFaixas(atacadoFaixas.filter((_, j) => j !== i))
                      }
                      className="material-symbols-outlined text-danger-red"
                    >
                      delete
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setAtacadoFaixas([...atacadoFaixas, { min: "", preco: "" }])
                  }
                  className="flex items-center gap-1 text-label-md text-secondary"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Adicionar faixa
                </button>
              </div>
            </div>
          </div>
        )}
      </Secao>

      <div className="flex flex-wrap items-center justify-between gap-md rounded-xl bg-cream-surface p-md">
        <div>
          <span className="text-label-sm text-on-surface-variant">
            {tipo === "peso" ? "Preço a partir de" : "Preço"}
          </span>
          <p className="font-display text-headline-lg text-primary">
            {previewPreco > 0 ? brl(previewPreco) : "R$ —"}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {salvo && (
            <span className="flex items-center gap-1 text-label-md text-tertiary">
              <span className="material-symbols-outlined">check_circle</span>
              Salvo!
            </span>
          )}
          <button
            onClick={acao}
            disabled={!nome}
            className="rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
          >
            {rotuloAcao}
          </button>
        </div>
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <h2 className="mb-md font-headline-md text-headline-md text-on-surface">{titulo}</h2>
      <div className="space-y-md">{children}</div>
    </section>
  );
}

function Campo({
  rotulo,
  prefixo,
  sufixo,
  children,
}: {
  rotulo: string;
  prefixo?: string;
  sufixo?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-label-md text-on-surface">{rotulo}</label>
      <div className="mt-1 flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
        {prefixo && <span className="text-body-md text-on-surface-variant">{prefixo}</span>}
        {children}
        {sufixo && <span className="text-body-md text-on-surface-variant">{sufixo}</span>}
      </div>
    </div>
  );
}

function BotaoTipo({
  ativo,
  onClick,
  icone,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-md py-2 text-label-md transition-colors ${
        ativo ? "bg-primary text-on-primary" : "text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">{icone}</span>
      {label}
    </button>
  );
}

function FormaCanal({
  titulo,
  peca,
  kg,
  setPeca,
  setKg,
}: {
  titulo: string;
  peca: boolean;
  kg: boolean;
  setPeca: (v: boolean) => void;
  setKg: (v: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-md">
      <p className="mb-sm text-label-md text-on-surface">{titulo}</p>
      <label className="flex items-center gap-sm py-1">
        <input
          type="checkbox"
          checked={peca}
          onChange={(e) => setPeca(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
        <span className="text-body-md text-on-surface">Por peça</span>
      </label>
      <label className="flex items-center gap-sm py-1">
        <input
          type="checkbox"
          checked={kg}
          onChange={(e) => setKg(e.target.checked)}
          className="h-5 w-5 accent-primary"
        />
        <span className="text-body-md text-on-surface">Por quilo</span>
      </label>
    </div>
  );
}

function MargemLinha({ margem }: { margem: number }) {
  const cor =
    margem >= 40
      ? "text-tertiary"
      : margem >= 20
        ? "text-secondary"
        : "text-danger-red";
  return (
    <div className="flex items-center justify-between rounded-lg bg-cream-surface px-md py-2.5">
      <span className="flex items-center gap-1 text-body-md text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">
          percent
        </span>
        Margem (venda vs. custo)
      </span>
      <span className={`font-headline-md text-headline-md ${cor}`}>{margem}%</span>
    </div>
  );
}
