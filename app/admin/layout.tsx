"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfig, salvarConfig, lojaAbertaAgora } from "@/lib/config-store";

const NAV = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/recebimento", icon: "notifications_active", label: "Recebimento" },
  { href: "/admin/pedidos", icon: "receipt_long", label: "Pedidos" },
  { href: "/admin/produtos", icon: "inventory_2", label: "Produtos" },
  { href: "/admin/estoque", icon: "warehouse", label: "Estoque" },
  { href: "/admin/clientes", icon: "group", label: "Clientes" },
  { href: "/admin/relatorios", icon: "bar_chart", label: "Relatórios" },
  { href: "/admin/configuracoes", icon: "settings", label: "Configurações" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const cfg = useConfig();
  // Mesmo status que o cliente vê (home/loja): horário + toggle mestre.
  const status = lojaAbertaAgora(cfg);
  // Clicar liga/desliga o "aceitar pedidos" (mestre) e salva — reflete em todo
  // o app na hora.
  const alternarLoja = () => {
    salvarConfig({ ...cfg, aceitaPedidos: !cfg.aceitaPedidos });
  };

  const ativo = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh bg-surface-container-low">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-outline-variant/30 bg-surface lg:flex">
        <div className="flex items-center gap-sm px-lg py-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <span className="font-display text-headline-md text-primary">
            Armazém
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-md">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-sm rounded-lg px-md py-2.5 text-label-md transition-colors ${
                ativo(item.href)
                  ? "bg-primary text-on-primary"
                  : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="m-md flex items-center gap-sm rounded-lg bg-surface-container px-md py-3 text-label-md text-on-surface-variant hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined">logout</span>
          Voltar ao início
        </Link>
      </aside>

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-md border-b border-outline-variant/30 bg-surface px-md py-sm lg:px-lg">
          <div className="flex flex-grow items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 lg:max-w-[28rem]">
            <span className="material-symbols-outlined text-on-surface-variant">
              search
            </span>
            <input
              placeholder="Buscar pedidos, clientes ou produtos..."
              className="w-full bg-transparent text-body-md outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
          <button
            onClick={alternarLoja}
            title={
              status.aberta
                ? "Aceitando pedidos — clique para pausar"
                : (status.motivo ?? "Fechada — clique para reabrir")
            }
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-label-md ${
              status.aberta
                ? "bg-tertiary-container/40 text-tertiary"
                : "bg-error-container text-on-error-container"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status.aberta ? "bg-tertiary" : "bg-error"
              }`}
            />
            {status.aberta ? "Loja Aberta" : "Loja Fechada"}
          </button>
          <form action="/api/sair" method="post">
            <button
              type="submit"
              title="Sair"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-label-md text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </form>
        </header>

        {/* Nav mobile (scroll horizontal) */}
        <nav className="no-scrollbar flex gap-sm overflow-x-auto border-b border-outline-variant/20 bg-surface px-md py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-label-sm ${
                ativo(item.href)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-md lg:p-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
