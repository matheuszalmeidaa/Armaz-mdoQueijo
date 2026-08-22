"use client";

import { useState } from "react";
import { useLojas, criarLoja, atualizarLoja } from "@/lib/lojas-store";

export default function AdminLojas() {
  const { lojas, carregando, semBanco, recarregar } = useLojas();
  const [nova, setNova] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function adicionar() {
    const nome = nova.trim();
    if (!nome) return;
    setSalvando(true);
    await criarLoja(nome);
    setNova("");
    setSalvando(false);
    recarregar();
  }

  return (
    <div className="mx-auto max-w-[44rem] space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">Lojas</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Cadastre suas lojas. O estoque e a origem de cada item do pedido são
          controlados por loja.
        </p>
      </div>

      {semBanco && (
        <div className="rounded-xl border border-warning-amber/50 bg-warning-amber/10 p-md text-body-md text-on-surface-variant">
          Banco não configurado (service_role). Configure na Vercel para gerenciar
          as lojas.
        </div>
      )}

      {/* Adicionar */}
      <div className="flex gap-sm rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <input
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
          placeholder="Nome da loja (ex.: Loja Centro)"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
        />
        <button
          onClick={adicionar}
          disabled={salvando || !nova.trim()}
          className="flex items-center gap-1 rounded-lg bg-primary px-md py-2.5 text-label-md text-on-primary active:scale-[0.98] disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Adicionar
        </button>
      </div>

      {carregando ? (
        <p className="text-body-md text-on-surface-variant">Carregando...</p>
      ) : lojas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-lg text-center text-body-md text-on-surface-variant">
          Nenhuma loja cadastrada. Adicione a primeira acima.
        </div>
      ) : (
        <div className="space-y-sm">
          {lojas.map((l) => (
            <LinhaLoja key={l.id} loja={l} onMudou={recarregar} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaLoja({
  loja,
  onMudou,
}: {
  loja: { id: string; nome: string; aberta: boolean; ativa: boolean };
  onMudou: () => void;
}) {
  const [nome, setNome] = useState(loja.nome);
  const [editando, setEditando] = useState(false);

  async function salvarNome() {
    setEditando(false);
    if (nome.trim() && nome.trim() !== loja.nome) {
      await atualizarLoja(loja.id, { nome: nome.trim() });
      onMudou();
    }
  }

  return (
    <div className="flex items-center gap-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <span className="material-symbols-outlined text-secondary">storefront</span>
      {editando ? (
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={salvarNome}
          onKeyDown={(e) => e.key === "Enter" && salvarNome()}
          autoFocus
          className="flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-body-lg outline-none focus:border-primary"
        />
      ) : (
        <button
          onClick={() => setEditando(true)}
          className="flex-grow text-left text-body-lg text-on-surface"
        >
          {loja.nome}
        </button>
      )}
      <button
        onClick={async () => {
          await atualizarLoja(loja.id, { aberta: !loja.aberta });
          onMudou();
        }}
        className={`rounded-full px-3 py-1 text-label-sm ${
          loja.aberta
            ? "bg-tertiary-container/40 text-tertiary"
            : "bg-error-container text-on-error-container"
        }`}
      >
        {loja.aberta ? "Aberta" : "Fechada"}
      </button>
      <button
        onClick={async () => {
          if (confirm(`Arquivar a loja "${loja.nome}"?`)) {
            await atualizarLoja(loja.id, { ativa: false });
            onMudou();
          }
        }}
        className="material-symbols-outlined text-danger-red"
        title="Arquivar loja"
      >
        archive
      </button>
    </div>
  );
}
