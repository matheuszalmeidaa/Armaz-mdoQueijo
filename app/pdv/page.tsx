"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORIAS,
  precoPorKg,
  precoBase,
  brl,
  gramas,
  type Produto,
} from "@/lib/catalogo";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { registrarVendaPDV } from "@/lib/pedidos-store";
import { useCatalogo } from "@/lib/catalogo-store";

type ItemVenda = {
  key: string;
  produtoId: string;
  nome: string;
  icone: string;
  pesoG?: number;
  qtd: number;
  precoLinha: number;
};

type Ajuste = { tipo: "desconto" | "acrescimo"; modo: "reais" | "percent"; valor: number };
type CaixaMetodo = { n: number; total: number };
type Cupom = {
  numero: string;
  hora: string;
  loja: string;
  itens: ItemVenda[];
  subtotal: number;
  ajuste: Ajuste | null;
  ajusteValor: number;
  total: number;
  pagamento: string;
};

const LOJAS = ["Loja Centro", "Loja Bairro"];
const PAGAMENTOS = [
  { id: "dinheiro", label: "Dinheiro", icon: "payments" },
  { id: "pix", label: "Pix", icon: "qr_code_2" },
  { id: "debito", label: "Débito", icon: "credit_card" },
  { id: "credito", label: "Crédito", icon: "credit_card" },
];
const PAG_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
};
const caixaZero = (): Record<string, CaixaMetodo> => ({
  dinheiro: { n: 0, total: 0 },
  pix: { n: 0, total: 0 },
  debito: { n: 0, total: 0 },
  credito: { n: 0, total: 0 },
});

