"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useConfig } from "@/lib/config-store";
import { useCatalogo, useCfgMapa } from "@/lib/catalogo-store";
import {
  brl,
  precoAtacado,
  minimoAtacado,
  type Produto,
  type Atacado,
} from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/pedido-msg";
import { ProdutoImagem } from "@/components/ProdutoImagem";

type ItemAtacado = {
  produto: Produto;
  atacado: Atacado;
  qtd: number;
  unit: number;
  subtotal: number;
};

const un = (a: Atacado) => (a.unidade === "kg" ? "kg" : "pç");

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

  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [etapa, setEtapa] = useState<"catalogo" | "cadastro">("catalogo");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enviado, setEnviado] = useState(false);

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

  // Itens do carrinho com preço/subtotal calculados pela faixa.
  const itens: ItemAtacado[] = useMemo(() => {
    const out: ItemAtacado[] = [];
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
  const zap = cfg.whatsapp.replace(/\D/g, "");

  function setQtd(p: Produto, a: Atacado, qtd: number) {
    const min = minimoAtacado(a);
    setCarrinho((c) => {
      const nc = { ...c };
      if (qtd < min) delete nc[p.id];
      else nc[p.id] = qtd;
      return nc;
    });
  }

  function enviarWhatsApp() {
    const linhas = itens.map(
      (i) =>
        `• ${i.produto.nome} — ${i.qtd} ${un(i.atacado)} × ${brl(i.unit)}/${un(
          i.atacado
        )} = ${brl(i.subtotal)}`
    );
    const texto =
      `*PEDIDO DE ATACADO — Armazém do Queijo*\n` +
      `👤 ${nome.trim()} — ${telefone.trim()}\n\n` +
      `🛒 *Itens:*\n${linhas.join("\n")}\n\n` +
      `*Total: ${brl(total)}*`;
    const link = linkWhatsApp(cfg.whatsapp, texto);
    if (!link) return; // sem WhatsApp configurado não marca como enviado
    window.open(link, "_blank");
    setEnviado(true);
  }

  const telValido = telefone.replace(/\D/g, "").length >= 10;
  const podeEnviar =
    nome.trim().length > 1 && telValido && nItens > 0 && Boolean(zap);

  return (
    <main className="mx-auto min-h-dvh max-w-[32rem] pb-28">
      <header className="sticky top-0 z-50 flex items-center gap-sm border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href={etapa === "cadastro" ? "#" : "/"}
          onClick={(e) => {
            if (etapa === "cadastro") {
              e.preventDefault();
              setEtapa("catalogo");
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-display text-headline-md text-primary">
          Atacado{etapa === "cadastro" ? " · seus dados" : ""}
        </span>
      </header>

      {/* Catálogo vazio */}
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
        <div className="px-md pt-lg">
          <p className="mb-md text-body-md text-on-surface-variant">
            Preços por volume — escolha a quantidade e o preço se ajusta. Depois é
            só informar nome e telefone.
          </p>
          <div className="space-y-md">
            {produtos.map(({ produto, atacado }) => (
              <CardAtacado
                key={produto.id}
                produto={produto}
                atacado={atacado}
                qtd={carrinho[produto.id] ?? 0}
                onQtd={(q) => setQtd(produto, atacado, q)}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Cadastro + resumo */
        <div className="px-md pt-lg">
          {enviado ? (
            <div className="flex flex-col items-center rounded-2xl border border-tertiary/30 bg-tertiary-container/15 p-lg text-center">
              <span className="material-symbols-outlined text-[40px] text-tertiary">
                check_circle
              </span>
              <p className="mt-md text-body-lg text-on-surface">
                Pedido enviado no WhatsApp!
              </p>
              <p className="mt-1 text-body-md text-on-surface-variant">
                A loja vai confirmar os valores e combinar a entrega com você.
              </p>
              <Link
                href="/"
                className="mt-lg text-label-md text-primary underline"
              >
                Voltar ao início
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                Resumo do pedido
              </h2>
              <div className="mt-sm space-y-1 rounded-xl bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                {itens.map((i) => (
                  <div
                    key={i.produto.id}
                    className="flex items-center justify-between text-body-md"
                  >
                    <span className="text-on-surface">
                      {i.produto.nome}{" "}
                      <span className="text-on-surface-variant">
                        ({i.qtd} {un(i.atacado)})
                      </span>
                    </span>
                    <span className="text-on-surface-variant">{brl(i.subtotal)}</span>
                  </div>
                ))}
                <div className="mt-sm flex items-center justify-between border-t border-outline-variant/20 pt-sm font-semibold">
                  <span className="text-on-surface">Total</span>
                  <span className="text-primary">{brl(total)}</span>
                </div>
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
            </>
          )}
        </div>
      )}

      {/* Barra fixa */}
      {produtos.length > 0 && !enviado && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[32rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
          {etapa === "catalogo" ? (
            <button
              onClick={() => setEtapa("cadastro")}
              disabled={nItens === 0}
              className="flex w-full items-center justify-between rounded-lg bg-primary px-lg py-3.5 text-on-primary shadow-lg active:scale-[0.99] disabled:opacity-40"
            >
              <span className="text-body-md font-semibold">
                {nItens === 0
                  ? "Escolha os produtos"
                  : `Continuar (${nItens} ${nItens === 1 ? "item" : "itens"})`}
              </span>
              <span className="text-body-lg font-bold">{brl(total)}</span>
            </button>
          ) : (
            <button
              onClick={enviarWhatsApp}
              disabled={!podeEnviar}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-lg py-3.5 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
            >
              <span className="material-symbols-outlined">chat</span>
              Enviar pedido no WhatsApp
            </button>
          )}
          {etapa === "cadastro" && !zap && (
            <p className="mt-1 text-center text-label-sm text-danger-red">
              Configure o WhatsApp da loja em Configurações.
            </p>
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
  const unit = precoAtacado(atacado, Math.max(qtd, min));
  const noCarrinho = qtd >= min;

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-md">
        <ProdutoImagem
          src={produto.img}
          alt={produto.nome}
          icone={produto.icone}
          className="h-20 w-20 flex-shrink-0 rounded-lg"
          iconSize={32}
        />
        <div className="min-w-0 flex-grow">
          <p className="font-headline-md text-headline-md text-on-surface">
            {produto.nome}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            Mínimo {min} {un(atacado)}
          </p>
          {/* Faixas de preço */}
          <div className="mt-sm space-y-0.5">
            {[...atacado.faixas]
              .sort((a, b) => a.min - b.min)
              .map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-label-sm"
                >
                  <span className="text-on-surface-variant">
                    a partir de {f.min} {un(atacado)}
                  </span>
                  <span className="font-medium text-primary">
                    {brl(f.preco)}/{un(atacado)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Controles de quantidade */}
      <div className="mt-md flex items-center justify-between">
        {noCarrinho ? (
          <div className="flex items-center gap-sm">
            <button
              onClick={() => onQtd(qtd - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">remove</span>
            </button>
            <span className="min-w-[4rem] text-center text-body-lg font-semibold text-on-surface">
              {qtd} {un(atacado)}
            </span>
            <button
              onClick={() => onQtd(qtd + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onQtd(min)}
            className="flex items-center gap-1 rounded-lg bg-primary px-md py-2 text-label-md text-on-primary active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar ({min} {un(atacado)})
          </button>
        )}
        {noCarrinho && (
          <div className="text-right">
            <p className="text-label-sm text-on-surface-variant">
              {brl(unit)}/{un(atacado)}
            </p>
            <p className="text-body-lg font-bold text-primary">
              {brl(unit * qtd)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
