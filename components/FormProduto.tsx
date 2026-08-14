"use client";

import Link from "next/link";
import { useState } from "react";
import { CATALOGO, CATEGORIAS, brl, type Produto } from "@/lib/catalogo";

type Faixa = { min: string; kg: string };

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

  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [vinculadoId, setVinculadoId] = useState(inicial?.vinculadoId ?? "");
  const [custo, setCusto] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [salvo, setSalvo] = useState(false);

  function addPeso() {
    const g = parseInt(novoPeso);
    if (g > 0 && !pesos.includes(g)) setPesos([...pesos, g].sort((a, b) => a - b));
    setNovoPeso("");
  }

  function acao() {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2200);
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
          <label className="block text-label-md text-on-surface">Foto</label>
          <button className="mt-1 flex aspect-video w-full max-w-[20rem] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline/40 bg-surface-container-low text-on-surface-variant hover:border-primary/40">
            <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
            <span className="text-label-sm">Adicionar foto</span>
          </button>
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
            <label className="block text-label-md text-on-surface">Categoria</label>
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
            {CATALOGO.filter((p) => p.id !== inicial?.id).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
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
      <p className="text-caption text-on-surface-variant">
        * Maquete — ao ligar o Supabase, salva de verdade e reflete no PDV e no
        delivery na hora.
      </p>
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
