"use client";

import { useState } from "react";

// --- Dados de exemplo (viriam da espinha: produtos + faixas_preco) ---
const produto = {
  nome: "Queijo Figueira — Meia Cura",
  produtor: "Queijaria Bela Vista",
  categoria: "Queijos de Vaca",
  pesos: [200, 300, 400, 500, 750, 1000], // presets em gramas
  // Faixas de preço por volume (maior faixa cujo peso_min <= escolhido)
  faixas: [
    { min: 200, kg: 411 },
    { min: 500, kg: 385 },
    { min: 1000, kg: 360 },
  ],
};

function precoPorKg(pesoG: number) {
  return produto.faixas
    .filter((f) => pesoG >= f.min)
    .reduce((maior, f) => (f.min > maior.min ? f : maior), produto.faixas[0])
    .kg;
}

const precoBaseKg = produto.faixas[0].kg;
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const gramas = (g: number) => (g >= 1000 ? `${g / 1000}kg` : `${g}g`);

export default function ProdutoPage() {
  const [peso, setPeso] = useState(300);

  const kg = precoPorKg(peso);
  const total = (kg * peso) / 1000;
  const economia = ((precoBaseKg - kg) * peso) / 1000;

  // Próxima faixa: quanto falta para economizar mais (o gatilho de ticket)
  const proxima = produto.faixas.find((f) => f.min > peso);
  const dicaProxima =
    proxima &&
    (() => {
      const totalProx = (proxima.kg * proxima.min) / 1000;
      const economiaProx = ((precoBaseKg - proxima.kg) * proxima.min) / 1000;
      return { peso: proxima.min, total: totalProx, economia: economiaProx };
    })();

  return (
    <main className="mx-auto min-h-full max-w-md pb-32">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="font-display text-headline-md text-primary">
          Fusqueijão
        </span>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95">
          <span className="material-symbols-outlined">shopping_basket</span>
        </button>
      </header>

      {/* Imagem (placeholder com a paleta da marca) */}
      <div className="relative m-md flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-secondary-container to-primary-container/30">
        <span className="material-symbols-outlined text-[96px] text-primary/40">
          nutrition
        </span>
        <span className="absolute left-3 top-3 rounded-full bg-warning-amber px-3 py-1 text-label-sm font-semibold text-on-secondary-fixed">
          Corte na hora
        </span>
      </div>

      <div className="px-md">
        <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
          {produto.categoria} · {produto.produtor}
        </p>
        <h1 className="mt-xs font-headline-lg text-headline-lg leading-tight text-on-surface">
          {produto.nome}
        </h1>
        <p className="mt-sm text-body-md text-on-surface-variant">
          {brl(kg)}<span className="text-on-surface-variant">/kg</span>
          {kg < precoBaseKg && (
            <span className="ml-2 text-label-sm text-tertiary">
              (desconto de volume aplicado)
            </span>
          )}
        </p>

        {/* Seletor de peso — presets, sem digitação */}
        <div className="mt-lg">
          <div className="mb-sm flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-primary">
              Escolha o peso
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              aproximado (±)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-sm">
            {produto.pesos.map((g) => {
              const ativo = g === peso;
              const temDesconto = precoPorKg(g) < precoBaseKg;
              return (
                <button
                  key={g}
                  onClick={() => setPeso(g)}
                  className={`relative flex flex-col items-center rounded-lg border py-3 transition-all active:scale-95 ${
                    ativo
                      ? "border-primary bg-primary text-on-primary shadow-md"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  }`}
                >
                  <span className="text-body-lg font-semibold">
                    {gramas(g)}
                  </span>
                  <span
                    className={`text-label-sm ${
                      ativo ? "text-primary-fixed" : "text-on-surface-variant"
                    }`}
                  >
                    {brl((precoPorKg(g) * g) / 1000)}
                  </span>
                  {temDesconto && (
                    <span className="absolute -right-1 -top-2 rounded-full bg-tertiary px-1.5 py-0.5 text-[10px] font-semibold text-on-tertiary">
                      %
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Economia visível — o gatilho de ticket */}
        {economia > 0 && (
          <div className="mt-md flex items-center gap-sm rounded-lg bg-tertiary-container/40 px-md py-3">
            <span className="material-symbols-outlined text-tertiary">
              savings
            </span>
            <span className="text-body-md text-on-surface">
              Você está economizando{" "}
              <strong className="text-tertiary">{brl(economia)}</strong> nesse
              peso.
            </span>
          </div>
        )}

        {/* Gatilho para a próxima faixa */}
        {dicaProxima && dicaProxima.economia > economia && (
          <button
            onClick={() => setPeso(dicaProxima.peso)}
            className="mt-sm flex w-full items-center justify-between rounded-lg border border-dashed border-secondary/50 bg-cream-surface px-md py-3 text-left active:scale-[0.99]"
          >
            <span className="text-body-md text-on-surface">
              Leve <strong>{gramas(dicaProxima.peso)}</strong> e economize{" "}
              <strong className="text-secondary">
                {brl(dicaProxima.economia)}
              </strong>
            </span>
            <span className="material-symbols-outlined text-secondary">
              chevron_right
            </span>
          </button>
        )}
      </div>

      {/* Barra fixa de adicionar */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md glass-nav">
        <button className="flex w-full items-center justify-between rounded-lg bg-primary px-lg py-4 text-on-primary shadow-lg transition-transform active:scale-[0.98]">
          <span className="flex items-center gap-2 text-body-lg font-semibold">
            <span className="material-symbols-outlined">add_shopping_cart</span>
            Adicionar · {gramas(peso)}
          </span>
          <span className="font-headline-md text-headline-md">{brl(total)}</span>
        </button>
      </div>
    </main>
  );
}
