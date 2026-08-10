"use client";

import { useState } from "react";
import { brl } from "@/lib/catalogo";

type Status =
  | "Novo"
  | "Aceito"
  | "Preparando"
  | "Em rota"
  | "Entregue"
  | "Concluído";

type ItemPedido = { nome: string; qtd: string; preco: number };

type Pedido = {
  id: string;
  cliente: string;
  telefone: string;
  canal: "Delivery" | "PDV";
  loja: "Centro" | "Bairro";
  status: Status;
  hora: string;
  pagamento: string;
  entrega: string; // endereço ou "Balcão" / "Retirada — Loja X"
  frete: number;
  itens: ItemPedido[];
};

const STATUS_CHIP: Record<Status, string> = {
  Novo: "bg-error-container text-on-error-container",
  Aceito: "bg-secondary-container text-on-secondary-container",
  Preparando: "bg-warning-amber/20 text-secondary",
  "Em rota": "bg-primary-container/15 text-primary",
  Entregue: "bg-tertiary-container/40 text-tertiary",
  Concluído: "bg-surface-container text-on-surface-variant",
};

const PEDIDOS: Pedido[] = [
  {
    id: "#8421", cliente: "Mariana Silveira", telefone: "(73) 99811-2345",
    canal: "Delivery", loja: "Centro", status: "Preparando", hora: "12:34",
    pagamento: "Pix", entrega: "Rua das Flores, 45 — Centro", frete: 8,
    itens: [
      { nome: "Queijo Figueira — Meia Cura", qtd: "300g", preco: 123.3 },
      { nome: "Geleia de Amora Artesanal", qtd: "1 un", preco: 28.5 },
    ],
  },
  {
    id: "#8420", cliente: "João Carlos Ramos", telefone: "(73) 99822-4455",
    canal: "Delivery", loja: "Bairro", status: "Em rota", hora: "12:20",
    pagamento: "Cartão de Crédito", entrega: "Av. da Roça, 890 — Jardim das Flores", frete: 12,
    itens: [{ nome: "Gouda Pesto Verde", qtd: "200g", preco: 82.0 }],
  },
  {
    id: "#8419", cliente: "Balcão", telefone: "—",
    canal: "PDV", loja: "Centro", status: "Concluído", hora: "12:15",
    pagamento: "Dinheiro", entrega: "Balcão — Loja Centro", frete: 0,
    itens: [{ nome: "Queijo Borbinha", qtd: "200g", preco: 53.6 }],
  },
  {
    id: "#8418", cliente: "Roberto Oliveira", telefone: "(73) 99833-6677",
    canal: "Delivery", loja: "Centro", status: "Novo", hora: "12:10",
    pagamento: "Pix", entrega: "Rua Cemitério, 110 — Itabuna", frete: 18,
    itens: [
      { nome: "Tábua de Frios Premium", qtd: "1 un", preco: 124.9 },
      { nome: "Mel de Florada Silvestre", qtd: "2 un", preco: 64.0 },
    ],
  },
  {
    id: "#8417", cliente: "Ana Paula Mendes", telefone: "(73) 99866-3344",
    canal: "Delivery", loja: "Bairro", status: "Entregue", hora: "11:52",
    pagamento: "Pix", entrega: "Retirada — Loja Bairro", frete: 0,
    itens: [{ nome: "Queijo Morro Azul com Trufas", qtd: "120g", preco: 64.8 }],
  },
  {
    id: "#8416", cliente: "Balcão", telefone: "—",
    canal: "PDV", loja: "Bairro", status: "Concluído", hora: "11:40",
    pagamento: "Débito", entrega: "Balcão — Loja Bairro", frete: 0,
    itens: [
      { nome: "Mix de Defumados", qtd: "1 un", preco: 68.0 },
      { nome: "Mel de Florada Silvestre", qtd: "2 un", preco: 64.0 },
    ],
  },
  {
    id: "#8415", cliente: "Carlos Nunes", telefone: "(73) 99844-8899",
    canal: "Delivery", loja: "Centro", status: "Aceito", hora: "11:31",
    pagamento: "Cartão de Crédito", entrega: "Rua Nova, 12 — Centro", frete: 8,
    itens: [{ nome: "Queijo Figueira — Meia Cura", qtd: "100g", preco: 41.1 }],
  },
];

const CANAIS = ["Todos", "Delivery", "PDV"] as const;

const subtotalDe = (p: Pedido) => p.itens.reduce((s, i) => s + i.preco, 0);
const totalDe = (p: Pedido) => subtotalDe(p) + p.frete;

