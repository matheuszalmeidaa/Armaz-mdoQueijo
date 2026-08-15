"use client";

// Config por produto (vídeo e variantes) — agora vive junto do catálogo no
// Supabase (lib/catalogo-store). Este arquivo mantém a API antiga para as telas
// que já a usam (FormProduto, produto/[id]).

export type { Variante, ProdutoCfg } from "./catalogo";
export {
  lerCfg as lerProdutoCfg,
  salvarCfg as salvarProdutoCfg,
  useProdutoCfg,
} from "./catalogo-store";
