# Armazém do Queijo — Plataforma integrada

Uma plataforma para substituir OlaClick (delivery) + PDV pago, unificando
**duas lojas** num só sistema: PDV, delivery, estoque com validade e financeiro.

## Princípio central: espinha + superfícies

Não são 4 produtos separados. É **uma espinha** (fonte única da verdade no
Supabase) e três **superfícies** que escrevem/leem nela:

```
        ┌─────────────────────────────────────────┐
        │   ESPINHA (Supabase)                      │
        │   lojas · produtos · lotes · movimentacoes │
        │   vendas · itens_venda · clientes         │
        └─────────────────────────────────────────┘
             ▲              ▲              ▲
         [ PDV ]       [ Delivery ]   [ Dashboard ]
        (equipe)       (cliente)       (dono)
```

Indicadores (mais vendido por época, cliente inativo, perda de produto) são
**consultas** sobre `vendas` + `movimentacoes`, não features novas. Por isso a
espinha vem primeiro.

## Roadmap (mesmo destino, construído em ordem)

| Fase | Entrega | Por que primeiro |
|------|---------|------------------|
| **1** | Espinha + **PDV** (venda em ≤3 toques, offline-tolerante) | Mata o caderninho · estoque cruzado entre lojas · KPIs de graça |
| **2** | **Dashboard** + alertas | Mais vendidos por época · validade · cliente inativo · perda |
| **3** | **Delivery** (telas do Stitch) | Reusa o catálogo · aposenta o OlaClick |
| **4** | Fiscal + hardware | NFC-e via provedor (Focus/PlugNotas) · impressora · scanner |

**Nunca construir do zero:** NFC-e e pagamento de cartão → integrar provedor.

## Decisões de arquitetura cravadas

- **Offline no PDV (dia 1):** loja no celular, internet oscila. O PDV registra
  venda offline (cache local + fila de sync) e deduplica pelo `id_local`. Um PDV
  que trava a venda é pior que o caderninho.
- **Realtime do Supabase:** é o que faz a Loja 2 ver o estoque da Loja 1 na hora.
- **Um app responsivo só:** mesma base serve PC (uma loja) e celular (a outra).
  PDV como PWA para instalar no celular e rodar offline.
- **Design system único:** tokens do Stitch ("Rustic Artisanal Core") em
  `app/globals.css` (`@theme`). PDV, delivery e dashboard = mesma família visual.

## Teste de vida ou morte

Adoção, não código: a equipe tem que registrar **toda** venda no PDV. Se for mais
lento que o caderninho, ninguém usa. Meta: bater uma venda em **≤3 toques**.

## Stack

- **Next.js 16 + React 19 + Tailwind v4** (`app/`) na **Vercel**
- **Supabase** (Postgres + Auth + Realtime) — schema em `supabase/schema.sql`
- **GitHub** para versionamento

## Estrutura de pastas (alvo)

```
app/
  page.tsx              # hub (feito)
  pdv/                  # Fase 1
  admin/                # Fase 2 (dashboard)
  loja/                 # Fase 3 (delivery Fusqueijão)
  globals.css          # design system (tokens do Stitch)
lib/
  supabase/            # cliente + queries
supabase/
  schema.sql           # a espinha (feito)
```

## Rodar localmente

```bash
npm install
npm run dev   # http://localhost:3000
```

## Referência de design

Telas originais do Stitch em
`../stitch_armazem_do_queijo_delivery/` — `DESIGN.md` é a fonte dos tokens.
