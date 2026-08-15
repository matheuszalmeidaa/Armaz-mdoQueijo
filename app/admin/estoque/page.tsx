"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCatalogo } from "@/lib/catalogo-store";
import { useEstoque, salvarSaldo } from "@/lib/estoque-store";
import {
  contarAlertas,
  statusSaldo,
  unidadeDe,
  diasParaVencer,
  type EstoqueMapa,
} from "@/lib/estoque";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export default function AdminEstoque() {
  const catalogo = useCatalogo();
  const mapa = useEstoque();
  const alertas = contarAlertas(mapa);

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Estoque
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Saldo por produto. Sincroniza com o delivery (mostra “Esgotado” quando
            zera) e o PDV.
          </p>
        </div>
        <Link
          href="/admin/estoque/entrada"
          className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary shadow active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">add_box</span>
          Dar entrada
        </Link>
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-3 gap-md">
        <CardAlerta rotulo="Esgotados" valor={alertas.esgotado} cor="text-danger-red" />
        <CardAlerta rotulo="Abaixo do mínimo" valor={alertas.baixo} cor="text-warning-amber" />
        <CardAlerta rotulo="Vencendo (7 dias)" valor={alertas.vencendo} cor="text-secondary" />
      </div>

      {catalogo.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-cream-surface p-lg text-center">
          <p className="text-body-md text-on-surface-variant">
            Nenhum produto no catálogo ainda. Cadastre em{" "}
            <Link href="/admin/produtos/novo" className="text-primary underline">
              Produtos → Novo produto
            </Link>{" "}
            para controlar o estoque.
          </p>
        </div>
      ) : (
        <div className="space-y-sm">
          {catalogo.map((p) => (
            <LinhaProduto key={p.id} produtoId={p.id} nome={p.nome} mapa={mapa} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaProduto({
  produtoId,
  nome,
  mapa,
}: {
  produtoId: string;
  nome: string;
  mapa: EstoqueMapa;
}) {
  const atual = mapa[produtoId] ?? { saldo: 0, min: 0 };
  const un = unidadeDe(produtoId);
  const [saldo, setSaldo] = useState(String(atual.saldo));
  const [min, setMin] = useState(String(atual.min));
  const [validade, setValidade] = useState(atual.validade ?? "");
  const [salvo, setSalvo] = useState(false);

  // Reflete atualizações vindas de outro aparelho (a menos que esteja editando).
  useEffect(() => {
    setSaldo(String(atual.saldo));
    setMin(String(atual.min));
    setValidade(atual.validade ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atual.saldo, atual.min, atual.validade]);

  const st = statusSaldo({ saldo: num(saldo), min: num(min) });
  const dias = diasParaVencer(validade || undefined);
  const corStatus =
    st === "esgotado"
      ? "bg-error-container text-on-error-container"
      : st === "baixo"
        ? "bg-warning-amber/20 text-secondary"
        : "bg-tertiary-container/30 text-tertiary";
  const rotStatus = st === "esgotado" ? "Esgotado" : st === "baixo" ? "Baixo" : "OK";

  function salvar() {
    salvarSaldo(produtoId, {
      saldo: num(saldo),
      min: num(min),
      validade: validade || undefined,
    });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 1500);
  }

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-end gap-md">
        <div className="min-w-[10rem] flex-grow">
          <p className="font-medium text-on-surface">{nome}</p>
          <span
            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm ${corStatus}`}
          >
            {rotStatus}
            {dias !== null && dias <= 7 && num(saldo) > 0 && (
              <span className="text-label-sm">
                · vence em {dias}d
              </span>
            )}
          </span>
        </div>
        <CampoNum rotulo={`Saldo (${un})`} valor={saldo} onChange={setSaldo} />
        <CampoNum rotulo={`Mínimo (${un})`} valor={min} onChange={setMin} />
        <div>
          <label className="block text-label-sm text-on-surface-variant">
            Validade
          </label>
          <input
            type="date"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
            className="mt-1 w-40 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={salvar}
          className="rounded-lg border border-outline-variant px-md py-2 text-label-md text-primary active:scale-95"
        >
          {salvo ? "Salvo!" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function CampoNum({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-label-sm text-on-surface-variant">{rotulo}</label>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="mt-1 w-24 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
      />
    </div>
  );
}

function CardAlerta({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md text-center shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <p className={`font-display text-headline-lg ${cor}`}>{valor}</p>
      <p className="text-label-sm text-on-surface-variant">{rotulo}</p>
    </div>
  );
}
