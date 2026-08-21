"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useConfig } from "@/lib/config-store";
import { useCatalogo, useCfgMapa } from "@/lib/catalogo-store";
import {
  brl,
  precoAtacado,
  minimoAtacado,
  CATEGORIAS,
  type Produto,
  type Atacado,
} from "@/lib/catalogo";
import { registrarPedidoAtacado } from "@/lib/pedidos-store";
import { linkWhatsApp } from "@/lib/pedido-msg";
import { ProdutoImagem } from "@/components/ProdutoImagem";

const un = (a: Atacado) => (a.unidade === "kg" ? "kg" : "pç");
const precoEntrada = (a: Atacado) =>
  Math.min(...a.faixas.map((f) => f.preco));

function mascaraTel(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function Atacado() {
  const cfg = useConfig();
  const catalogo = useCatalogo();
  const cfgMapa = useCfgMapa();

  const [cat, setCat] = useState("Todos");
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [etapa, setEtapa] = useState<"catalogo" | "pedido">("catalogo");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviado, setEnviado] = useState<{ numero: string } | null>(null);

  const zap = cfg.whatsapp.replace(/\D/g, "");

  // Produtos marcados como atacado, com faixas válidas.
  const produtos = useMemo(
    () =>
      catalogo
        .map((p) => ({ produto: p, atacado: cfgMapa[p.id]?.atacado }))
        .filter(
          (x): x is { produto: Produto; atacado: Atacado } =>
            Boolean(x.atacado?.ativo && x.atacado.faixas.length)
        ),
    [catalogo, cfgMapa]
  );
  const getAtacado = (id: string) =>
    produtos.find((x) => x.produto.id === id)?.atacado;

  const lista =
    cat === "Todos"
      ? produtos
      : produtos.filter((x) => x.produto.categoria === cat);

  const itens = useMemo(() => {
    const out: {
      produto: Produto;
      atacado: Atacado;
      qtd: number;
      unit: number;
      subtotal: number;
    }[] = [];
    for (const { produto, atacado } of produtos) {
      const qtd = carrinho[produto.id] ?? 0;
      if (qtd <= 0) continue;
      const unit = precoAtacado(atacado, qtd);
      out.push({ produto, atacado, qtd, unit, subtotal: unit * qtd });
    }
    return out;
  }, [produtos, carrinho]);

  const total = itens.reduce((s, i) => s + i.subtotal, 0);
  const nItens = itens.length;

  function setQtd(id: string, qtd: number) {
    const a = getAtacado(id);
    if (!a) return;
    const min = minimoAtacado(a);
    setCarrinho((c) => {
      const nc = { ...c };
      if (qtd < min) delete nc[id];
      else nc[id] = qtd;
      return nc;
    });
  }

  function enviar() {
    if (!nome.trim() || telefone.replace(/\D/g, "").length < 10 || !zap) return;
    const itensLive = itens.map((i) => ({
      nome: i.produto.nome,
      qtd: `${i.qtd} ${un(i.atacado)}`,
      preco: i.subtotal,
    }));
    // Cria a comanda na gestão (canal Atacado) e pega o número.
    const pedido = registrarPedidoAtacado({
      cliente: nome.trim(),
      telefone: telefone.trim(),
      itens: itensLive,
      total,
    });
    // Monta e abre o WhatsApp da loja.
    const linhas = itens.map(
      (i) =>
        `• ${i.produto.nome} — ${i.qtd} ${un(i.atacado)} × ${brl(i.unit)}/${un(
          i.atacado
        )} = ${brl(i.subtotal)}`
    );
    const texto =
      `*PEDIDO DE ATACADO Nº ${pedido.numero} — Armazém do Queijo*\n` +
      `👤 ${nome.trim()} — ${telefone.trim()}\n\n` +
      `🛒 *Itens:*\n${linhas.join("\n")}\n\n` +
      `*Total: ${brl(total)}*\n\n` +
      `_Valores a confirmar com a loja._`;
    const link = linkWhatsApp(cfg.whatsapp, texto);
    if (link) window.open(link, "_blank");
    setEnviado({ numero: pedido.numero });
  }

  const telValido = telefone.replace(/\D/g, "").length >= 10;
  const podeEnviar = nome.trim().length > 1 && telValido && nItens > 0 && Boolean(zap);

  // --- Tela de sucesso ---
  if (enviado) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[32rem] flex-col items-center justify-center px-md text-center">
        <span className="material-symbols-outlined text-[56px] text-tertiary">
          check_circle
        </span>
        <h1 className="mt-md font-headline-lg text-headline-lg text-on-surface">
          Pedido nº {enviado.numero} enviado!
        </h1>
        <p className="mt-sm text-body-md text-on-surface-variant">
          Enviamos seu pedido de atacado pelo WhatsApp e a loja já recebeu a
          comanda. Em breve confirmam os valores e combinam a entrega.
        </p>
        <Link
          href="/"
          className="mt-lg rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
        >
          Voltar ao início
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-full pb-28">
      {/* Cabeçalho (igual ao /loja) */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-md py-sm">
          <Link
            href={etapa === "pedido" ? "#" : "/"}
            onClick={(e) => {
              if (etapa === "pedido") {
                e.preventDefault();
                setEtapa("catalogo");
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <span className="font-display text-headline-lg tracking-tight text-primary">
            Atacado
          </span>
          <button
            onClick={() => nItens > 0 && setEtapa("pedido")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
          >
            <span className="material-symbols-outlined">shopping_basket</span>
            {nItens > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary">
                {nItens}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl">
        {produtos.length === 0 ? (
          <div className="px-md pt-lg">
            <div className="flex flex-col items-center rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-lg text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <span className="material-symbols-outlined text-[40px] text-primary/40">
                inventory_2
              </span>
              <p className="mt-md text-body-md text-on-surface-variant">
                O catálogo de atacado está sendo montado. Marque produtos como
                atacado em Produtos → Editar → Atacado.
              </p>
            </div>
          </div>
        ) : etapa === "catalogo" ? (
          <>
            {/* Banner de atacado */}
            <section className="px-md pt-md">
              <div className="flex items-center gap-md rounded-xl bg-gradient-to-r from-primary to-primary-container/40 p-md text-cream-surface">
                <span className="material-symbols-outlined text-[32px]">
                  local_shipping
                </span>
                <div>
                  <p className="font-headline-md text-headline-md">
                    Compra no atacado
                  </p>
                  <p className="text-label-md text-cream-surface/90">
                    Preços por volume — quanto mais, menor o preço por unidade.
                  </p>
                </div>
              </div>
            </section>

            {/* Categorias */}
            <section className="mt-lg">
              <div className="no-scrollbar flex gap-sm overflow-x-auto px-md lg:flex-wrap">
                {["Todos", ...CATEGORIAS.filter((c) =>
                  produtos.some((x) => x.produto.categoria === c)
                )].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-label-md transition-all active:scale-95 ${
                      cat === c
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </section>

            {/* Grade */}
            <section className="mt-lg px-md">
              <div className="grid grid-cols-2 gap-gutter sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {lista.map(({ produto, atacado }) => (
                  <CardAtacado
                    key={produto.id}
                    produto={produto}
                    atacado={atacado}
                    qtd={carrinho[produto.id] ?? 0}
                    onQtd={(q) => setQtd(produto.id, q)}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Etapa: pedido (resumo + cadastro) */
          <div className="px-md pt-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Meu pedido de atacado
            </h2>
            <div className="mt-sm space-y-sm">
              {itens.map((i) => (
                <div
                  key={i.produto.id}
                  className="flex items-center gap-md rounded-xl bg-surface-container-lowest p-sm shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                >
                  <ProdutoImagem
                    src={i.produto.img}
                    alt={i.produto.nome}
                    icone={i.produto.icone}
                    className="h-14 w-14 flex-shrink-0 rounded-lg"
                    iconSize={24}
                  />
                  <div className="min-w-0 flex-grow">
                    <p className="line-clamp-1 text-body-md text-on-surface">
                      {i.produto.nome}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {brl(i.unit)}/{un(i.atacado)} · {brl(i.subtotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQtd(i.produto.id, i.qtd - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-primary active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        remove
                      </span>
                    </button>
                    <input
                      value={i.qtd}
                      onChange={(e) => {
                        const v = parseInt(e.target.value.replace(/\D/g, "")) || 0;
                        setCarrinho((c) => ({ ...c, [i.produto.id]: v }));
                      }}
                      onBlur={() => setQtd(i.produto.id, i.qtd)}
                      inputMode="numeric"
                      className="w-12 rounded-lg border border-outline-variant bg-surface-container-lowest py-1 text-center text-body-md outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => setQtd(i.produto.id, i.qtd + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-primary active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-md flex items-center justify-between rounded-xl bg-cream-surface px-md py-3">
              <span className="text-body-lg text-on-surface">Total</span>
              <span className="font-display text-headline-md text-primary">
                {brl(total)}
              </span>
            </div>

            <h2 className="mt-lg font-headline-md text-headline-md text-on-surface">
              Seus dados
            </h2>
            <div className="mt-sm space-y-sm">
              <div>
                <label className="block text-label-sm text-on-surface-variant">
                  Nome
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome ou da empresa"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant">
                  Telefone (WhatsApp)
                </label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(mascaraTel(e.target.value))}
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra fixa (mini-carrinho / enviar) */}
      {produtos.length > 0 && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-6xl -translate-x-1/2 px-md pb-md">
          {etapa === "catalogo" ? (
            nItens > 0 && (
              <button
                onClick={() => setEtapa("pedido")}
                className="mx-auto flex w-full items-center justify-between gap-md rounded-xl bg-primary px-lg py-3.5 text-on-primary shadow-lg active:scale-[0.99]"
              >
                <span className="flex items-center gap-2 text-body-md font-semibold">
                  <span className="material-symbols-outlined">shopping_basket</span>
                  Ver meu pedido ({nItens})
                </span>
                <span className="text-body-lg font-bold">{brl(total)}</span>
              </button>
            )
          ) : (
            <div className="mx-auto rounded-xl border border-outline-variant/20 bg-surface/95 p-sm backdrop-blur-md">
              <button
                onClick={enviar}
                disabled={!podeEnviar}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-lg py-3.5 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chat</span>
                Enviar pedido pelo WhatsApp
              </button>
              {!zap && (
                <p className="mt-1 text-center text-label-sm text-danger-red">
                  Configure o WhatsApp da loja em Configurações.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function CardAtacado({
  produto,
  atacado,
  qtd,
  onQtd,
}: {
  produto: Produto;
  atacado: Atacado;
  qtd: number;
  onQtd: (q: number) => void;
}) {
  const min = minimoAtacado(atacado);
  const noCarrinho = qtd >= min;
  const unit = precoAtacado(atacado, Math.max(qtd, min));

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <ProdutoImagem
        src={produto.img}
        alt={produto.nome}
        icone={produto.icone}
        className="aspect-square w-full"
      />
      <div className="flex flex-grow flex-col p-sm">
        <h4 className="line-clamp-1 text-label-md text-on-surface">
          {produto.nome}
        </h4>
        <span className="text-caption text-on-surface-variant">
          mín {min} {un(atacado)}
        </span>
        <div className="mt-auto pt-sm">
          <span className="text-caption text-on-surface-variant">a partir de</span>
          <div className="flex items-end justify-between">
            <span className="font-headline-md text-headline-md text-primary">
              {brl(precoEntrada(atacado))}
              <span className="text-caption font-normal text-on-surface-variant">
                /{un(atacado)}
              </span>
            </span>
          </div>

          {noCarrinho ? (
            <div className="mt-sm flex items-center justify-between gap-1">
              <button
                onClick={() => onQtd(qtd - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-primary active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <span className="text-label-md font-semibold text-on-surface">
                {qtd} {un(atacado)}
              </span>
              <button
                onClick={() => onQtd(qtd + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant text-primary active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onQtd(min)}
              className="mt-sm flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-label-md text-on-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Adicionar
            </button>
          )}
          {noCarrinho && (
            <p className="mt-1 text-center text-caption text-on-surface-variant">
              {brl(unit)}/{un(atacado)} · {brl(unit * qtd)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
