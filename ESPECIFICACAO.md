# Armazém do Queijo — Blueprint da Plataforma

Mapa único de tudo que o sistema (PDV + Delivery + Gestão) precisa ter, para
construirmos estruturados e sem conflito. Versão visual (Artifact) acompanha.

**Legenda:** ✅ pronto (maquete navegável) · 🟡 pronto mas sem salvar (falta
Supabase) · ⬜ a construir.

## Princípio: uma espinha, três superfícies

Fonte única da verdade no Supabase; PDV, Delivery e Gestão apenas leem/escrevem
nela. Acertando a espinha, todo indicador vira consulta e as telas nunca se
contradizem.

```
        ESPINHA (Supabase)
  lojas · produtos · faixas_preco · lotes ·
  movimentacoes · vendas · itens_venda · clientes
        ▲            ▲            ▲
      [ PDV ]   [ Delivery ]  [ Gestão ]
      equipe      cliente       dono
```

## Módulos

### PDV — Ponto de Venda (equipe)
- ✅ Venda por unidade e por peso (modal de pesagem)
- ✅ Busca, categorias e scanner (bipar → adiciona)
- ✅ Desconto / acréscimo (R$ ou %)
- ✅ Formas de pagamento (dinheiro/pix/débito/crédito)
- ✅ Fechamento de caixa + sangria
- ✅ Cupom não fiscal + impressão térmica (80mm)
- ⬜ Funcionar offline (venda sem internet + sync)
- ⬜ Balança integrada · ⬜ Salvar (Supabase)

### Delivery — loja do cliente (Fusqueijão)
- ✅ Catálogo (grade + categorias + fotos)
- ✅ Produto por peso (presets + faixas de desconto)
- ✅ Carrinho + upsell · pagamento + desconto Pix
- ✅ Identificação (nome + WhatsApp) · endereço · revisão
- ✅ Acompanhamento (timeline de status)
- ⬜ Zonas de entrega + taxa por zona
- ⬜ Cupons/promoções · retirada na loja
- ⬜ Aviso no WhatsApp · Salvar (Supabase)

### Gestão — Painel do Lojista (dono)
Um painel só, que comanda PDV e delivery.
- 🟡 Dashboard (KPIs, pedidos, status, meta)
- ✅ Produtos: lista + cadastro (peso/unidade, faixas)
- 🟡 Configurações / regras da loja
- ⬜ Pedidos (todos, filtro loja/canal)
- ⬜ Clientes (recência, inativo há 30 dias)
- ⬜ Relatórios (por loja/canal, mais vendidos, perda)
- ⬜ Financeiro (plano, faturas, repasses, saldo)
- ⬜ Usuários e permissões (dono × operador)

### Estoque & Validade
- ⬜ Lotes por loja com validade (schema pronto)
- ⬜ Movimentações (entrada/venda/perda/ajuste/transferência)
- ⬜ Estoque cruzado entre lojas (tempo real)
- ⬜ Alerta de validade (7 dias) · baixa automática na venda
- ⬜ Sugestão de compra pelo histórico

### Fiscal & Hardware
- ✅ Cupom (layout térmico) · ✅ scanner (campo pronto)
- ⬜ NFC-e via provedor (Focus/PlugNotas/NFe.io) — nunca próprio
- ⬜ Pagamento de cartão (integração) · ⬜ balança conectada

### Base & Conta (transversal)
- ✅ Design system único · ✅ schema da espinha (SQL)
- ⬜ Supabase (banco + login + realtime) · ⬜ login · ⬜ PWA

## Modelo de dados (a espinha)

Tudo carimbado por `loja_id` desde o dia 1.

| Tabela | Guarda | Por que importa |
|---|---|---|
| `lojas` | Loja Centro/Bairro | Liga as duas lojas |
| `produtos` | Catálogo único (peso/unidade) | Um catálogo p/ PDV e delivery |
| `faixas_preco` | Preço/kg por faixa de peso | Desconto por volume (ticket) |
| `lotes` | Saldo por produto/loja + validade | Estoque cruzado + vencimento |
| `movimentacoes` | Entradas/saídas com motivo | O "porquê"; nasce a perda |
| `vendas`/`itens_venda` | Toda venda, qualquer canal | Mata o caderninho; KPIs |
| `clientes` | Quem comprou e quando | "Sumiu há 30 dias" |

Itens por peso: `peso_estimado` (preset) + `peso_real` (balança) sustentam o "±".

## Regras do estabelecimento (configuráveis por loja)

Taxa de entrega · zonas e taxas · tempo de preparo · **tolerância de corte** ·
desconto no Pix · faixas de desconto por volume · WhatsApp · som de novo pedido.
Centralizadas em `lib/regras.ts`; viram config real no Supabase.

## Decisões cravadas

- **Multi-loja agora, multi-empresa depois** — não pagar imposto de multi-tenant hoje.
- **Nunca construir fiscal nem cartão** — integrar provedor.
- **PDV tolerante a offline desde o dia 1** — dedup por id local.
- **O risco é adoção, não código** — venda em poucos toques.
- **Um app responsivo (PWA)** — mesma base p/ PC e celular.
- **Design system = padrão visual** — toda tela herda os tokens.

## Fases

- ✅ **Fase 0** — Fundação (design system + schema + hub)
- ✅ **Fase 1** — As três superfícies (maquete): delivery, PDV, gestão
- ➡️ **Fase 2** — Supabase: sair da maquete (persistência + login)
- ⬜ **Fase 3** — Estoque, validade, relatórios, clientes
- ⬜ **Fase 4** — Fiscal, hardware, offline

## Ambiente

- **Deploy:** GitHub → Vercel (CDN estável). O dev local quebra no Windows por
  OneDrive+Turbopack; usar Vercel para visualizar, ou mover o projeto para fora
  do OneDrive (ex.: `C:\dev\armazem`).
- **Stack:** Next.js 16 + React 19 + Tailwind v4 · Supabase · Vercel.
