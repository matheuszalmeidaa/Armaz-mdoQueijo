"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIAS, brl } from "@/lib/catalogo";

type Faixa = { min: string; kg: string };

export default function NovoProduto() {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [tipo, setTipo] = useState<"peso" | "unidade">("peso");

  // Por peso
  const [precoKg, setPrecoKg] = useState("");
  const [pesos, setPesos] = useState<number[]>([200, 300, 500]);
  const [novoPeso, setNovoPeso] = useState("");
  const [faixas, setFaixas] = useState<Faixa[]>([{ min: "500", kg: "" }]);

  // Por unidade
  const [preco, setPreco] = useState("");

  const [descricao, setDescricao] = useState("");
  const [salvo, setSalvo] = useState(false);

  function addPeso() {
    const g = parseInt(novoPeso);
    if (g > 0 && !pesos.includes(g)) setPesos([...pesos, g].sort((a, b) => a - b));
    setNovoPeso("");
  }

  function publicar() {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  // Preview de preço do menor peso
  const previewPreco =
    tipo === "peso" && precoKg && pesos.length
      ? (Number(precoKg) * Math.min(...pesos)) / 1000
      : tipo === "unidade" && preco
        ? Number(preco)
        : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-lg">
      {/* Cabeçalho */}
      <div className="flex items-center gap-sm">
        <Link
          href="/admin/produtos"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Novo produto
        </h1>
      </div>

      {/* Básico */}
      <Secao titulo="Informações básicas">
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
            <label className="block text-label-md text-on-surface">
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
            >
              {CATEGORIAS.map((c) => (
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
              <BotaoTipo
                ativo={tipo === "peso"}
                onClick={() => setTipo("peso")}
                icone="scale"
                label="Por peso"
              />
              <BotaoTipo
                ativo={tipo === "unidade"}
                onClick={() => setTipo("unidade")}
                icone="package_2"
                label="Por unidade"
              />
            </div>
          </div>
        </div>
      </Secao>

      {/* Preço por peso */}
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

          {/* Pesos oferecidos */}
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
                <button
                  onClick={addPeso}
                  className="material-symbols-outlined text-[18px] text-primary"
                >
                  add_circle
                </button>
              </div>
            </div>
          </div>

          {/* Faixas de desconto */}
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
                  <span className="text-body-md text-on-surface-variant">
                    a partir de
                  </span>
                  <div className="flex w-28 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                    <input
                      value={f.min}
                      onChange={(e) =>
                        setFaixas(
                          faixas.map((x, j) =>
                            j === i ? { ...x, min: e.target.value } : x
                          )
                        )
                      }
                      inputMode="numeric"
                      className="w-full bg-transparent text-body-md outline-none"
                    />
                    <span className="text-label-sm text-on-surface-variant">g</span>
                  </div>
                  <span className="material-symbols-outlined text-outline">
                    arrow_forward
                  </span>
                  <div className="flex w-32 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                    <span className="text-label-sm text-on-surface-variant">R$</span>
                    <input
                      value={f.kg}
                      onChange={(e) =>
                        setFaixas(
                          faixas.map((x, j) =>
                            j === i ? { ...x, kg: e.target.value } : x
                          )
                        )
                      }
                      inputMode="decimal"
                      placeholder="0,00"
                      className="w-full bg-transparent text-body-md outline-none"
                    />
                    <span className="text-label-sm text-on-surface-variant">/kg</span>
                  </div>
                  <button
                    onClick={() => setFaixas(faixas.filter((_, j) => j !== i))}
                    className="material-symbols-outlined text-danger-red"
                  >
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
        </Secao>
      )}

      {/* Descrição */}
      <Secao titulo="Descrição">
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Sobre o produto, origem, sugestão de consumo..."
          className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md outline-none focus:border-primary"
        />
      </Secao>

      {/* Preview + ações */}
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
              Publicado!
            </span>
          )}
          <button className="rounded-lg border border-outline-variant px-lg py-3 text-label-md text-on-surface">
            Salvar rascunho
          </button>
          <button
            onClick={publicar}
            disabled={!nome}
            className="rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
          >
            Publicar produto
          </button>
        </div>
      </div>
      <p className="text-caption text-on-surface-variant">
        * Ainda em maquete — ao ligar o Supabase, publicar cria o produto de
        verdade, disponível no PDV e no delivery na hora.
      </p>
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <h2 className="mb-md font-headline-md text-headline-md text-on-surface">
        {titulo}
      </h2>
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
        {prefixo && (
          <span className="text-body-md text-on-surface-variant">{prefixo}</span>
        )}
        {children}
        {sufixo && (
          <span className="text-body-md text-on-surface-variant">{sufixo}</span>
        )}
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
