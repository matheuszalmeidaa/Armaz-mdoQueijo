"use client";

import { brl } from "@/lib/catalogo";
import type { PedidoLive } from "@/lib/pedidos-store";
import {
  dataHora,
  pagamentoDe,
  PAGAMENTO_CHIP,
  PAGAMENTO_LABEL,
  resumoItens,
} from "@/lib/pedido-ui";

// Card com prévia inteligente do pedido. `maxItens` controla quantos itens
// mostrar antes do "+ X outros" (menor em telas apertadas).
export function CardPedido({
  pedido,
  onClick,
  maxItens = 3,
  novo = false,
}: {
  pedido: PedidoLive;
  onClick: () => void;
  maxItens?: number;
  novo?: boolean;
}) {
  const pg = pagamentoDe(pedido);
  const { linhas, extra } = resumoItens(pedido.itens, maxItens);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border bg-surface-container-lowest p-sm text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:border-primary/40 active:scale-[0.99] ${
        novo
          ? "border-primary/50 ring-1 ring-primary/30"
          : "border-outline-variant/10"
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-label-md font-semibold text-primary">
          #{pedido.numero}
        </span>
        <span
          className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PAGAMENTO_CHIP[pg]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {PAGAMENTO_LABEL[pg]}
        </span>
      </div>

      <p className="mt-0.5 line-clamp-1 text-body-md font-medium text-on-surface">
        {pedido.cliente}
      </p>

      {/* Prévia dos itens */}
      <div className="mt-1 space-y-0.5">
        {linhas.map((l, i) => (
          <p key={i} className="line-clamp-1 text-caption text-on-surface-variant">
            {l}
          </p>
        ))}
        {extra > 0 && (
          <p className="text-caption font-medium text-secondary">
            + {extra} {extra === 1 ? "produto" : "produtos"}
          </p>
        )}
        {linhas.length === 0 && (
          <p className="text-caption text-on-surface-variant">Sem itens</p>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between border-t border-outline-variant/15 pt-1.5">
        <span className="text-caption text-on-surface-variant">
          {dataHora(pedido.criadoEm)}
        </span>
        <span className="font-headline-md text-headline-md text-primary">
          {brl(pedido.total)}
        </span>
      </div>
    </button>
  );
}
