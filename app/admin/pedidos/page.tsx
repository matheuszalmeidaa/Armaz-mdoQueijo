"use client";

import { useMemo, useState } from "react";
import { brl, precoBase, type Produto } from "@/lib/catalogo";
import { useCatalogo } from "@/lib/catalogo-store";
import {
  usePedidosLive,
  avancarStatus,
  definirStatus,
  marcarPago,
  excluirPedido,
  salvarPedido,
  type PedidoLive,
  type ItemLive,
  type StatusLive,
  type PagoStatus,
} from "@/lib/pedidos-store";
import { comandaPedidoLive, linkWhatsApp } from "@/lib/pedido-msg";

// Rótulo amigável do status (Preparando é mostrado como "Separado").
const LABEL_STATUS: Record<StatusLive, string> = {
  Novo: "Novo",
  Preparando: "Separado",
  "Em rota": "Em rota",
  Entregue: "Entregue",
};
const STATUS_CHIP: Record<StatusLive, string> = {
  Novo: "bg-error-container text-on-error-container",
  Preparando: "bg-warning-amber/20 text-secondary",
  "Em rota": "bg-primary-container/15 text-primary",
  Entregue: "bg-tertiary-container/40 text-tertiary",
};

const COLUNAS = [
  "ATACADO",
  "RETIRADA",
  "PEDIDO NOVO",
  "SEPARADO",
  "EM ROTA",
  "ENTREGUE",
] as const;
type Coluna = (typeof COLUNAS)[number];

