"use client";

import Link from "next/link";
import { useState } from "react";
import { useConfig } from "@/lib/config-store";
import {
  useMeusPedidos,
  usePedidosPorTelefone,
  type MeuPedido,
} from "@/lib/pedidos-store";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/catalogo";

// Máscara de telefone BR (DDD + número), até 11 dígitos.
function mascararTel(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const LABEL_STATUS: Record<string, string> = {
  Novo: "Recebido",
  Preparando: "Separando",
  "Em rota": "A caminho",
  Entregue: "Concluído",
};

export function MenuLoja({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const cfg = useConfig();
  const { dados, setDados } = useCart();
  const locais = useMeusPedidos();
  const [tel, setTel] = useState(dados.telefone ?? "");
  const dig = tel.replace(/\D/g, "");
  const temTel = dig.length >= 10;
  const { pedidos: doServidor, carregando } = usePedidosPorTelefone(
    temTel ? dig : undefined
  );

  // Itens a exibir: por telefone (qualquer aparelho) ou, sem telefone, os deste
  // aparelho (histórico local).
  const porTelefone = doServidor.map((p) => ({
    id: p.id,
    numero: p.numero,
    criadoEm: p.criadoEm,
    total: p.total,
    modo: p.modo,
    status: p.status as string,
  }));
  const lista: (MeuPedido & { status?: string })[] = temTel
    ? porTelefone
    : locais;

  function salvarTel(v: string) {
    setTel(v);
    const d = v.replace(/\D/g, "");
    if (d.length >= 10) setDados({ telefone: v });
  }

  const zap = cfg.whatsapp.replace(/\D/g, "");
  const ig = cfg.redes?.instagram?.trim();
  const igHref = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${ig.replace(/^@/, "")}`
    : "";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onFechar}
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Painel */}
      <aside
        className={`fixed inset-y-0 left-0 z-[61] flex w-[86%] max-w-[22rem] flex-col bg-surface shadow-2xl transition-transform ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-md py-sm">
          <span className="font-display text-headline-md text-primary">
            Armazém do Queijo
          </span>
          <button
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant active:scale-95"
            aria-label="Fechar menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-md py-md">
          {/* Meus pedidos */}
          <h3 className="mb-sm flex items-center gap-1 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              receipt_long
            </span>
            Meus pedidos
          </h3>

          {/* Telefone = identificação do cliente (vê os pedidos em qualquer aparelho) */}
          <div className="mb-sm flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 focus-within:border-primary">
            <span className="material-symbols-outlined text-on-surface-variant">
              call
            </span>
            <input
              value={tel}
              onChange={(e) => salvarTel(mascararTel(e.target.value))}
              inputMode="numeric"
              placeholder="Seu telefone (com DDD)"
              className="w-full bg-transparent text-body-md outline-none placeholder:text-on-surface-variant/60"
            />
          </div>

          {carregando ? (
            <p className="mb-md flex items-center gap-2 px-1 text-body-md text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[18px] text-primary">
                progress_activity
              </span>
              Buscando seus pedidos…
            </p>
          ) : lista.length === 0 ? (
            <p className="mb-md rounded-lg bg-surface-container-low px-md py-3 text-body-md text-on-surface-variant">
              {temTel
                ? "Nenhum pedido encontrado para este número."
                : "Informe seu telefone acima para ver seus pedidos de qualquer aparelho."}
            </p>
          ) : (
            <ul className="mb-md space-y-sm">
              {lista.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/pedido/${p.id}`}
                    onClick={onFechar}
                    className="flex items-center justify-between gap-md rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-md py-2.5 active:scale-[0.99]"
                  >
                    <span className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">
                        {p.modo === "retirada" ? "storefront" : "local_shipping"}
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="text-label-md text-on-surface">
                          Pedido #{p.numero}
                          {p.status && (
                            <span className="ml-1 rounded-full bg-primary-container/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              {LABEL_STATUS[p.status] ?? p.status}
                            </span>
                          )}
                        </span>
                        <span className="text-caption text-on-surface-variant">
                          {new Date(p.criadoEm).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-label-md font-semibold text-primary">
                      {brl(p.total)}
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                        chevron_right
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Atalhos */}
          <div className="space-y-1 border-t border-outline-variant/20 pt-md">
            <ItemMenu href="/loja" onClick={onFechar} icone="storefront" label="Ver produtos" />
            <ItemMenu
              href="/pedidos-atacado"
              onClick={onFechar}
              icone="inventory_2"
              label="Comprar no atacado"
            />
            {zap && (
              <ItemMenu
                href={`https://wa.me/55${zap}`}
                externo
                icone="chat"
                label="Falar no WhatsApp"
              />
            )}
            {igHref && (
              <ItemMenu
                href={igHref}
                externo
                icone="photo_camera"
                label="Instagram"
              />
            )}
          </div>
        </div>

        <p className="border-t border-outline-variant/20 px-md py-sm text-caption text-on-surface-variant">
          Seus pedidos ficam atribuídos ao seu telefone — informe o número para
          acompanhar de qualquer aparelho.
        </p>
      </aside>
    </>
  );
}

function ItemMenu({
  href,
  label,
  icone,
  onClick,
  externo,
}: {
  href: string;
  label: string;
  icone: string;
  onClick?: () => void;
  externo?: boolean;
}) {
  const cls =
    "flex items-center gap-md rounded-lg px-md py-2.5 text-body-lg text-on-surface active:bg-surface-container-low";
  const conteudo = (
    <>
      <span className="material-symbols-outlined text-primary">{icone}</span>
      {label}
    </>
  );
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {conteudo}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={cls}>
      {conteudo}
    </Link>
  );
}
