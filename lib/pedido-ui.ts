// Helpers de UI compartilhados entre Recebimento (Kanban) e Pedidos (lista).
// Sem JSX — só constantes e funções puras.

import type { PedidoLive, StatusLive, ItemLive } from "./pedidos-store";

export const LABEL_STATUS: Record<StatusLive, string> = {
  Novo: "Novo",
  Preparando: "Separado",
  "Em rota": "Em rota",
  Entregue: "Entregue",
};

export const STATUS_CHIP: Record<StatusLive, string> = {
  Novo: "bg-error-container text-on-error-container",
  Preparando: "bg-warning-amber/20 text-secondary",
  "Em rota": "bg-primary-container/15 text-primary",
  Entregue: "bg-tertiary-container/40 text-tertiary",
};

export const COLUNAS = [
  "ATACADO",
  "RETIRADA",
  "PEDIDO NOVO",
  "SEPARADO",
  "EM ROTA",
  "ENTREGUE",
] as const;
export type Coluna = (typeof COLUNAS)[number];

// A qual coluna operacional o pedido pertence.
export function colunaDe(p: PedidoLive): Coluna {
  if (p.status === "Entregue") return "ENTREGUE";
  if (p.canal === "Atacado") return "ATACADO";
  if (p.modo === "retirada") return "RETIRADA";
  if (p.status === "Novo") return "PEDIDO NOVO";
  if (p.status === "Preparando") return "SEPARADO";
  if (p.status === "Em rota") return "EM ROTA";
  return "PEDIDO NOVO";
}

export function tipoDe(p: PedidoLive): "Atacado" | "Retirada" | "Delivery" {
  if (p.canal === "Atacado") return "Atacado";
  if (p.modo === "retirada") return "Retirada";
  return "Delivery";
}

// Próximo passo do fluxo conforme o TIPO do pedido. Retirada/Atacado não passam
// por "Em rota" — vão de Separado direto para concluído.
export function proximoPasso(
  p: PedidoLive
): { status: StatusLive; label: string } | null {
  const t = tipoDe(p);
  if (p.status === "Novo")
    return { status: "Preparando", label: "Marcar como separado" };
  if (p.status === "Preparando") {
    if (t === "Delivery") return { status: "Em rota", label: "Enviar para rota" };
    if (t === "Retirada")
      return { status: "Entregue", label: "Marcar como retirado" };
    return { status: "Entregue", label: "Marcar como concluído" }; // Atacado
  }
  if (p.status === "Em rota")
    return { status: "Entregue", label: "Marcar como entregue" };
  return null;
}

export function ehHoje(ms: number): boolean {
  const d = new Date(ms);
  const h = new Date();
  return (
    d.getFullYear() === h.getFullYear() &&
    d.getMonth() === h.getMonth() &&
    d.getDate() === h.getDate()
  );
}

export function dataHora(ms: number): string {
  const hora = new Date(ms).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (ehHoje(ms)) return `Hoje • ${hora}`;
  const dia = new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${dia} • ${hora}`;
}

export function dataHoraCompleta(ms: number): string {
  return new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type Pagamento = "pago" | "parcial" | "pendente";
export function pagamentoDe(p: PedidoLive): Pagamento {
  return p.pagoStatus ?? (p.pago ? "pago" : "pendente");
}
export const PAGAMENTO_CHIP: Record<Pagamento, string> = {
  pago: "bg-tertiary-container/40 text-tertiary",
  parcial: "bg-warning-amber/20 text-secondary",
  pendente: "bg-error-container text-on-error-container",
};
export const PAGAMENTO_LABEL: Record<Pagamento, string> = {
  pago: "Pago",
  parcial: "Parcial",
  pendente: "Pendente",
};

// Prévia inteligente dos itens: mostra até `max` e resume o resto.
export function resumoItens(
  itens: ItemLive[],
  max = 3
): { linhas: string[]; extra: number } {
  const linhas = itens.slice(0, max).map((it) => `${it.nome} — ${it.qtd}`);
  return { linhas, extra: Math.max(0, itens.length - max) };
}
