"use client";

// Lojas (multi-loja) — lidas do relacional (/api/lojas, service_role). Base para
// estoque por loja e loja de origem no item do pedido.

import { useCallback, useEffect, useState } from "react";

export type Loja = {
  id: string;
  nome: string;
  aberta: boolean;
  ativa: boolean;
};

export function useLojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semBanco, setSemBanco] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      const res = await fetch("/api/lojas", { cache: "no-store" });
      const j = await res.json();
      setSemBanco(Boolean(j.semBanco));
      setLojas(j.lojas ?? []);
    } catch {
      setLojas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { lojas, carregando, semBanco, recarregar };
}

export async function criarLoja(nome: string) {
  const res = await fetch("/api/lojas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  return res.json();
}

export async function atualizarLoja(
  id: string,
  patch: { nome?: string; aberta?: boolean; ativa?: boolean }
) {
  const res = await fetch(`/api/lojas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}
