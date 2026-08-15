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

function telFmt(t?: string) {
  const d = (t ?? "").replace(/\D/g, "");
  if (d.length < 10) return t ?? "";
  const cel = d.length === 11;
  return `(${d.slice(0, 2)}) ${d.slice(2, cel ? 7 : 6)}-${d.slice(cel ? 7 : 6)}`;
}

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
  agendado?: boolean;
};

export function mensagemPedido(a: Args): string {
  const d = a.dados;
  const R = a.resumo;
  const agora = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const L: string[] = [];

  L.push("🧀 *ARMAZÉM DO QUEIJO*");
  L.push(`Pedido *#${a.numero}* · ${agora}`);
  if (a.agendado) L.push("⏰ *AGENDADO — combinar horário*");
  L.push("");

  // Cliente
  L.push(`👤 *${d.nome ?? "Cliente"}*`);
  if (d.telefone) L.push(`📱 ${telFmt(d.telefone)}`);
  L.push("");

  // Itens
  L.push("🛍️ *Itens*");
  a.itens.forEach((it) => L.push(`• ${it.qtd} · ${it.nome} — ${brl(it.preco)}`));
  L.push("");

  // Entrega ou retirada
  if (d.modo === "retirada") {
    L.push("🏬 *Retirada na loja*");
  } else {
    L.push("🛵 *Entrega*");
    L.push(formatarEndereco(d));
    if (d.geoLink) L.push(`🗺️ ${d.geoLink}`);
  }
  L.push("");

  // Pagamento
  L.push(`💳 *Pagamento:* ${PAG_LABEL[d.pagamento ?? "pix"]}`);
  if (d.pagamento === "dinheiro" && d.trocoPara && d.trocoPara > 0) {
    L.push(`Troco para ${brl(d.trocoPara)} (levar ${brl(Math.max(0, d.trocoPara - R.total))})`);
  }
  if (d.pagamento === "pix" && a.pixChave) L.push(`Chave Pix: ${a.pixChave}`);
  L.push("");

  // Valores
  L.push(`Subtotal: ${brl(R.subtotal)}`);
  if (d.modo !== "retirada")
    L.push(`Entrega: ${R.frete > 0 ? brl(R.frete) : "Grátis"}`);
  if (R.descontoPix > 0) L.push(`Desconto Pix: -${brl(R.descontoPix)}`);
  if (R.descontoCupom > 0)
    L.push(`Cupom ${R.cupom?.codigo ?? ""}: -${brl(R.descontoCupom)}`);
  L.push(`*Total: ${brl(R.total)}*`);

  return L.join("\n");
}

export function linkWhatsApp(numero: string, texto: string): string | null {
  const zap = (numero || "").replace(/\D/g, "");
  if (!zap) return null;
  return `https://wa.me/55${zap}?text=${encodeURIComponent(texto)}`;
}

// WhatsApp sem destinatário: abre o app e o lojista escolhe o contato (motoboy).
export function linkWhatsAppLivre(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

// Comanda a partir de um pedido já registrado (para motoboy / impressão).
type PedidoComanda = {
  numero: string;
  cliente: string;
  telefone?: string;
  modo: "entrega" | "retirada";
  entrega: string;
  pagamento: string;
  itens: { nome: string; qtd: string; preco: number }[];
  total: number;
  agendado?: boolean;
};

export function comandaPedidoLive(p: PedidoComanda): string {
  const L: string[] = [];
  L.push("🧀 *ARMAZÉM DO QUEIJO*");
  L.push(`Comanda *#${p.numero}*`);
  if (p.agendado) L.push("⏰ *AGENDADO — combinar horário*");
  L.push("");
  L.push(`👤 *${p.cliente}*`);
  if (p.telefone) L.push(`📱 ${telFmt(p.telefone)}`);
  L.push(
    p.modo === "retirada"
      ? "🏬 *Retirada na loja*"
      : `🛵 *Entrega:* ${p.entrega}`
  );
  L.push("");
  L.push("🛍️ *Itens*");
  p.itens.forEach((it) => L.push(`• ${it.qtd} · ${it.nome} — ${brl(it.preco)}`));
  L.push("");
  L.push(`💳 ${p.pagamento}`);
  L.push(`*Total: ${brl(p.total)}*`);
  return L.join("\n");
}