export default function PDV() {
  const [loja, setLoja] = useState(LOJAS[0]);
  const [aberta, setAberta] = useState(true);
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState("Todos");
  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [ajuste, setAjuste] = useState<Ajuste | null>(null);
  const [produtoPeso, setProdutoPeso] = useState<
    Extract<Produto, { tipo: "peso" }> | null
  >(null);
  const [abrirVenda, setAbrirVenda] = useState(false);
  const [pagamento, setPagamento] = useState<string | null>(null);
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [caixa, setCaixa] = useState(caixaZero);
  const [sangrias, setSangrias] = useState<{ valor: number; motivo: string }[]>([]);
  const [fecharAberto, setFecharAberto] = useState(false);
  const [cupom, setCupom] = useState<Cupom | null>(null);

  const CATALOGO = useCatalogo();
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return CATALOGO.filter((p) => {
      const okCat = cat === "Todos" || p.categoria === cat;
      const okBusca = !q || p.nome.toLowerCase().includes(q);
      return okCat && okBusca;
    });
  }, [busca, cat, CATALOGO]);

  const subtotal = itens.reduce((s, x) => s + x.precoLinha, 0);
  const qtdItens = itens.reduce((s, x) => s + x.qtd, 0);
  const ajusteValor = !ajuste
    ? 0
    : ajuste.modo === "reais"
      ? ajuste.valor
      : (subtotal * ajuste.valor) / 100;
  const total = Math.max(
    0,
    ajuste?.tipo === "acrescimo" ? subtotal + ajusteValor : subtotal - ajusteValor
  );

  const vendasHoje = Object.values(caixa).reduce((s, m) => s + m.n, 0);
  const totalHoje = Object.values(caixa).reduce((s, m) => s + m.total, 0);

  function clicarProduto(p: Produto) {
    if (p.tipo === "peso") setProdutoPeso(p);
    else
      addItem({
        key: p.id,
        produtoId: p.id,
        nome: p.nome,
        icone: p.icone,
        qtd: 1,
        precoLinha: p.preco,
      });
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
          if (x.key !== key || x.pesoG) return x;
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

  // Scanner: Enter na busca com 1 resultado adiciona direto
  function onBuscaEnter() {
    if (lista.length === 1) {
      clicarProduto(lista[0]);
      setBusca("");
    }
  }

  function finalizar() {
    if (itens.length === 0 || !pagamento) return;
    setCaixa((prev) => ({
      ...prev,
      [pagamento]: {
        n: prev[pagamento].n + 1,
        total: prev[pagamento].total + total,
      },
    }));
    // Registra a venda na espinha — aparece na gestão de pedidos, relatórios
    // e clientes (mesma fonte do delivery).
    registrarVendaPDV({
      cliente: "Consumidor",
      pagamento: PAG_LABEL[pagamento] ?? pagamento,
      itens: itens.map((it) => ({
        nome: it.nome,
        qtd: it.pesoG ? gramas(it.pesoG) : `${it.qtd} un`,
        preco: it.precoLinha,
      })),
      total,
    });
    setCupom({
      numero: String(Math.floor(1000 + Math.random() * 9000)),
      hora: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      loja,
      itens,
      subtotal,
      ajuste,
      ajusteValor,
      total,
      pagamento,
    });
    setItens([]);
    setAjuste(null);
    setPagamento(null);
    setAbrirVenda(false);
  }

  function fecharCaixa() {
    setCaixa(caixaZero());
    setSangrias([]);
    setFecharAberto(false);
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
          <button
            onClick={() => setFecharAberto(true)}
            className="hidden items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-primary sm:flex"
          >
            <span className="material-symbols-outlined text-[18px]">
              account_balance_wallet
            </span>
            Caixa
          </button>
          <button
            onClick={() => setAberta((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-label-md ${
              aberta
                ? "bg-tertiary-container/40 text-tertiary"
                : "bg-error-container text-on-error-container"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${aberta ? "bg-tertiary" : "bg-error"}`}
            />
            {aberta ? "Aberta" : "Fechada"}
          </button>
          <Link
            href="/admin"
            title="Gerenciar (produtos, configurações)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-primary hover:bg-surface-container active:scale-95"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </header>

      {/* Corpo */}
      <div className="flex min-h-0 flex-1">
        {/* Catálogo */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-shrink-0 space-y-sm border-b border-outline-variant/20 p-md">
            <div className="flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
              <span className="material-symbols-outlined text-on-surface-variant">
                search
              </span>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onBuscaEnter()}
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
            subtotal={subtotal}
            ajuste={ajuste}
            ajusteValor={ajusteValor}
            total={total}
            pagamento={pagamento}
            setPagamento={setPagamento}
            alterarQtd={alterarQtd}
            remover={remover}
            finalizar={finalizar}
            vendasHoje={vendasHoje}
            totalHoje={totalHoje}
            abrirAjuste={() => setAjusteAberto(true)}
            removerAjuste={() => setAjuste(null)}
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
              subtotal={subtotal}
              ajuste={ajuste}
              ajusteValor={ajusteValor}
              total={total}
              pagamento={pagamento}
              setPagamento={setPagamento}
              alterarQtd={alterarQtd}
              remover={remover}
              finalizar={finalizar}
              vendasHoje={vendasHoje}
              totalHoje={totalHoje}
              abrirAjuste={() => setAjusteAberto(true)}
              removerAjuste={() => setAjuste(null)}
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

      {/* Modal de desconto/acréscimo */}
      {ajusteAberto && (
        <ModalAjuste
          atual={ajuste}
          subtotal={subtotal}
          onFechar={() => setAjusteAberto(false)}
          onAplicar={(a) => {
            setAjuste(a);
            setAjusteAberto(false);
          }}
        />
      )}

      {/* Modal de fechamento de caixa */}
      {fecharAberto && (
        <ModalCaixa
          caixa={caixa}
          sangrias={sangrias}
          vendasHoje={vendasHoje}
          totalHoje={totalHoje}
          loja={loja}
          onSangria={(s) => setSangrias((prev) => [...prev, s])}
          onFecharCaixa={fecharCaixa}
          onFechar={() => setFecharAberto(false)}
        />
      )}

      {/* Cupom (após finalizar) */}
      {cupom && <ModalCupom cupom={cupom} onFechar={() => setCupom(null)} />}
    </div>
  );
}

// ---------------- Painel de venda ----------------
function PainelVenda({
  itens,
  subtotal,
  ajuste,
  ajusteValor,
  total,
  pagamento,
  setPagamento,
  alterarQtd,
  remover,
  finalizar,
  vendasHoje,
  totalHoje,
  abrirAjuste,
  removerAjuste,
  semCabecalho,
}: {
  itens: ItemVenda[];
  subtotal: number;
  ajuste: Ajuste | null;
  ajusteValor: number;
  total: number;
  pagamento: string | null;
  setPagamento: (p: string) => void;
  alterarQtd: (key: string, delta: number) => void;
  remover: (key: string) => void;
  finalizar: () => void;
  vendasHoje: number;
  totalHoje: number;
  abrirAjuste: () => void;
  removerAjuste: () => void;
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
                    {it.pesoG
                      ? `${gramas(it.pesoG)} (peso)`
                      : `${brl(it.precoLinha / it.qtd)} un`}
                  </span>
                </div>
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

      {/* Rodapé */}
      <div className="flex-shrink-0 border-t border-outline-variant/20 bg-surface p-md">
        {/* Desconto / acréscimo */}
        <div className="mb-sm">
          {ajuste ? (
            <div className="flex items-center justify-between rounded-lg bg-surface-container-low px-md py-2">
              <span className="text-label-md text-on-surface">
                {ajuste.tipo === "desconto" ? "Desconto" : "Acréscimo"}{" "}
                <span className="text-on-surface-variant">
                  ({ajuste.modo === "percent" ? `${ajuste.valor}%` : brl(ajuste.valor)})
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={
                    ajuste.tipo === "desconto" ? "text-tertiary" : "text-secondary"
                  }
                >
                  {ajuste.tipo === "desconto" ? "-" : "+"} {brl(ajusteValor)}
                </span>
                <button onClick={removerAjuste} className="text-danger-red">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </span>
            </div>
          ) : (
            <button
              onClick={abrirAjuste}
              disabled={itens.length === 0}
              className="flex items-center gap-1 text-label-md text-secondary disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">percent</span>
              Desconto / acréscimo
            </button>
          )}
        </div>

        {/* Pagamento */}
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
              <span className="material-symbols-outlined text-[20px]">{p.icon}</span>
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
    <Overlay onFechar={onFechar}>
      <div className="mb-md flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">
          {produto.nome}
        </h3>
        <BotaoFechar onClick={onFechar} />
      </div>
      <p className="text-body-md text-on-surface-variant">
        {brl(kg)}/kg · pese na balança e informe o peso
      </p>
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
        className="mt-md w-full rounded-lg bg-primary py-4 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
      >
        Adicionar à venda
      </button>
    </Overlay>
  );
}

// ---------------- Modal de desconto/acréscimo ----------------
function ModalAjuste({
  atual,
  subtotal,
  onFechar,
  onAplicar,
}: {
  atual: Ajuste | null;
  subtotal: number;
  onFechar: () => void;
  onAplicar: (a: Ajuste) => void;
}) {
  const [tipo, setTipo] = useState<Ajuste["tipo"]>(atual?.tipo ?? "desconto");
  const [modo, setModo] = useState<Ajuste["modo"]>(atual?.modo ?? "reais");
  const [valor, setValor] = useState(String(atual?.valor ?? ""));

  const v = Number(valor.replace(",", ".")) || 0;
  const previa = modo === "percent" ? (subtotal * v) / 100 : v;

  return (
    <Overlay onFechar={onFechar}>
      <div className="mb-md flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md text-primary">
          Desconto / acréscimo
        </h3>
        <BotaoFechar onClick={onFechar} />
      </div>

      <div className="flex rounded-lg border border-outline-variant p-1">
        <SegBtn ativo={tipo === "desconto"} onClick={() => setTipo("desconto")}>
          Desconto
        </SegBtn>
        <SegBtn ativo={tipo === "acrescimo"} onClick={() => setTipo("acrescimo")}>
          Acréscimo
        </SegBtn>
      </div>

      <div className="mt-sm flex gap-sm">
        <div className="flex rounded-lg border border-outline-variant p-1">
          <SegBtn ativo={modo === "reais"} onClick={() => setModo("reais")}>
            R$
          </SegBtn>
          <SegBtn ativo={modo === "percent"} onClick={() => setModo("percent")}>
            %
          </SegBtn>
        </div>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          inputMode="decimal"
          placeholder={modo === "percent" ? "10" : "0,00"}
          className="flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-headline-md text-on-surface outline-none focus:border-primary"
        />
      </div>

      <div className="mt-md flex items-center justify-between">
        <span className="text-body-md text-on-surface-variant">
          {tipo === "desconto" ? "Desconto" : "Acréscimo"} aplicado
        </span>
        <span
          className={`font-headline-md text-headline-md ${
            tipo === "desconto" ? "text-tertiary" : "text-secondary"
          }`}
        >
          {tipo === "desconto" ? "-" : "+"} {brl(previa)}
        </span>
      </div>

      <button
        onClick={() => onAplicar({ tipo, modo, valor: v })}
        disabled={v <= 0}
        className="mt-md w-full rounded-lg bg-primary py-4 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
      >
        Aplicar
      </button>
    </Overlay>
  );
}

// ---------------- Modal de fechamento de caixa ----------------
function ModalCaixa({
  caixa,
  sangrias,
  vendasHoje,
  totalHoje,
  loja,
  onSangria,
  onFecharCaixa,
  onFechar,
}: {
  caixa: Record<string, CaixaMetodo>;
  sangrias: { valor: number; motivo: string }[];
  vendasHoje: number;
  totalHoje: number;
  loja: string;
  onSangria: (s: { valor: number; motivo: string }) => void;
  onFecharCaixa: () => void;
  onFechar: () => void;
}) {
  const [sangriaValor, setSangriaValor] = useState("");
  const [sangriaMotivo, setSangriaMotivo] = useState("");
  const totalSangrias = sangrias.reduce((s, x) => s + x.valor, 0);
  const dinheiroEmCaixa = caixa.dinheiro.total - totalSangrias;

  function registrarSangria() {
    const v = Number(sangriaValor.replace(",", ".")) || 0;
    if (v <= 0) return;
    onSangria({ valor: v, motivo: sangriaMotivo || "Sangria" });
    setSangriaValor("");
    setSangriaMotivo("");
  }

  return (
    <Overlay onFechar={onFechar}>
      <div className="mb-md flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-headline-md text-primary">
            Fechamento de caixa
          </h3>
          <span className="text-label-sm text-on-surface-variant">{loja}</span>
        </div>
        <BotaoFechar onClick={onFechar} />
      </div>

      {/* Por forma de pagamento */}
      <div className="space-y-1">
        {PAGAMENTOS.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-surface-container-low px-md py-2"
          >
            <span className="flex items-center gap-sm text-body-md text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-secondary">
                {p.icon}
              </span>
              {p.label}
              <span className="text-caption text-on-surface-variant">
                ({caixa[p.id].n})
              </span>
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              {brl(caixa[p.id].total)}
            </span>
          </div>
        ))}
      </div>

      {/* Sangrias */}
      {sangrias.length > 0 && (
        <div className="mt-sm flex items-center justify-between rounded-lg bg-error-container/40 px-md py-2">
          <span className="text-body-md text-on-error-container">
            Sangrias ({sangrias.length})
          </span>
          <span className="text-label-md text-on-error-container">
            - {brl(totalSangrias)}
          </span>
        </div>
      )}

      {/* Totais */}
      <div className="mt-md space-y-1 border-t border-dashed border-outline/20 pt-sm">
        <Linha rotulo={`Vendas (${vendasHoje})`} valor={brl(totalHoje)} />
        <Linha rotulo="Dinheiro em caixa" valor={brl(dinheiroEmCaixa)} destaque />
      </div>

      {/* Registrar sangria */}
      <div className="mt-md rounded-lg border border-outline-variant bg-surface-container-lowest p-sm">
        <span className="text-label-md text-on-surface">Registrar sangria</span>
        <div className="mt-1 flex gap-sm">
          <input
            value={sangriaValor}
            onChange={(e) => setSangriaValor(e.target.value)}
            inputMode="decimal"
            placeholder="R$ 0,00"
            className="w-28 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
          />
          <input
            value={sangriaMotivo}
            onChange={(e) => setSangriaMotivo(e.target.value)}
            placeholder="Motivo (ex: troco, fornecedor)"
            className="flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
          />
          <button
            onClick={registrarSangria}
            className="rounded-lg bg-secondary px-3 text-label-md text-on-secondary"
          >
            Ok
          </button>
        </div>
      </div>

      <div className="mt-md flex gap-sm">
        <button
          onClick={() => window.print()}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-3 text-label-md text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">print</span>
          Imprimir
        </button>
        <button
          onClick={onFecharCaixa}
          className="flex-1 rounded-lg bg-primary py-3 text-label-md font-semibold text-on-primary"
        >
          Fechar caixa
        </button>
      </div>
      <p className="mt-sm text-caption text-on-surface-variant">
        Fechar zera os contadores do turno. Ao ligar o Supabase, isso vira um
        registro de fechamento por loja.
      </p>
    </Overlay>
  );
}

// ---------------- Modal de cupom ----------------
function ModalCupom({ cupom, onFechar }: { cupom: Cupom; onFechar: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-[24rem] rounded-t-xl bg-surface-container-lowest sm:rounded-xl">
        {/* Cabeçalho (não imprime) */}
        <div className="no-print flex items-center justify-between border-b border-outline-variant/20 px-md py-sm">
          <span className="flex items-center gap-1 font-headline-md text-headline-md text-tertiary">
            <span className="material-symbols-outlined">check_circle</span>
            Venda registrada
          </span>
          <BotaoFechar onClick={onFechar} />
        </div>

        {/* Cupom */}
        <div className="cupom-print px-lg py-md text-on-surface">
          <div className="text-center">
            <p className="font-display text-headline-md text-primary">
              Armazém do Queijo
            </p>
            <p className="text-caption text-on-surface-variant">
              {cupom.loja} · Cupom não fiscal
            </p>
            <p className="text-caption text-on-surface-variant">
              Pedido #{cupom.numero} · {cupom.hora}
            </p>
          </div>
          <div className="my-sm border-t border-dashed border-outline/40" />
          <ul className="space-y-1">
            {cupom.itens.map((it) => (
              <li key={it.key} className="flex justify-between text-body-md">
                <span className="mr-2 truncate">
                  {it.pesoG ? `${gramas(it.pesoG)} ` : `${it.qtd}x `}
                  {it.nome}
                </span>
                <span className="whitespace-nowrap">{brl(it.precoLinha)}</span>
              </li>
            ))}
          </ul>
          <div className="my-sm border-t border-dashed border-outline/40" />
          <Linha rotulo="Subtotal" valor={brl(cupom.subtotal)} />
          {cupom.ajuste && (
            <Linha
              rotulo={cupom.ajuste.tipo === "desconto" ? "Desconto" : "Acréscimo"}
              valor={`${cupom.ajuste.tipo === "desconto" ? "-" : "+"} ${brl(cupom.ajusteValor)}`}
            />
          )}
          <div className="mt-1 flex justify-between text-body-lg font-semibold">
            <span>TOTAL</span>
            <span>{brl(cupom.total)}</span>
          </div>
          <p className="mt-1 text-caption text-on-surface-variant">
            Pago em {PAG_LABEL[cupom.pagamento]}
          </p>
          <p className="mt-md text-center text-caption text-on-surface-variant">
            Obrigado pela preferência!
          </p>
        </div>

        {/* Ações (não imprime) */}
        <div className="no-print flex gap-sm border-t border-outline-variant/20 p-md">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-3 text-label-md text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            Imprimir cupom
          </button>
          <button
            onClick={onFechar}
            className="flex-1 rounded-lg bg-primary py-3 text-label-md font-semibold text-on-primary"
          >
            Nova venda
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Auxiliares ----------------
function Overlay({
  children,
  onFechar,
}: {
  children: React.ReactNode;
  onFechar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onFechar}
    >
      <div
        className="max-h-[92dvh] w-full max-w-[28rem] overflow-y-auto rounded-t-xl bg-surface-container-low p-md sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function BotaoFechar({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant"
    >
      <span className="material-symbols-outlined">close</span>
    </button>
  );
}

function SegBtn({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-4 py-1.5 text-label-md transition-colors ${
        ativo ? "bg-primary text-on-primary" : "text-on-surface"
      }`}
    >
      {children}
    </button>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          destaque
            ? "text-body-lg font-semibold text-on-surface"
            : "text-body-md text-on-surface-variant"
        }
      >
        {rotulo}
      </span>
      <span
        className={
          destaque
            ? "font-headline-md text-headline-md text-primary"
            : "text-body-md text-on-surface"
        }
      >
        {valor}
      </span>
    </div>
  );
}
