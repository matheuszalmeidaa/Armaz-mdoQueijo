"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { brl, gramas } from "@/lib/catalogo";
import { calcularResumo, prazoDe, LOJAS_RETIRADA } from "@/lib/regras";
import { useConfig, lojaAbertaAgora } from "@/lib/config-store";
import { adicionarPedido } from "@/lib/pedidos-store";

export default function Revisao() {
  const router = useRouter();
  const { itens, total, dados, limpar } = useCart();
  const pagamento = dados.pagamento ?? "pix";
  const modo = dados.modo ?? "entrega";
  const cfg = useConfig();
  const status = lojaAbertaAgora(cfg);
  const r = calcularResumo(total, dados, cfg);
  const lojaRetirada = LOJAS_RETIRADA.find((l) => l.id === dados.lojaRetiradaId);

  function finalizar() {
    if (!status.aberta) return;
    // Cria o pedido na "espinha temporária" (localStorage) — cai no painel de
    // recebimento do lojista com alerta. Com o Supabase, vira realtime.
    adicionarPedido({
      cliente: dados.nome || "Cliente",
      telefone: dados.telefone,
      canal: "Delivery",
      modo,
      entrega:
        modo === "retirada"
          ? `Retirada — ${lojaRetirada?.nome ?? "loja"}`
          : dados.endereco || "Endereço não informado",
      pagamento: pagamento === "pix" ? "Pix" : "Maquineta (cartão)",
      itens: itens.map((it) => ({
        nome: it.nome,
        qtd: it.pesoG ? gramas(it.pesoG) : `${it.qtd} un`,
        preco: it.precoLinha,
      })),
      total: r.total,
    });
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
                  ? lojaRetirada
                    ? `${lojaRetirada.nome} — ${lojaRetirada.endereco}`
                    : "Loja não selecionada"
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

        {/* Pagamento */}
        <h3 className="mt-lg text-label-sm uppercase tracking-wide text-on-surface-variant">
          Forma de pagamento
        </h3>
        <div className="mt-sm flex items-center justify-between rounded-xl bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary">
              {pagamento === "pix" ? "qr_code_2" : "credit_card"}
            </span>
            <span className="text-body-lg text-on-surface">
              {pagamento === "pix" ? "Pix" : "Cartão de Crédito"}
            </span>
          </div>
          <Link href="/carrinho" className="text-label-md text-secondary">
            Alterar
          </Link>
        </div>

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
        {!status.aberta && (
          <p className="mb-sm flex items-center justify-center gap-1 text-label-sm text-danger-red">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Loja fechada — {status.motivo}
          </p>
        )}
        <button
          onClick={finalizar}
          disabled={!status.aberta}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-lg py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          {status.aberta ? "Finalizar Pedido" : "Loja fechada no momento"}
          {status.aberta && (
            <span className="material-symbols-outlined">arrow_forward</span>
          )}
        </button>
      </div>
    </main>
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
