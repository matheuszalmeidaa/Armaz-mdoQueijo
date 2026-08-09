"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATALOGO,
  CATEGORIAS,
  precoPorKg,
  precoBase,
  brl,
  gramas,
  type Produto,
} from "@/lib/catalogo";
import { ProdutoImagem } from "@/components/ProdutoImagem";

type ItemVenda = {
  key: string;
  produtoId: string;
  nome: string;
  icone: string;
  pesoG?: number;
  qtd: number;
  precoLinha: number;
};

const LOJAS = ["Loja Centro", "Loja Bairro"];
const PAGAMENTOS = [
  { id: "dinheiro", label: "Dinheiro", icon: "payments" },
  { id: "pix", label: "Pix", icon: "qr_code_2" },
  { id: "debito", label: "Débito", icon: "credit_card" },
  { id: "credito", label: "Crédito", icon: "credit_card" },
];

export default function PDV() {
  const [loja, setLoja] = useState(LOJAS[0]);
  const [aberta, setAberta] = useState(true);
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("Todos");
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [produtoPeso, setProdutoPeso] = useState<
    Extract<Produto, { tipo: "peso" }> | null
  >(null);
  const [abrirVenda, setAbrirVenda] = useState(false);
  const [pagamento, setPagamento] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [vendasHoje, setVendasHoje] = useState(0);
  const [totalHoje, setTotalHoje] = useState(0);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return CATALOGO.filter((p) => {
      const okCat = cat === "Todos" || p.categoria === cat;
      const okBusca = !q || p.nome.toLowerCase().includes(q);
      return okCat && okBusca;
    });
  }, [busca, cat]);

  const total = itens.reduce((s, x) => s + x.precoLinha, 0);
  const qtdItens = itens.reduce((s, x) => s + x.qtd, 0);

  function clicarProduto(p: Produto) {
    if (p.tipo === "peso") {
      setProdutoPeso(p);
    } else {
      addItem({
        key: p.id,
        produtoId: p.id,
        nome: p.nome,
        icone: p.icone,
        qtd: 1,
        precoLinha: p.preco,
      });
    }
  }

  function addItem(item: ItemVenda) {
    setItens((prev) => {
      const i = prev.findIndex((x) => x.key === item.key);
      if (i === -1) return [...prev, item];
      const copia = [...prev];
      copia[i] = {
        ...copia[i],
        qtd: copia[i].qtd + item.qtd,
        precoLinha: copia[i].precoLinha + item.precoLinha,
      };
      return copia;
    });
  }

  function alterarQtd(key: string, delta: number) {
    setItens((prev) =>
      prev
        .map((x) => {
          if (x.key !== key || x.pesoG) return x; // peso não usa +/-
          const novaQtd = x.qtd + delta;
          if (novaQtd <= 0) return null;
          const unit = x.precoLinha / x.qtd;
          return { ...x, qtd: novaQtd, precoLinha: unit * novaQtd };
        })
        .filter(Boolean) as ItemVenda[]
    );
  }

  const remover = (key: string) =>
    setItens((prev) => prev.filter((x) => x.key !== key));

  function finalizar() {
    if (itens.length === 0 || !pagamento) return;
    // Mock: sem Supabase, a venda não persiste — apenas contabiliza a sessão.
    setVendasHoje((n) => n + 1);
    setTotalHoje((v) => v + total);
    setItens([]);
    setPagamento(null);
    setAbrirVenda(false);
    setConfirmado(true);
    setTimeout(() => setConfirmado(false), 1800);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Cabeçalho */}
      <header className="flex flex-shrink-0 items-center justify-between gap-md border-b border-outline-variant/30 bg-surface px-md py-sm">
        <div className="flex items-center gap-sm">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined">point_of_sale</span>
          </div>
          <span className="font-display text-headline-md text-primary">PDV</span>
        </div>

        <div className="flex items-center gap-sm">
          {/* Seletor de loja */}
          <select
            value={loja}
            onChange={(e) => setLoja(e.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface outline-none"
          >
            {LOJAS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          {/* Loja aberta */}
          <button
            onClick={() => setAberta((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-label-md ${
              aberta
                ? "bg-tertiary-container/40 text-tertiary"
                : "bg-error-container text-on-error-container"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                aberta ? "bg-tertiary" : "bg-error"
              }`}
            />
            {aberta ? "Aberta" : "Fechada"}
          </button>
        </div>
      </header>

      {/* Corpo: catálogo + venda */}
      <div className="flex min-h-0 flex-1">
        {/* Catálogo */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Busca + categorias */}
          <div className="flex-shrink-0 space-y-sm border-b border-outline-variant/20 p-md">
            <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
              <span className="material-symbols-outlined text-on-surface-variant">
                search
              </span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto ou bipar código..."
                className="w-full bg-transparent text-body-lg outline-none placeholder:text-on-surface-variant/60"
              />
              {busca && (
                <button onClick={() => setBusca("")} className="text-outline">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            <div className="no-scrollbar flex gap-sm overflow-x-auto">
              {["Todos", ...CATEGORIAS].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-label-md ${
                    cat === c
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grade */}
          <div className="min-h-0 flex-1 overflow-y-auto p-md">
            <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 lg:grid-cols-4">
              {lista.map((p) => (
                <button
                  key={p.id}
                  onClick={() => clicarProduto(p)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all active:scale-[0.97]"
                >
                  <div className="relative">
                    <ProdutoImagem
                      src={p.img}
                      alt={p.nome}
                      icone={p.icone}
                      className="aspect-square w-full"
                      iconSize={44}
                    />
                    {p.tipo === "peso" && (
                      <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-warning-amber px-2 py-0.5 text-[10px] font-semibold text-on-secondary-fixed">
                        <span className="material-symbols-outlined text-[12px]">
                          scale
                        </span>
                        peso
                      </span>
                    )}
                  </div>
                  <div className="flex flex-grow flex-col p-sm">
                    <h4 className="line-clamp-2 text-label-md leading-tight text-on-surface">
                      {p.nome}
                    </h4>
                    <div className="mt-auto pt-1">
                      {p.tipo === "peso" && (
                        <span className="block text-caption text-on-surface-variant">
                          a partir de
                        </span>
                      )}
                      <span className="font-headline-md text-headline-md text-primary">
                        {brl(precoBase(p))}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* Venda (desktop) */}
        <aside className="hidden w-[380px] flex-shrink-0 border-l border-outline-variant/30 bg-surface-container-low lg:flex">
          <PainelVenda
            itens={itens}
            total={total}
            pagamento={pagamento}
            setPagamento={setPagamento}
            alterarQtd={alterarQtd}
            remover={remover}
            finalizar={finalizar}
            vendasHoje={vendasHoje}
            totalHoje={totalHoje}
          />
        </aside>
      </div>

      {/* Barra de venda (mobile) */}
      {qtdItens > 0 && (
        <button
          onClick={() => setAbrirVenda(true)}
          className="flex flex-shrink-0 items-center justify-between bg-primary px-md py-3 text-on-primary shadow-lg lg:hidden"
        >
          <span className="flex items-center gap-2 text-body-lg font-semibold">
            <span className="material-symbols-outlined">shopping_cart</span>
            Ver venda ({qtdItens})
          </span>
          <span className="font-headline-md text-headline-md">{brl(total)}</span>
        </button>
      )}

      {/* Folha de venda (mobile) */}
      {abrirVenda && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 lg:hidden">
          <div className="flex max-h-[88dvh] flex-col rounded-t-xl bg-surface-container-low">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
              <span className="font-headline-md text-headline-md text-primary">
                Venda atual
              </span>
              <button
                onClick={() => setAbrirVenda(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <PainelVenda
              itens={itens}
              total={total}
              pagamento={pagamento}
              setPagamento={setPagamento}
              alterarQtd={alterarQtd}
              remover={remover}
              finalizar={finalizar}
              vendasHoje={vendasHoje}
              totalHoje={totalHoje}
              semCabecalho
            />
          </div>
        </div>
      )}

      {/* Modal de pesagem */}
      {produtoPeso && (
        <ModalPeso
          produto={produtoPeso}
          onFechar={() => setProdutoPeso(null)}
          onAdicionar={(pesoG, precoLinha) => {
            addItem({
              key: `${produtoPeso.id}-${pesoG}-${Date.now()}`,
              produtoId: produtoPeso.id,
              nome: produtoPeso.nome,
              icone: produtoPeso.icone,
              pesoG,
              qtd: 1,
              precoLinha,
            });
            setProdutoPeso(null);
          }}
        />
      )}

      {/* Toast de confirmação */}
      {confirmado && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-sm rounded-lg bg-tertiary px-lg py-3 text-on-tertiary shadow-lg">
          <span className="material-symbols-outlined">check_circle</span>
          Venda registrada!
        </div>
      )}
    </div>
  );
}

// ---------------- Painel de venda ----------------
function PainelVenda({
  itens,
  total,
  pagamento,
  setPagamento,
  alterarQtd,
  remover,
  finalizar,
  vendasHoje,
  totalHoje,
  semCabecalho,
}: {
  itens: ItemVenda[];
  total: number;
  pagamento: string | null;
  setPagamento: (p: string) => void;
  alterarQtd: (key: string, delta: number) => void;
  remover: (key: string) => void;
  finalizar: () => void;
  vendasHoje: number;
  totalHoje: number;
  semCabecalho?: boolean;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {!semCabecalho && (
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
          <span className="font-headline-md text-headline-md text-primary">
            Venda atual
          </span>
          <div className="text-right leading-tight">
            <span className="block text-caption text-on-surface-variant">
              Hoje: {vendasHoje} venda{vendasHoje === 1 ? "" : "s"}
            </span>
            <span className="block text-label-md text-tertiary">
              {brl(totalHoje)}
            </span>
          </div>
        </div>
      )}

      {/* Itens */}
      <div className="min-h-0 flex-1 overflow-y-auto px-md">
        {itens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined mb-sm text-[48px] text-outline">
              receipt_long
            </span>
            <p className="text-body-md">Toque num produto para começar a venda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {itens.map((it) => (
              <li key={it.key} className="flex items-center gap-sm py-sm">
                <div className="min-w-0 flex-grow">
                  <p className="line-clamp-1 text-label-md text-on-surface">
                    {it.nome}
                  </p>
                  <span className="text-caption text-on-surface-variant">
                    {it.pesoG ? `${gramas(it.pesoG)} (peso)` : `${brl(it.precoLinha / it.qtd)} un`}
                  </span>
                </div>
                {/* Controle */}
                {it.pesoG ? (
                  <span className="text-label-md text-on-surface-variant">
                    {it.qtd}x
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => alterarQtd(it.key, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-primary active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        remove
                      </span>
                    </button>
                    <span className="w-5 text-center text-label-md">{it.qtd}</span>
                    <button
                      onClick={() => alterarQtd(it.key, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-primary active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                    </button>
                  </div>
                )}
                <span className="w-20 text-right font-label-md text-label-md text-primary">
                  {brl(it.precoLinha)}
                </span>
                <button
                  onClick={() => remover(it.key)}
                  className="text-danger-red active:scale-90"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    delete
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rodapé: pagamento + total */}
      <div className="flex-shrink-0 border-t border-outline-variant/20 bg-surface p-md">
        <div className="mb-sm grid grid-cols-4 gap-sm">
          {PAGAMENTOS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPagamento(p.id)}
              disabled={itens.length === 0}
              className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-label-sm transition-all disabled:opacity-40 ${
                pagamento === p.id
                  ? "border-primary bg-primary-container/10 text-primary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {p.icon}
              </span>
              {p.label}
            </button>
          ))}
        </div>

        <div className="mb-sm flex items-center justify-between">
          <span className="text-body-lg text-on-surface-variant">Total</span>
          <span className="font-display text-headline-lg text-primary">
            {brl(total)}
          </span>
        </div>

        <button
          onClick={finalizar}
          disabled={itens.length === 0 || !pagamento}
          className="w-full rounded-lg bg-primary py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {itens.length === 0
            ? "Adicione produtos"
            : !pagamento
              ? "Escolha o pagamento"
              : "Finalizar Venda"}
        </button>
      </div>
    </div>
  );
}

// ---------------- Modal de pesagem ----------------
function ModalPeso({
  produto,
  onFechar,
  onAdicionar,
}: {
  produto: Extract<Produto, { tipo: "peso" }>;
  onFechar: () => void;
  onAdicionar: (pesoG: number, precoLinha: number) => void;
}) {
  const [peso, setPeso] = useState<number>(produto.pesos[1] ?? produto.pesos[0]);
  const kg = precoPorKg(produto, peso || 0);
  const preco = (kg * (peso || 0)) / 1000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md rounded-t-xl bg-surface-container-low p-md sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-md flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-primary">
            {produto.nome}
          </h3>
          <button
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-body-md text-on-surface-variant">
          {brl(kg)}/kg · pese na balança e informe o peso
        </p>

        {/* Presets */}
        <div className="mt-sm grid grid-cols-4 gap-sm">
          {produto.pesos.map((g) => (
            <button
              key={g}
              onClick={() => setPeso(g)}
              className={`rounded-lg border py-2 text-label-md ${
                peso === g
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface"
              }`}
            >
              {gramas(g)}
            </button>
          ))}
        </div>

        {/* Peso exato (balança) */}
        <label className="mt-md block text-label-md text-on-surface">
          Peso exato (g)
        </label>
        <input
          type="number"
          value={peso || ""}
          onChange={(e) => setPeso(parseInt(e.target.value) || 0)}
          inputMode="numeric"
          className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-3 text-headline-md text-on-surface outline-none focus:border-primary"
        />

        <div className="mt-md flex items-center justify-between">
          <span className="text-body-lg text-on-surface-variant">Subtotal</span>
          <span className="font-headline-md text-headline-md text-primary">
            {brl(preco)}
          </span>
        </div>

        <button
          onClick={() => peso > 0 && onAdicionar(peso, preco)}
          disabled={!peso || peso <= 0}
          className="mt-md w-full rounded-lg bg-primary py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Adicionar à venda
        </button>
      </div>
    </div>
  );
}
