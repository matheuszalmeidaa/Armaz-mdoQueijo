"use client";

import { useUltimoPedido } from "@/lib/pedidos-store";
import { AcompanhamentoView } from "@/components/AcompanhamentoView";

export default function AcompanhamentoPedido() {
  const pedido = useUltimoPedido();
  return <AcompanhamentoView pedido={pedido} />;
}
