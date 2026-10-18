"use client";

import Link from "next/link";
import { useConfig } from "@/lib/config-store";
import { useMeusPedidos } from "@/lib/pedidos-store";
import { brl } from "@/lib/catalogo";

export function MenuLoja({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const cfg = useConfig();
  const meus = useMeusPedidos();
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
          {meus.length === 0 ? (
            <p className="mb-md rounded-lg bg-surface-container-low px-md py-3 text-body-md text-on-surface-variant">
              Você ainda não fez pedidos por aqui.
            </p>
          ) : (
            <ul className="mb-md space-y-sm">
              {meus.map((p) => (
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
          Seus pedidos ficam salvos neste aparelho. Guarde o link de cada pedido
          para acompanhar de qualquer lugar.
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
