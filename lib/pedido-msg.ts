// Monta a mensagem do pedido para enviar ao WhatsApp da loja e o link wa.me.
// É assim que o pedido "chega na loja" hoje (sem backend).

import type { DadosCheckout } from "./cart";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PAG_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão (maquineta)",
  dinheiro: "Dinheiro",
};

export function formatarEndereco(d: DadosCheckout): string {
  if (d.modo === "retirada") return "";
  const linha1 = [d.rua, d.numero].filter(Boolean).join(", ");
  const base = [linha1, d.complemento, d.bairro].filter(Boolean).join(" — ");
  const ref = d.referencia ? ` (ref: ${d.referencia})` : "";
  return (base + ref).trim() || (d.endereco ?? "");
}

type Args = {
  numero: string;
  dados: DadosCheckout;
  itens: { nome: string; qtd: string; preco: number }[];
  resumo: {
    subtotal: number;
    frete: number;
    descontoPix: number;
    descontoCupom: number;
    total: number;
    cupom?: { codigo: string } | null;
  };
  pixChave?: string;
  lojaRetiradaNome?: string;
};

export function mensagemPedido(a: Args): string {
  const d = a.dados;
  const L: string[] = [];
  L.push(`*Novo pedido #${a.numero}* — Armazém do Queijo`);
  L.push("");
  L.push(`*Cliente:* ${d.nome ?? "-"}`);
  if (d.telefone) L.push(`*WhatsApp:* ${d.telefone}`);
  if (d.modo === "retirada") {
    L.push(`*Retirada:* ${a.lojaRetiradaNome ?? "na loja"}`);
  } else {
    L.push(`*Entrega:* ${formatarEndereco(d)}`);
  }
  L.push("");
  L.push("*Itens:*");
  a.itens.forEach((it) => L.push(`• ${it.qtd} — ${it.nome} — ${brl(it.preco)}`));
  L.push("");
  L.push(`Subtotal: ${brl(a.resumo.subtotal)}`);
  if (d.modo !== "retirada")
    L.push(`Entrega: ${a.resumo.frete > 0 ? brl(a.resumo.frete) : "Grátis"}`);
  if (a.resumo.descontoPix > 0) L.push(`Desconto Pix: -${brl(a.resumo.descontoPix)}`);
  if (a.resumo.descontoCupom > 0)
    L.push(`Cupom ${a.resumo.cupom?.codigo ?? ""}: -${brl(a.resumo.descontoCupom)}`);
  L.push(`*Total: ${brl(a.resumo.total)}*`);
  L.push("");
  L.push(`*Pagamento:* ${PAG_LABEL[d.pagamento ?? "pix"]}`);
  if (d.pagamento === "dinheiro" && d.trocoPara && d.trocoPara > 0) {
    const troco = Math.max(0, d.trocoPara - a.resumo.total);
    L.push(`Troco para ${brl(d.trocoPara)} (levar ${brl(troco)})`);
  }
  if (d.pagamento === "pix" && a.pixChave) L.push(`Chave Pix: ${a.pixChave}`);
  return L.join("\n");
}

export function linkWhatsApp(numero: string, texto: string): string | null {
  const zap = (numero || "").replace(/\D/g, "");
  if (!zap) return null;
  return `https://wa.me/55${zap}?text=${encodeURIComponent(texto)}`;
}
