"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { brl, gramas } from "@/lib/catalogo";
import { calcularResumo, prazoDe, buscarCupom, LOJAS_RETIRADA } from "@/lib/regras";
import { useConfig, lojaAbertaAgora } from "@/lib/config-store";
import { adicionarPedido } from "@/lib/pedidos-store";
import { mensagemPedido, linkWhatsApp, formatarEndereco } from "@/lib/pedido-msg";

const PAG_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Maquineta (cartão)",
  dinheiro: "Dinheiro",
};

export default function Revisao() {
  const router = useRouter();
  const { itens, total, dados, setDados, limpar } = useCart();
  const pagamento = dados.pagamento ?? "pix";
  const modo = dados.modo ?? "entrega";
  const cfg = useConfig();
  const [cupomInput, setCupomInput] = useState(dados.cupom ?? "");
  const [cupomErro, setCupomErro] = useState(false);

  function aplicarCupom() {
    const c = buscarCupom(cupomInput, cfg.cupons);
    if (c) {
      setDados({ cupom: c.codigo });
      setCupomErro(false);
    } else {
      setCupomErro(true);
    }
  }
  const status = lojaAbertaAgora(cfg);
  const agendado = !status.aberta; // fechada → pedido agendado
  const podeAgendar = agendado && cfg.agendamentoAtivo;
  const podeFinalizar = status.aberta || podeAgendar;
  const r = calcularResumo(total, dados, cfg);
  const lojaRetirada = LOJAS_RETIRADA.find((l) => l.id === dados.lojaRetiradaId);

  function finalizar() {
    if (!podeFinalizar) return;

    const itensMsg = itens.map((it) => ({
      nome: it.nome,
      qtd: it.pesoG ? gramas(it.pesoG) : `${it.qtd} un`,
      preco: it.precoLinha,
    }));

    // Cria o pedido na "espinha temporária" (localStorage) — cai no painel de
    // recebimento do lojista. Com o Supabase, vira realtime.
    const pedido = adicionarPedido({
      cliente: dados.nome || "Cliente",
      telefone: dados.telefone,
      canal: "Delivery",
      modo,
      entrega:
        modo === "retirada"
          ? "Retirada na loja"
          : formatarEndereco(dados) || "Endereço não informado",
      pagamento: PAG_LABEL[pagamento] ?? pagamento,
      itens: itensMsg,
      total: r.total,
      agendado,
    });

    // Envia o pedido para o WhatsApp da loja (é como o pedido chega hoje).
    const texto = mensagemPedido({
      numero: pedido.numero,
      dados,
      itens: itensMsg,
      resumo: r,
      pixChave: cfg.pixChave,
      lojaRetiradaNome: lojaRetirada?.nome,
      agendado,
    });
    const link = linkWhatsApp(cfg.whatsapp, texto);
    if (link) window.open(link, "_blank");

    router.push("/pedido");
    setTimeout(limpar, 400);
  }

  if (itens.length === 0) {
    return (
      <main className="mx-auto max-w-[28rem] p-lg text-center">
        <p className="text-body-md text-on-surface-variant">
          Nada para revisar.
        </p>
        <Link href="/loja" className="mt-md inline-block text-primary underline">
          Voltar à loja
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-32">
      <header className="sticky top-0 z-50 flex items-center gap-md border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href={modo === "retirada" ? "/checkout/identificacao" : "/checkout/endereco"}
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">
          Revisar Pedido
        </span>
      </header>

      <div className="px-md pt-md">
        {/* Entrega ou retirada */}
        <h3 className="text-label-sm uppercase tracking-wide text-on-surface-variant">
          {modo === "retirada" ? "Retirada na loja" : "Endereço de entrega"}
        </h3>
        <div className="mt-sm flex items-start justify-between rounded-xl bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-sm">
            <span className="material-symbols-outlined text-secondary">
              {modo === "retirada" ? "storefront" : "location_on"}
            </span>
            <div>
              <p className="text-body-lg text-on-surface">
                {modo === "retirada"
                  ? "Retirada na loja — Armazém do Queijo"
                  : dados.endereco || "Endereço não informado"}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {modo === "retirada"
                  ? "Retire no balcão quando estiver pronto"
                  : `Tempo estimado: ${prazoDe(dados, cfg)}`}
              </p>
            </div>
          </div>
          <Link
            href={modo === "retirada" ? "/carrinho" : "/checkout/endereco"}
            className="text-label-md text-secondary"
          >
            Alterar
          </Link>
        </div>

        {/* Itens */}
        <h3 className="mt-lg text-label-sm uppercase tracking-wide text-on-surface-variant">
          Itens do pedido
        </h3>
        <ul className="mt-sm divide-y divide-outline-variant/20 rounded-xl bg-surface-container-lowest px-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {itens.map((it) => (
            <li key={it.key} className="flex items-center gap-md py-md">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-secondary-container to-primary-container/20">
                <span className="material-symbols-outlined text-[24px] text-primary/40">
                  {it.icone}
                </span>
              </div>
              <div className="flex-grow leading-tight">
                <p className="line-clamp-1 text-label-md text-on-surface">
                  {it.nome}
                  {it.pesoG ? ` - ${gramas(it.pesoG)}` : ""}
                </p>
                <span className="text-caption text-on-surface-variant">
                  Qtd: {it.qtd}
                </span>
              </div>
              <span className="font-headline-md text-headline-md text-primary">
                {brl(it.precoLinha)}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/loja"
          className="mt-sm flex items-center justify-center rounded-lg border border-dashed border-outline/30 py-3 text-label-md text-on-surface-variant active:scale-[0.99]"
        >
          + Adicionar mais itens
        </Link>

        {/* Pagamento (escolha aqui) */}
        <h3 className="mt-lg text-label-sm uppercase tracking-wide text-on-surface-variant">
          Forma de pagamento
        </h3>
        <div className="mt-sm flex flex-col gap-sm">
          <PagBtn ativo={pagamento === "pix"} onClick={() => setDados({ pagamento: "pix" })} icone="qr_code_2" titulo="Pix" sub="5% de desconto extra" />
          <PagBtn ativo={pagamento === "cartao"} onClick={() => setDados({ pagamento: "cartao" })} icone="credit_card" titulo="Cartão (maquineta na entrega)" sub="Débito ou crédito" />
          <PagBtn ativo={pagamento === "dinheiro"} onClick={() => setDados({ pagamento: "dinheiro" })} icone="payments" titulo="Dinheiro" sub="Pague na entrega" />
        </div>

        {pagamento === "pix" && cfg.pixChave && (
          <div className="mt-sm flex items-center justify-between gap-sm rounded-lg bg-surface-container-low px-md py-2.5">
            <div className="min-w-0">
              <p className="text-label-sm text-on-surface-variant">Chave Pix</p>
              <p className="truncate text-body-md text-on-surface">{cfg.pixChave}</p>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(cfg.pixChave)}
              className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-primary active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copiar
            </button>
          </div>
        )}

        {pagamento === "dinheiro" && (
          <div className="mt-sm rounded-lg bg-surface-container-low px-md py-2.5">
            <label className="block text-label-sm text-on-surface-variant">
              Precisa de troco? Troco para quanto?
            </label>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-body-md text-on-surface-variant">R$</span>
              <input
                inputMode="decimal"
                value={dados.trocoPara ? String(dados.trocoPara) : ""}
                onChange={(e) =>
                  setDados({
                    trocoPara: Number(e.target.value.replace(",", ".")) || undefined,
                  })
                }
                placeholder="Sem troco"
                className="w-full bg-transparent text-body-lg outline-none"
              />
            </div>
          </div>
        )}

        {/* Cupom */}
        <h3 className="mt-lg text-label-sm uppercase tracking-wide text-on-surface-variant">
          Cupom de desconto
        </h3>
        {r.cupom ? (
          <div className="mt-sm rounded-lg bg-tertiary-container/40 px-md py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-sm text-body-md text-on-surface">
                <span className="material-symbols-outlined text-tertiary">local_activity</span>
                <strong>{r.cupom.codigo}</strong> — {r.cupom.descricao}
              </span>
              <button
                onClick={() => {
                  setDados({ cupom: "" });
                  setCupomInput("");
                }}
                className="text-danger-red"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {!r.atingiuMinimo && (
              <p className="mt-1 flex items-center gap-1 text-label-sm text-secondary">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Válido a partir de {brl(r.cupom.minimo)} — faltam{" "}
                {brl(r.cupom.minimo - r.subtotal)} em produtos.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-sm">
            <div className="flex gap-sm">
              <input
                value={cupomInput}
                onChange={(e) => {
                  setCupomInput(e.target.value);
                  setCupomErro(false);
                }}
                placeholder="Digite o código"
                className="flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg uppercase outline-none focus:border-primary"
              />
              <button
                onClick={aplicarCupom}
                className="rounded-lg bg-secondary px-lg text-label-md text-on-secondary active:scale-95"
              >
                Aplicar
              </button>
            </div>
            {cupomErro && (
              <p className="mt-1 text-label-sm text-danger-red">
                Cupom inválido ou inativo.
              </p>
            )}
          </div>
        )}

        {/* Resumo */}
        <div className="mt-lg rounded-xl bg-cream-surface p-md">
          <Linha rotulo="Subtotal" valor={brl(r.subtotal)} />
          <Linha
            rotulo={modo === "retirada" ? "Retirada na loja" : "Taxa de Entrega"}
            valor={r.frete > 0 ? brl(r.frete) : "Grátis"}
            verde={r.frete === 0}
          />
          {r.descontoPix > 0 && (
            <Linha
              rotulo="Desconto Pix (5%)"
              valor={`- ${brl(r.descontoPix)}`}
              verde
            />
          )}
          {r.descontoCupom > 0 && (
            <Linha
              rotulo={`Cupom ${r.cupom?.codigo ?? ""}`}
              valor={`- ${brl(r.descontoCupom)}`}
              verde
            />
          )}
          <div className="my-sm border-t border-dashed border-outline/20" />
          <Linha rotulo="Total" valor={brl(r.total)} destaque />
        </div>
      </div>

      {/* Finalizar */}
      <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
        {podeAgendar && (
          <p className="mb-sm flex items-center justify-center gap-1 text-label-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">event</span>
            Loja fechada — enviado como AGENDADO (combinamos o horário).
          </p>
        )}
        {!podeFinalizar && (
          <p className="mb-sm flex items-center justify-center gap-1 text-label-sm text-danger-red">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Loja fechada — {status.motivo}
          </p>
        )}
        <button
          onClick={finalizar}
          disabled={!podeFinalizar}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-lg py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {podeFinalizar
            ? podeAgendar
              ? "Enviar pedido agendado pelo WhatsApp"
              : "Enviar pedido pelo WhatsApp"
            : "Loja fechada no momento"}
          {podeFinalizar && (
            <span className="material-symbols-outlined">chat</span>
          )}
        </button>
      </div>
    </main>
  );
}

function PagBtn({
  ativo,
  onClick,
  icone,
  titulo,
  sub,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: string;
  titulo: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-sm rounded-xl border p-md text-left transition-all active:scale-[0.99] ${
        ativo
          ? "border-primary bg-primary-container/10"
          : "border-outline-variant bg-surface-container-lowest"
      }`}
    >
      <span
        className={`material-symbols-outlined ${ativo ? "text-primary" : "text-secondary"}`}
      >
        {icone}
      </span>
      <span className="leading-tight">
        <span className="block text-body-lg text-on-surface">{titulo}</span>
        <span className="block text-label-sm text-on-surface-variant">{sub}</span>
      </span>
      {ativo && (
        <span className="material-symbols-outlined ml-auto text-primary">
          check_circle
        </span>
      )}
    </button>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
  verde,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
  verde?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          destaque
            ? "text-body-lg font-semibold text-on-surface"
            : verde
              ? "text-body-md font-medium text-tertiary"
              : "text-body-md text-on-surface-variant"
        }
      >
        {rotulo}
      </span>
      <span
        className={
          destaque
            ? "font-headline-md text-headline-md text-primary"
            : verde
              ? "text-body-md font-medium text-tertiary"
              : "text-body-md text-on-surface"
        }
      >
        {valor}
      </span>
    </div>
  );
}
