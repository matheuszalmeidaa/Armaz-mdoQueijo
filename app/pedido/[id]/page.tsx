"use client";

import { use } from "react";
import { usePedidoPorId } from "@/lib/pedidos-store";
import { AcompanhamentoView } from "@/components/AcompanhamentoView";

export default function AcompanhamentoPorId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { pedido, carregando } = usePedidoPorId(id);
  return <AcompanhamentoView pedido={pedido} carregando={carregando} />;
}
