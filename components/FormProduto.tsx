"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, brl, type Produto, type FaixaAtacado } from "@/lib/catalogo";
import { useConfig, lerConfig, salvarConfig } from "@/lib/config-store";
import { perguntar } from "@/components/Dialogo";
import {
  useCatalogo,
  salvarProdutoComCfg,
  lerCfg,
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
  const [esgotado, setEsgotado] = useState(inicial?.esgotado ?? false);
  const [novidade, setNovidade] = useState(inicial?.novidade ?? false);
  const [previewModo, setPreviewModo] = useState<"vitrine" | "pagina">(
    "vitrine"
  );
  // A prévia troca sozinha conforme o scroll passa da parte "vitrine" (nome,
  // categoria, preço) para a parte "página" (descrição, ficha, etc.).
  const sentinelaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      const el = sentinelaRef.current;
      if (!el) return;
      setPreviewModo(
        el.getBoundingClientRect().top < 180 ? "pagina" : "vitrine"
      );
    };
    window.addEventListener("scroll", onScroll, true);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);
  const [harmonizacao, setHarmonizacao] = useState("");
  const [adicionais, setAdicionais] = useState<
    { id: string; nome: string; preco: string }[]
  >([]);
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  // Ficha do produto
  const [produtor, setProdutor] = useState(inicial?.produtor ?? "");
  const [origem, setOrigem] = useState(inicial?.origem ?? "");
  const [fabricacao, setFabricacao] = useState("");
  const [ingredientes, setIngredientes] = useState("");
  const [vinculadoId, setVinculadoId] = useState(inicial?.vinculadoId ?? "");
  const [custo, setCusto] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [variantes, setVariantes] = useState<Variante[]>([]);
  // Atacado (fluxo à parte /pedidos-atacado)
  const [atacadoAtivo, setAtacadoAtivo] = useState(false);
  const [atacadoUnidade, setAtacadoUnidade] = useState<"kg" | "peca">("kg");
  const [atacadoFixo, setAtacadoFixo] = useState("");
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

  async function novaCategoria() {
    const nome = (
      await perguntar({
        titulo: "Nova categoria",
        mensagem: "Como quer chamar a nova categoria?",
        placeholder: "ex.: Embutidos, Bebidas...",
        okLabel: "Criar",
      })
    )?.trim();
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
      setAtacadoFixo(c.atacado.precoFixo ? String(c.atacado.precoFixo) : "");
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
    if (c.harmonizacao) setHarmonizacao(c.harmonizacao);
    if (c.ficha?.fabricacao) setFabricacao(c.ficha.fabricacao);
    if (c.ficha?.ingredientes) setIngredientes(c.ficha.ingredientes);
    if (c.adicionais?.length)
      setAdicionais(
        c.adicionais.map((a) => ({ id: a.id, nome: a.nome, preco: String(a.preco) }))
      );
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
      produtor: produtor.trim() || undefined,
      categoria,
      icone: inicial?.icone ?? ICONE_CATEGORIA[categoria] ?? "nutrition",
      img: fotos[0]?.url ?? "",
      descricao: descricao.trim() || undefined,
      nota: inicial?.nota,
      origem: origem.trim() || undefined,
      intensidade: inicial?.intensidade,
      novidade: novidade || undefined,
      esgotado: esgotado || undefined,
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

    salvarProdutoComCfg(produto, {
      videoUrl: videoUrl.trim() || undefined,
      fotos: fotos.length ? fotos : undefined,
      oculto: oculto || undefined,
      harmonizacao: harmonizacao.trim() || undefined,
      ficha:
        fabricacao.trim() || ingredientes.trim()
          ? {
              fabricacao: fabricacao.trim() || undefined,
              ingredientes: ingredientes.trim() || undefined,
            }
          : undefined,
      adicionais: adicionais
        .map((a) => ({ id: a.id, nome: a.nome.trim(), preco: num(a.preco) }))
        .filter((a) => a.nome && a.preco >= 0),
      pesoMedioG: num(pesoMedio) || undefined,
      vendaPdv: { peca: pdvPeca, kg: pdvKg },
      vendaDelivery: { peca: delPeca, kg: delKg },
      variantes: variantes
        .map((v) => ({ ...v, nome: v.nome.trim() }))
        .filter((v) => v.nome),
      // Salva sempre que o toggle estiver ligado (mesmo sem preço ainda), para o
      // estado do "Vender no atacado" persistir. O produto só aparece no catálogo
      // de atacado quando tiver preço fixo ou faixas (temPrecoAtacado).
      atacado: atacadoAtivo
        ? {
            ativo: true,
            unidade: atacadoUnidade,
            minimo: num(atacadoMinimo) || undefined,
            precoFixo: num(atacadoFixo) || undefined,
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

  // --- Prévia ao vivo (como o produto aparece na loja enquanto é editado) ---
  const icone = inicial?.icone ?? ICONE_CATEGORIA[categoria] ?? "nutrition";
  const fotoPrincipal = fotos[0]?.url;
  const temVideo = videoUrl.trim().length > 0;
  const adicsPreview = adicionais
    .filter((a) => a.nome.trim())
    .map((a) => ({ nome: a.nome.trim(), preco: num(a.preco) }));
  const precoKgNum = num(precoKg);
  const cfgTemFicha = fabricacao.trim() || ingredientes.trim();

  // Foto/badges/vídeo — compartilhado pela vitrine e pela página.
  function Imagem({ grande }: { grande?: boolean }) {
    return (
      <div className="relative">
        {fotoPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoPrincipal}
            alt=""
            className={`aspect-square w-full object-cover ${esgotado ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-secondary-container to-primary-container/20">
            <span
              className={`material-symbols-outlined text-primary/40 ${grande ? "text-[72px]" : "text-[48px]"}`}
            >
              {icone}
            </span>
          </div>
        )}
        <div className="absolute left-1.5 top-1.5 flex flex-col items-start gap-1">
          {esgotado && (
            <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-semibold text-on-error-container shadow-sm">
              Esgotado
            </span>
          )}
          {novidade && !esgotado && (
            <span className="rounded-full bg-tertiary px-2 py-0.5 text-[10px] font-semibold text-on-tertiary shadow-sm">
              Novidade
            </span>
          )}
        </div>
        {temVideo && (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
            <span className="material-symbols-outlined text-[16px]">
              play_arrow
            </span>
          </span>
        )}
      </div>
    );
  }

  function Previa() {
    return (
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-md">
        <div className="mb-sm flex items-center gap-1 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-secondary">
            visibility
          </span>
          Prévia na loja
        </div>

        {/* Alterna entre a vitrine (card) e a página do produto */}
        <div className="mb-sm flex rounded-lg border border-outline-variant p-0.5">
          <button
            type="button"
            onClick={() => setPreviewModo("vitrine")}
            className={`flex-1 rounded-md py-1 text-label-sm transition-colors ${
              previewModo === "vitrine"
                ? "bg-primary text-on-primary"
                : "text-on-surface"
            }`}
          >
            Vitrine
          </button>
          <button
            type="button"
            onClick={() => setPreviewModo("pagina")}
            className={`flex-1 rounded-md py-1 text-label-sm transition-colors ${
              previewModo === "pagina"
                ? "bg-primary text-on-primary"
                : "text-on-surface"
            }`}
          >
            Página do produto
          </button>
        </div>

        {/* iPhone */}
        <style>{`
          @keyframes previaFade {
            from { opacity: 0; transform: translateY(10px) scale(0.985); }
            to { opacity: 1; transform: none; }
          }
          .previa-fade { animation: previaFade .3s ease; }
        `}</style>
        <div className="relative mx-auto w-full max-w-[20rem]">
          <div className="relative rounded-[2.6rem] border-[11px] border-neutral-900 bg-neutral-900 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
            {/* Ilha dinâmica */}
            <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />

            {/* Tela */}
            <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[1.9rem] bg-surface">
              {/* Barra de status */}
              <div className="flex items-center justify-between px-5 pb-1 pt-2 text-[10px] font-semibold text-on-surface">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">
                    signal_cellular_alt
                  </span>
                  <span className="material-symbols-outlined text-[13px]">
                    wifi
                  </span>
                  <span className="material-symbols-outlined text-[13px]">
                    battery_full
                  </span>
                </span>
              </div>

              {/* Cabeçalho do app */}
              <div className="flex items-center gap-1 border-b border-outline-variant/20 px-3 py-1.5">
                {previewModo === "pagina" && (
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    arrow_back
                  </span>
                )}
                <span className="font-display text-label-md text-primary">
                  Armazém do Queijo
                </span>
              </div>

              {/* Conteúdo rolável — anima ao trocar de modo (como se clicasse) */}
              <div
                key={previewModo}
                className="previa-fade h-[calc(100%-3.6rem)] overflow-y-auto"
              >
          {previewModo === "vitrine" ? (
            // -------- Vitrine (mini-loja) --------
            <div className="p-2">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-on-surface">
                {categoria}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <Imagem />
                  <div className="p-1.5">
                    <h4 className="line-clamp-1 text-[11px] font-medium text-on-surface">
                      {nome || "Nome do produto"}
                    </h4>
                    <span className="block truncate text-[9px] text-on-surface-variant">
                      {produtor.trim() || categoria}
                    </span>
                    {tipo === "peso" && (
                      <span className="block text-[9px] text-on-surface-variant">
                        a partir de
                      </span>
                    )}
                    <span className="font-headline-md text-label-md text-primary">
                      {previewPreco > 0 ? brl(previewPreco) : "R$ —"}
                    </span>
                  </div>
                </div>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-lowest opacity-50"
                  >
                    <div className="aspect-square w-full bg-gradient-to-br from-secondary-container/40 to-primary-container/10" />
                    <div className="space-y-1 p-1.5">
                      <div className="h-2 w-4/5 rounded bg-outline-variant/30" />
                      <div className="h-2 w-2/5 rounded bg-outline-variant/30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // -------- Página do produto --------
            <div className="bg-surface">
              <Imagem grande />
              <div className="p-sm">
                <h3 className="font-headline-md text-headline-md leading-tight text-on-surface">
                  {nome || "Nome do produto"}
                </h3>
                <p className="text-caption text-on-surface-variant">
                  {categoria}
                  {produtor.trim() ? ` · ${produtor.trim()}` : ""}
                </p>

                <p className="mt-sm font-headline-md text-headline-md text-primary">
                  {tipo === "peso"
                    ? precoKgNum > 0
                      ? `${brl(precoKgNum)}`
                      : "R$ —"
                    : previewPreco > 0
                      ? brl(previewPreco)
                      : "R$ —"}
                  <span className="ml-1 text-caption font-normal text-on-surface-variant">
                    {tipo === "peso" ? "/kg" : "/un"}
                  </span>
                </p>

                {harmonizacao.trim() && (
                  <div className="mt-sm flex items-start gap-1 rounded-lg border border-secondary/30 bg-cream-surface px-2 py-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      wine_bar
                    </span>
                    <p className="text-caption text-on-surface">
                      {harmonizacao.trim()}
                    </p>
                  </div>
                )}

                {adicsPreview.length > 0 && (
                  <div className="mt-sm">
                    <p className="text-label-sm font-semibold text-on-surface">
                      Adicionais
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {adicsPreview.map((a, i) => (
                        <li
                          key={i}
                          className="flex justify-between text-caption text-on-surface-variant"
                        >
                          <span>+ {a.nome}</span>
                          <span className="text-tertiary">
                            {a.preco > 0 ? brl(a.preco) : "grátis"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {descricao.trim() && (
                  <div className="mt-sm">
                    <p className="text-label-sm font-semibold text-primary">
                      Sobre este produto
                    </p>
                    <p className="mt-0.5 text-caption leading-relaxed text-on-surface-variant">
                      {descricao.trim()}
                    </p>
                  </div>
                )}

                {cfgTemFicha && (
                  <div className="mt-sm space-y-1">
                    {fabricacao.trim() && (
                      <div className="rounded-lg border border-outline-variant/20 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          Como é feito
                        </p>
                        <p className="text-caption text-on-surface">
                          {fabricacao.trim()}
                        </p>
                      </div>
                    )}
                    {ingredientes.trim() && (
                      <div className="rounded-lg border border-outline-variant/20 px-2 py-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          Ingredientes e conservação
                        </p>
                        <p className="text-caption text-on-surface">
                          {ingredientes.trim()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Barra "Adicionar" (faux) */}
                <div className="mt-sm flex items-center justify-between rounded-lg bg-primary px-3 py-2 text-on-primary">
                  {esgotado ? (
                    <span className="mx-auto flex items-center gap-1 text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-[16px]">
                        block
                      </span>
                      Esgotado
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 text-label-sm font-semibold">
                        <span className="material-symbols-outlined text-[16px]">
                          add_shopping_cart
                        </span>
                        Adicionar
                      </span>
                      <span className="text-label-md font-semibold">
                        {previewPreco > 0 ? brl(previewPreco) : "R$ —"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
              </div>
            </div>
          </div>
        </div>

        {oculto && (
          <p className="mt-sm flex items-center gap-1 text-label-sm text-danger-red">
            <span className="material-symbols-outlined text-[16px]">
              visibility_off
            </span>
            Oculto — não aparece para o cliente.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[80rem] space-y-lg">
      <div className="flex items-center gap-sm">
        <Link
          href="/admin/produtos"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">{titulo}</h1>
      </div>

      <div className="grid gap-lg xl:grid-cols-[1fr_24rem] xl:items-start">
        {/* Coluna do formulário */}
        <div className="min-w-0 space-y-lg">
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
            checked={esgotado}
            onChange={(e) => setEsgotado(e.target.checked)}
            className="h-5 w-5 accent-danger-red"
          />
          <span className="text-body-md text-on-surface">
            Marcar como <strong>Esgotado</strong> (mostra a tag na loja e bloqueia
            a compra; continua visível no catálogo)
          </span>
        </label>
        <label className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5">
          <input
            type="checkbox"
            checked={novidade}
            onChange={(e) => setNovidade(e.target.checked)}
            className="h-5 w-5 accent-tertiary"
          />
          <span className="text-body-md text-on-surface">
            Marcar como <strong>Novidade</strong> (destaca com a tag na loja)
          </span>
        </label>
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

      {/* A partir daqui a prévia "abre" a página do produto (como se clicasse) */}
      <div ref={sentinelaRef} aria-hidden className="h-0" />

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

      {/* Adicionais + harmonização */}
      <Secao titulo="Adicionais e harmonização">
        <Campo rotulo="Harmoniza com (aparece na página do produto)">
          <input
            value={harmonizacao}
            onChange={(e) => setHarmonizacao(e.target.value)}
            placeholder="Ex.: vinho tinto encorpado, geleia de pimenta, mel"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </Campo>

        <div>
          <label className="block text-label-md text-on-surface">
            Adicionais (complementos opcionais)
          </label>
          <p className="mb-sm text-label-sm text-on-surface-variant">
            O cliente marca no checkout e soma ao total. Ex.: Geleia (+R$ 8).
          </p>
          <div className="space-y-sm">
            {adicionais.map((a, i) => (
              <div key={a.id} className="flex items-center gap-sm">
                <input
                  value={a.nome}
                  onChange={(e) =>
                    setAdicionais(
                      adicionais.map((x, j) =>
                        j === i ? { ...x, nome: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Nome (ex.: Geleia de amora)"
                  className="w-full flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
                />
                <div className="flex w-28 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                  <span className="text-label-sm text-on-surface-variant">R$</span>
                  <input
                    value={a.preco}
                    onChange={(e) =>
                      setAdicionais(
                        adicionais.map((x, j) =>
                          j === i ? { ...x, preco: e.target.value } : x
                        )
                      )
                    }
                    inputMode="decimal"
                    placeholder="0,00"
                    className="w-full bg-transparent text-body-md outline-none"
                  />
                </div>
                <button
                  onClick={() => setAdicionais(adicionais.filter((_, j) => j !== i))}
                  className="material-symbols-outlined text-danger-red"
                  title="Remover"
                >
                  delete
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setAdicionais([
                  ...adicionais,
                  { id: crypto.randomUUID(), nome: "", preco: "" },
                ])
              }
              className="flex items-center gap-1 text-label-md text-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Adicionar complemento
            </button>
          </div>
        </div>
      </Secao>

      {/* Ficha do produto — aparece na página de detalhe pro cliente */}
      <Secao titulo="Ficha do produto">
        <p className="text-label-sm text-on-surface-variant">
          Informações que ajudam o cliente a escolher. Aparecem na página do
          produto. Deixe em branco o que não quiser mostrar.
        </p>
        <Campo rotulo="Produtor / marca">
          <input
            value={produtor}
            onChange={(e) => setProdutor(e.target.value)}
            placeholder="Ex: Fazenda da Roça"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </Campo>
        <Campo rotulo="Origem">
          <input
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            placeholder="Ex: Serra da Canastra — MG"
            className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
          />
        </Campo>
        <div>
          <label className="block text-label-md text-on-surface">
            Modo de fabricação / cura
          </label>
          <textarea
            value={fabricacao}
            onChange={(e) => setFabricacao(e.target.value)}
            rows={3}
            placeholder="Ex: Queijo artesanal de leite cru, maturado por 60 dias em tábua de madeira."
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-label-md text-on-surface">
            Ingredientes / validade / conservação
          </label>
          <textarea
            value={ingredientes}
            onChange={(e) => setIngredientes(e.target.value)}
            rows={3}
            placeholder="Ex: Leite cru, sal e coalho. Validade 90 dias. Conservar refrigerado (até 8°C)."
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md outline-none focus:border-primary"
          />
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

            <Campo
              rotulo={`Preço fixo (R$/${atacadoUnidade === "kg" ? "kg" : "peça"}) — o valor não muda com a quantidade`}
              prefixo="R$"
              sufixo={`/${atacadoUnidade === "kg" ? "kg" : "pç"}`}
            >
              <input
                value={atacadoFixo}
                onChange={(e) => setAtacadoFixo(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
                className="w-full bg-transparent text-body-lg outline-none"
              />
            </Campo>

            <div>
              <label className="block text-label-md text-on-surface">
                Faixas de preço por volume (opcional)
              </label>
              <p className="mb-sm text-label-sm text-on-surface-variant">
                Só se quiser <strong>desconto por volume</strong>. Ex.: a partir de
                10 {atacadoUnidade === "kg" ? "kg" : "peças"} → R$ X{" "}
                {atacadoUnidade === "kg" ? "o kg" : "a peça"}. Deixe vazio para
                usar só o preço fixo acima.
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

        {/* Prévia ao vivo (lado direito, acompanha o scroll) */}
        <aside className="hidden xl:block">
          <div className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <Previa />
          </div>
        </aside>
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