function colunaDe(p: PedidoLive): Coluna {
  if (p.status === "Entregue") return "ENTREGUE";
  if (p.canal === "Atacado") return "ATACADO";
  if (p.modo === "retirada") return "RETIRADA";
  if (p.status === "Novo") return "PEDIDO NOVO";
  if (p.status === "Preparando") return "SEPARADO";
  if (p.status === "Em rota") return "EM ROTA";
  return "PEDIDO NOVO";
}

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;
const dataHora = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminPedidos() {
  const pedidos = usePedidosLive();
  const [selId, setSelId] = useState<string | null>(null);
  const [hoje, setHoje] = useState(false);
  const [msg, setMsg] = useState("");

  const inicioHoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const lista = hoje
    ? pedidos.filter((p) => p.criadoEm >= inicioHoje)
    : pedidos;
  const sel = pedidos.find((p) => p.id === selId) ?? null;

  function toast(t: string) {
    setMsg(t);
    setTimeout(() => setMsg(""), 2200);
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Pedidos</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {lista.length} pedido(s) · atacado, retirada e delivery.
          </p>
        </div>
        <div className="flex rounded-lg border border-outline-variant p-1">
          <button
            onClick={() => setHoje(false)}
            className={`rounded-md px-4 py-1.5 text-label-md ${!hoje ? "bg-primary text-on-primary" : "text-on-surface"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setHoje(true)}
            className={`rounded-md px-4 py-1.5 text-label-md ${hoje ? "bg-primary text-on-primary" : "text-on-surface"}`}
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-md overflow-x-auto pb-2">
        {COLUNAS.map((col) => {
          const cards = lista.filter((p) => colunaDe(p) === col);
          return (
            <div key={col} className="w-[280px] flex-shrink-0">
              <div className="mb-sm flex items-center justify-between px-1">
                <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
                  {col}
                </h2>
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                  {cards.length}
                </span>
              </div>
              <div className="space-y-sm">
                {cards.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelId(p.id)}
                    className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all hover:border-primary/30 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-on-surface">{p.cliente}</span>
                      <span className="font-headline-md text-headline-md text-primary">
                        {brl(p.total)}
                      </span>
                    </div>
                    <p className="text-label-sm text-on-surface-variant">
                      {p.telefone || "sem telefone"} · #{p.numero}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CHIP[p.status]}`}>
                        {LABEL_STATUS[p.status]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.pagoStatus === "pago"
                            ? "bg-tertiary-container/40 text-tertiary"
                            : p.pagoStatus === "parcial"
                              ? "bg-warning-amber/20 text-secondary"
                              : "bg-error-container text-on-error-container"
                        }`}
                      >
                        {p.pagoStatus === "pago"
                          ? "Pago"
                          : p.pagoStatus === "parcial"
                            ? "Parcial"
                            : "Pendente"}
                      </span>
                    </div>
                  </button>
                ))}
                {cards.length === 0 && (
                  <p className="rounded-lg border border-dashed border-outline-variant/40 px-2 py-4 text-center text-caption text-on-surface-variant">
                    —
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sel && (
        <PainelPedido pedido={sel} onFechar={() => setSelId(null)} toast={toast} />
      )}

      {msg && (
        <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-on-surface px-md py-2.5 text-body-md text-surface shadow-lg">
          {msg}
        </div>
      )}
    </div>
  );
}

// ---------- Painel lateral (drawer) ----------

type ItemEdit = {
  nome: string;
  produtoId?: string;
  qtdNum: number;
  unidade: "kg" | "un";
  precoUnit: number;
  desconto: number;
  pesoRealG?: number;
};

function itemParaEdit(it: ItemLive): ItemEdit {
  const qtdNum =
    it.qtdNum ??
    (Number(String(it.qtd).replace(/[^\d.,]/g, "").replace(",", ".")) || 1);
  const unidade: "kg" | "un" =
    it.unidade ?? (String(it.qtd).toLowerCase().includes("kg") ? "kg" : "un");
  const precoUnit = it.precoUnit ?? (qtdNum ? it.preco / qtdNum : it.preco);
  return {
    nome: it.nome,
    produtoId: it.produtoId,
    qtdNum,
    unidade,
    precoUnit,
    desconto: it.desconto ?? 0,
    pesoRealG: it.pesoRealG,
  };
}
const subtotalEdit = (e: ItemEdit) =>
  Math.max(0, e.qtdNum * e.precoUnit - e.desconto);

function editParaItem(e: ItemEdit): ItemLive {
  return {
    nome: e.nome,
    produtoId: e.produtoId,
    qtdNum: e.qtdNum,
    unidade: e.unidade,
    precoUnit: e.precoUnit,
    desconto: e.desconto || undefined,
    pesoRealG: e.pesoRealG,
    qtd: `${e.qtdNum} ${e.unidade}`,
    preco: subtotalEdit(e),
  };
}

function PainelPedido({
  pedido,
  onFechar,
  toast,
}: {
  pedido: PedidoLive;
  onFechar: () => void;
  toast: (t: string) => void;
}) {
  const catalogo = useCatalogo();
  const [itens, setItens] = useState<ItemEdit[]>(pedido.itens.map(itemParaEdit));
  const [obs, setObs] = useState(pedido.observacao ?? "");
  const [pagamento, setPagamento] = useState(pedido.pagamento || "Pix");
  const [pagoStatus, setPagoStatus] = useState<PagoStatus>(
    pedido.pagoStatus ?? "pendente"
  );
  const [valorPago, setValorPago] = useState(String(pedido.valorPago ?? 0));
  const [addId, setAddId] = useState("");
  const [erro, setErro] = useState("");

  const total = itens.reduce((s, e) => s + subtotalEdit(e), 0);
  const pendente = Math.max(0, total - num(valorPago));
  const zapCliente = (pedido.telefone ?? "").replace(/\D/g, "");
  const podeAvancar = pedido.status !== "Entregue";
  const proximo =
    pedido.status === "Novo"
      ? "Marcar como separado"
      : pedido.status === "Preparando"
        ? "Enviar para rota"
        : pedido.status === "Em rota"
          ? "Marcar como entregue"
          : null;

  function updItem(i: number, patch: Partial<ItemEdit>) {
    setItens(itens.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function removerItem(i: number) {
    setItens(itens.filter((_, j) => j !== i));
  }
  function adicionarProduto() {
    const p = catalogo.find((x) => x.id === addId);
    if (!p) return;
    const unidade: "kg" | "un" = p.tipo === "peso" ? "kg" : "un";
    const precoUnit =
      p.tipo === "peso" ? p.faixas[0]?.kg ?? precoBase(p) : p.preco;
    setItens([
      ...itens,
      { nome: p.nome, produtoId: p.id, qtdNum: 1, unidade, precoUnit, desconto: 0 },
    ]);
    setAddId("");
  }

  function salvar() {
    if (itens.length === 0) {
      setErro("O pedido precisa de pelo menos um produto.");
      return;
    }
    if (itens.some((e) => e.qtdNum <= 0 || e.precoUnit < 0)) {
      setErro("Quantidade e preço devem ser válidos.");
      return;
    }
    setErro("");
    salvarPedido(
      pedido.id,
      {
        itens: itens.map(editParaItem),
        total,
        observacao: obs,
        pagamento,
        pagoStatus,
        valorPago: num(valorPago),
        pago: pagoStatus === "pago",
      },
      "Pedido editado"
    );
    toast("✓ Pedido atualizado");
  }

  function marcarPagoRapido() {
    setPagoStatus("pago");
    setValorPago(String(total));
    marcarPago(pedido.id, true);
    toast("✓ Pagamento atualizado");
  }

  function avancar() {
    avancarStatus(pedido.id);
    toast("✓ Etapa avançada");
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} aria-hidden />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[32rem] flex-col overflow-y-auto bg-surface shadow-2xl">
        {/* Cabeçalho */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-surface px-md py-sm">
          <div>
            <h2 className="font-headline-md text-headline-md text-primary">
              Pedido #{pedido.numero}
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              {pedido.canal} · {dataHora(pedido.criadoEm)}
            </span>
          </div>
          <button
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-lg p-md">
          {/* Informações */}
          <Secao titulo="Informações do pedido">
            <div className="grid grid-cols-2 gap-sm text-body-md">
              <Campo rotulo="Cliente" valor={pedido.cliente} />
              <Campo
                rotulo="WhatsApp"
                valor={pedido.telefone || "—"}
                href={zapCliente ? `https://wa.me/55${zapCliente}` : undefined}
              />
              <Campo
                rotulo="Tipo"
                valor={
                  pedido.canal === "Atacado"
                    ? "Atacado"
                    : pedido.modo === "retirada"
                      ? "Retirada"
                      : "Delivery"
                }
              />
              <Campo rotulo="Status" valor={LABEL_STATUS[pedido.status]} />
            </div>
            <p className="mt-sm flex items-center gap-1 text-body-md text-on-surface">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                {pedido.modo === "entrega" ? "location_on" : "storefront"}
              </span>
              {pedido.entrega}
            </p>
          </Secao>

          {/* Produtos */}
          <Secao titulo="Produtos">
            <div className="space-y-sm">
              {itens.map((e, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-outline-variant/40 p-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-on-surface">{e.nome}</span>
                    <button
                      onClick={() => removerItem(i)}
                      className="flex items-center gap-0.5 text-label-sm text-danger-red"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Remover
                    </button>
                  </div>
                  <div className="mt-sm grid grid-cols-3 gap-sm">
                    <MiniCampo rotulo={`Qtd (${e.unidade})`}>
                      <input
                        value={String(e.qtdNum)}
                        onChange={(ev) => updItem(i, { qtdNum: num(ev.target.value) })}
                        inputMode="decimal"
                        className="w-full bg-transparent text-body-md outline-none"
                      />
                    </MiniCampo>
                    <MiniCampo rotulo={`R$/${e.unidade}`}>
                      <input
                        value={String(e.precoUnit)}
                        onChange={(ev) =>
                          updItem(i, { precoUnit: num(ev.target.value) })
                        }
                        inputMode="decimal"
                        className="w-full bg-transparent text-body-md outline-none"
                      />
                    </MiniCampo>
                    <MiniCampo rotulo="Desconto R$">
                      <input
                        value={String(e.desconto)}
                        onChange={(ev) =>
                          updItem(i, { desconto: num(ev.target.value) })
                        }
                        inputMode="decimal"
                        className="w-full bg-transparent text-body-md outline-none"
                      />
                    </MiniCampo>
                  </div>
                  {pedido.canal === "Atacado" && (
                    <div className="mt-sm">
                      <MiniCampo rotulo="Peso real separado (kg) — opcional">
                        <input
                          value={e.pesoRealG ? String(e.pesoRealG / 1000) : ""}
                          onChange={(ev) => {
                            const kg = num(ev.target.value);
                            updItem(i, {
                              pesoRealG: kg ? Math.round(kg * 1000) : undefined,
                              qtdNum: kg || e.qtdNum,
                            });
                          }}
                          inputMode="decimal"
                          placeholder="ex: 30,4"
                          className="w-full bg-transparent text-body-md outline-none"
                        />
                      </MiniCampo>
                    </div>
                  )}
                  <p className="mt-sm text-right text-body-md font-semibold text-primary">
                    Subtotal: {brl(subtotalEdit(e))}
                  </p>
                </div>
              ))}
            </div>

            {/* Adicionar produto */}
            <div className="mt-sm flex gap-sm">
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
              >
                <option value="">+ Adicionar produto...</option>
                {catalogo.map((p: Produto) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              <button
                onClick={adicionarProduto}
                disabled={!addId}
                className="flex-shrink-0 rounded-lg border border-outline-variant px-md py-2 text-label-md text-primary disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
          </Secao>

          {/* Pagamento */}
          <Secao titulo="Pagamento">
            <div className="flex items-center justify-between text-body-md">
              <span className="text-on-surface-variant">Total</span>
              <span className="font-headline-md text-headline-md text-primary">
                {brl(total)}
              </span>
            </div>
            <div className="mt-sm grid grid-cols-2 gap-sm">
              <MiniCampo rotulo="Valor pago R$">
                <input
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                  inputMode="decimal"
                  className="w-full bg-transparent text-body-md outline-none"
                />
              </MiniCampo>
              <div>
                <label className="block text-label-sm text-on-surface-variant">
                  Forma
                </label>
                <select
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-body-md outline-none focus:border-primary"
                >
                  {["Pix", "Dinheiro", "Crédito", "Débito", "Outros"].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-sm text-label-md text-on-surface-variant">
              Pendente: <strong className="text-on-surface">{brl(pendente)}</strong>
            </p>
            <div className="mt-sm flex gap-sm">
              {(["pendente", "parcial", "pago"] as PagoStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPagoStatus(s);
                    if (s === "pago") setValorPago(String(total));
                  }}
                  className={`flex-1 rounded-lg py-2 text-label-md capitalize ${
                    pagoStatus === s
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant text-on-surface"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={marcarPagoRapido}
              className="mt-sm w-full rounded-lg bg-tertiary/15 py-2.5 text-label-md font-semibold text-tertiary"
            >
              Marcar como pago
            </button>
          </Secao>

          {/* Observações */}
          <Secao titulo="Observações">
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              placeholder="Anotações do pedido..."
              className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
            />
          </Secao>

          {/* Histórico */}
          <Secao titulo="Histórico">
            {(pedido.historico ?? []).length === 0 ? (
              <p className="text-label-md text-on-surface-variant">Sem eventos.</p>
            ) : (
              <ul className="space-y-1">
                {(pedido.historico ?? []).map((h, i) => (
                  <li key={i} className="flex gap-sm text-label-md text-on-surface-variant">
                    <span className="text-on-surface">{dataHora(h.em)}</span>
                    <span>—</span>
                    <span>{h.texto}</span>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          {erro && (
            <p className="flex items-center gap-1 rounded-lg bg-error-container/40 px-md py-2 text-label-md text-on-error-container">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              {erro}
            </p>
          )}

          {/* Ações */}
          <div className="space-y-sm">
            <button
              onClick={salvar}
              className="w-full rounded-lg bg-primary py-3 text-body-lg font-semibold text-on-primary active:scale-[0.98]"
            >
              Salvar alterações
            </button>
            {proximo && (
              <button
                onClick={avancar}
                disabled={!podeAvancar}
                className="w-full rounded-lg border border-primary py-3 text-body-md font-semibold text-primary disabled:opacity-40"
              >
                {proximo}
              </button>
            )}
            <div className="grid grid-cols-2 gap-sm">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(comandaPedidoLive(pedido));
                  toast("✓ Comanda copiada");
                }}
                className="rounded-lg border border-outline-variant py-2.5 text-label-md text-on-surface"
              >
                Criar comanda
              </button>
              {zapCliente && (
                <button
                  onClick={() => {
                    const link = linkWhatsApp(
                      pedido.telefone ?? "",
                      `Olá, ${pedido.cliente}! Sobre seu pedido #${pedido.numero}: status ${LABEL_STATUS[pedido.status]}, total ${brl(pedido.total)}.`
                    );
                    if (link) window.open(link, "_blank");
                  }}
                  className="rounded-lg border border-outline-variant py-2.5 text-label-md text-on-surface"
                >
                  Enviar ao cliente
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (confirm(`Cancelar o pedido #${pedido.numero}?`)) {
                  definirStatus(pedido.id, "Entregue"); // fecha o fluxo
                  salvarPedido(pedido.id, {}, "Pedido cancelado");
                  toast("Pedido cancelado");
                  onFechar();
                }
              }}
              className="w-full rounded-lg border border-danger-red/40 py-2.5 text-label-md text-danger-red"
            >
              Cancelar pedido
            </button>
            <button
              onClick={() => {
                if (confirm(`Excluir DEFINITIVAMENTE o pedido #${pedido.numero}?`)) {
                  excluirPedido(pedido.id);
                  toast("Pedido excluído");
                  onFechar();
                }
              }}
              className="w-full py-2 text-label-sm text-on-surface-variant underline"
            >
              Excluir pedido
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-sm text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Campo({
  rotulo,
  valor,
  href,
}: {
  rotulo: string;
  valor: string;
  href?: string;
}) {
  return (
    <div>
      <span className="block text-label-sm text-on-surface-variant">{rotulo}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-body-md text-tertiary"
        >
          {valor}
        </a>
      ) : (
        <span className="text-body-md text-on-surface">{valor}</span>
      )}
    </div>
  );
}

function MiniCampo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-label-sm text-on-surface-variant">{rotulo}</label>
      <div className="mt-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 focus-within:border-primary">
        {children}
      </div>
    </div>
  );
}