export default function AdminPedidos() {
  const [canal, setCanal] = useState<(typeof CANAIS)[number]>("Todos");
  const [sel, setSel] = useState<Pedido | null>(null);

  const lista =
    canal === "Todos" ? PEDIDOS : PEDIDOS.filter((p) => p.canal === canal);
  const totalDia = PEDIDOS.reduce((s, p) => s + totalDe(p), 0);

  return (
    <div className="space-y-lg">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">
            Pedidos
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {PEDIDOS.length} pedidos hoje · {brl(totalDia)} — delivery e PDV.
          </p>
        </div>
        <div className="flex rounded-lg border border-outline-variant p-1">
          {CANAIS.map((c) => (
            <button
              key={c}
              onClick={() => setCanal(c)}
              className={`rounded-md px-4 py-1.5 text-label-md transition-colors ${
                canal === c ? "bg-primary text-on-primary" : "text-on-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-lg lg:flex-row">
        {/* Lista */}
        <div
          className={
            sel
              ? "hidden lg:block lg:w-[360px] lg:flex-shrink-0"
              : "w-full"
          }
        >
          <div className="space-y-sm">
            {lista.map((p) => {
              const ativo = sel?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSel(p)}
                  className={`w-full rounded-xl border bg-surface-container-lowest p-md text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all active:scale-[0.99] ${
                    ativo
                      ? "border-primary ring-1 ring-primary"
                      : "border-outline-variant/10 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary">{p.id}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-body-md text-on-surface">
                      {p.cliente}
                    </span>
                    <span className="font-headline-md text-headline-md text-primary">
                      {brl(totalDe(p))}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-sm text-caption text-on-surface-variant">
                    <span className="rounded-full bg-surface-container px-2 py-0.5">
                      {p.canal}
                    </span>
                    <span>Loja {p.loja}</span>
                    <span>·</span>
                    <span>{p.itens.length} {p.itens.length === 1 ? "item" : "itens"}</span>
                    <span>·</span>
                    <span>{p.hora}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhe */}
        {sel && (
          <div className="w-full lg:flex-1">
            <DetalhePedido pedido={sel} onFechar={() => setSel(null)} />
          </div>
        )}
      </div>

      {!sel && (
        <p className="text-caption text-on-surface-variant">
          Toque num pedido para ver os detalhes ao lado.
        </p>
      )}
    </div>
  );
}

function DetalhePedido({
  pedido,
  onFechar,
}: {
  pedido: Pedido;
  onFechar: () => void;
}) {
  const subtotal = subtotalDe(pedido);
  const total = totalDe(pedido);
  const ehEntrega = pedido.entrega.startsWith("Rua") || pedido.entrega.startsWith("Av");

  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:sticky lg:top-24">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-lg py-md">
        <div className="flex items-center gap-sm">
          <button
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-surface-container active:scale-95 lg:hidden"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Pedido {pedido.id}
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              {pedido.hora} · {pedido.canal} · Loja {pedido.loja}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <span
            className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium ${STATUS_CHIP[pedido.status]}`}
          >
            {pedido.status}
          </span>
          <button
            onClick={onFechar}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container lg:flex"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div className="space-y-lg p-lg">
        {/* Cliente + entrega */}
        <div className="grid gap-md sm:grid-cols-2">
          <InfoBloco icone="person" rotulo="Cliente">
            <p className="text-body-lg text-on-surface">{pedido.cliente}</p>
            <p className="text-label-sm text-on-surface-variant">
              {pedido.telefone}
            </p>
          </InfoBloco>
          <InfoBloco
            icone={ehEntrega ? "location_on" : "storefront"}
            rotulo={ehEntrega ? "Entrega" : "Retirada / Balcão"}
          >
            <p className="text-body-md text-on-surface">{pedido.entrega}</p>
          </InfoBloco>
        </div>

        {/* Itens */}
        <div>
          <h3 className="mb-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
            Itens
          </h3>
          <ul className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant/20">
            {pedido.itens.map((it, i) => (
              <li key={i} className="flex items-center justify-between px-md py-2.5">
                <span className="text-body-md text-on-surface">
                  <span className="text-on-surface-variant">{it.qtd}</span>{" "}
                  {it.nome}
                </span>
                <span className="font-medium text-primary">{brl(it.preco)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Resumo */}
        <div className="rounded-lg bg-cream-surface p-md">
          <Linha rotulo="Subtotal" valor={brl(subtotal)} />
          <Linha
            rotulo={pedido.frete > 0 ? "Frete" : "Retirada / balcão"}
            valor={pedido.frete > 0 ? brl(pedido.frete) : "Grátis"}
          />
          <div className="my-sm border-t border-dashed border-outline/20" />
          <Linha rotulo="Total" valor={brl(total)} destaque />
          <p className="mt-sm flex items-center gap-1 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">
              {pedido.pagamento === "Pix" ? "qr_code_2" : pedido.pagamento === "Dinheiro" ? "payments" : "credit_card"}
            </span>
            Pago em {pedido.pagamento}
          </p>
        </div>

        {/* Ações (maquete) */}
        <div className="flex gap-sm">
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-outline-variant py-3 text-label-md text-on-surface">
            <span className="material-symbols-outlined text-[20px]">print</span>
            Imprimir
          </button>
          <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-3 text-label-md font-semibold text-on-primary">
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            Avançar status
          </button>
        </div>
        <p className="text-caption text-on-surface-variant">
          * Maquete — com o Supabase, avançar o status atualiza o pedido em tempo
          real (e o cliente vê no acompanhamento).
        </p>
      </div>
    </div>
  );
}

function InfoBloco({
  icone,
  rotulo,
  children,
}: {
  icone: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/20 p-md">
      <span className="mb-1 flex items-center gap-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px] text-secondary">
          {icone}
        </span>
        {rotulo}
      </span>
      {children}
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          destaque
            ? "text-body-lg font-semibold text-on-surface"
            : "text-body-md text-on-surface-variant"
        }
      >
        {rotulo}
      </span>
      <span
        className={
          destaque
            ? "font-headline-md text-headline-md text-primary"
            : "text-body-md text-on-surface"
        }
      >
        {valor}
      </span>
    </div>
  );
}
