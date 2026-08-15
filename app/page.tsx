"use client";

import Link from "next/link";
import { useConfig, lojaAbertaAgora } from "@/lib/config-store";

export default function Home() {
  const cfg = useConfig();
  const status = lojaAbertaAgora(cfg);

  const zap = cfg.whatsapp.replace(/\D/g, "");
  const ig = cfg.redes.instagram.trim();
  const igHref = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${ig.replace(/^@/, "")}`
    : "";
  const fb = cfg.redes.facebook.trim();
  const fbHref = fb ? (fb.startsWith("http") ? fb : `https://facebook.com/${fb}`) : "";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-primary to-primary-container">
      {/* Textura sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px, 90px 90px",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-[26rem] flex-col items-center px-md py-xl">
        {/* Marca */}
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-on-primary/15 backdrop-blur-sm">
          <span className="material-symbols-outlined text-[42px] text-cream-surface">
            restaurant
          </span>
        </div>
        <h1 className="mt-md font-display text-[2rem] font-bold leading-none text-cream-surface">
          Armazém do Queijo
        </h1>
        <p className="mt-1 text-body-md text-primary-fixed">
          Queijos artesanais e iguarias da roça
        </p>

        <span
          className={`mt-md flex items-center gap-1.5 rounded-full px-3 py-1 text-label-md font-semibold ${
            status.aberta
              ? "bg-tertiary text-on-tertiary"
              : "bg-on-primary/15 text-cream-surface"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${status.aberta ? "bg-cream-surface" : "bg-warning-amber"}`}
          />
          {status.aberta ? "Aberto agora" : "Fechado no momento"}
        </span>

        {/* Links */}
        <nav className="mt-xl flex w-full flex-col gap-sm">
          <LinkGrande
            href="/loja"
            icone="shopping_basket"
            titulo="Fazer meu pedido"
            sub="Delivery e retirada"
            destaque
          />
          <LinkGrande
            href="/pedidos-atacado"
            icone="inventory_2"
            titulo="Compra no atacado"
            sub="Preços por volume (kg/peça)"
          />
          {zap && (
            <LinkGrande
              href={`https://wa.me/55${zap}`}
              externo
              icone="chat"
              titulo="Falar no WhatsApp"
              sub="Tire dúvidas ou peça por aqui"
            />
          )}
          {igHref && (
            <LinkGrande href={igHref} externo icone="photo_camera" titulo="Instagram" sub="Novidades e bastidores" />
          )}
          {fbHref && (
            <LinkGrande href={fbHref} externo icone="thumb_up" titulo="Facebook" sub="Siga a gente" />
          )}
        </nav>

        <div className="mt-auto pt-xl">
          <Link
            href="/admin"
            className="text-label-md text-primary-fixed/80 underline underline-offset-2"
          >
            Acesso da equipe
          </Link>
        </div>
      </div>
    </main>
  );
}

function LinkGrande({
  href,
  icone,
  titulo,
  sub,
  destaque,
  externo,
}: {
  href: string;
  icone: string;
  titulo: string;
  sub: string;
  destaque?: boolean;
  externo?: boolean;
}) {
  const cls = `flex items-center gap-md rounded-2xl px-md py-3.5 shadow-lg transition-transform active:scale-[0.98] ${
    destaque
      ? "bg-cream-surface text-primary"
      : "bg-on-primary/10 text-cream-surface backdrop-blur-sm ring-1 ring-on-primary/15"
  }`;
  const inner = (
    <>
      <span
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
          destaque ? "bg-primary/10 text-primary" : "bg-on-primary/15 text-cream-surface"
        }`}
      >
        <span className="material-symbols-outlined">{icone}</span>
      </span>
      <span className="min-w-0 flex-grow leading-tight">
        <span className="block font-headline-md text-headline-md">{titulo}</span>
        <span className={`block text-label-sm ${destaque ? "text-on-surface-variant" : "text-primary-fixed"}`}>
          {sub}
        </span>
      </span>
      <span className="material-symbols-outlined opacity-60">chevron_right</span>
    </>
  );
  return externo ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
