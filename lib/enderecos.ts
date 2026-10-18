"use client";

// Endereços salvos do cliente (neste aparelho). Permite escolher um já
// cadastrado no checkout em vez de digitar tudo de novo.

import { useEffect, useState } from "react";

export type EnderecoSalvo = {
  id: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  referencia?: string;
  geoLink?: string;
};

const KEY = "armazem-enderecos";
const EVT = "enderecos-change";

function chave(e: Pick<EnderecoSalvo, "rua" | "numero" | "bairro">) {
  return `${e.rua}|${e.numero}|${e.bairro}`.toLowerCase().trim();
}

export function lerEnderecos(): EnderecoSalvo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EnderecoSalvo[]) : [];
  } catch {
    return [];
  }
}

function persistir(lista: EnderecoSalvo[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lista));
    window.dispatchEvent(new Event(EVT));
  } catch {}
}

// Salva (ou atualiza, se já existir o mesmo rua+número+bairro). Volta para o topo.
export function salvarEndereco(e: Omit<EnderecoSalvo, "id">): EnderecoSalvo {
  const atual = lerEnderecos();
  const k = chave(e);
  const existente = atual.find((x) => chave(x) === k);
  const salvo: EnderecoSalvo = { id: existente?.id ?? crypto.randomUUID(), ...e };
  const nova = [salvo, ...atual.filter((x) => chave(x) !== k)].slice(0, 8);
  persistir(nova);
  return salvo;
}

export function removerEndereco(id: string) {
  persistir(lerEnderecos().filter((x) => x.id !== id));
}

export function useEnderecos(): EnderecoSalvo[] {
  const [lista, setLista] = useState<EnderecoSalvo[]>([]);
  useEffect(() => {
    const ler = () => setLista(lerEnderecos());
    ler();
    window.addEventListener(EVT, ler);
    window.addEventListener("storage", ler);
    return () => {
      window.removeEventListener(EVT, ler);
      window.removeEventListener("storage", ler);
    };
  }, []);
  return lista;
}
