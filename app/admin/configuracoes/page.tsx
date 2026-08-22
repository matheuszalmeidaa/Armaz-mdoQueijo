"use client";

import { useEffect, useState } from "react";
import { ZONAS } from "@/lib/regras";
import {
  CONFIG_PADRAO,
  carregarConfig,
  salvarConfig,
  DIAS_SEMANA,
  FOTOS_VITRINE,
  type ConfigLoja,
  type CupomCfg,
  type DiaHorario,
  type Excecao,
} from "@/lib/config-store";
import { brl } from "@/lib/catalogo";

const num = (v: string) => Number(v.replace(",", ".")) || 0;

export default function Configuracoes() {
  const [taxa, setTaxa] = useState(String(CONFIG_PADRAO.frete));
  const [pix, setPix] = useState(String(Math.round(CONFIG_PADRAO.descontoPix * 100)));
  const [preparoMin, setPreparoMin] = useState(String(CONFIG_PADRAO.tempoEntregaMin));
  const [toleranciaCorte, setToleranciaCorte] = useState(
    String(CONFIG_PADRAO.toleranciaCorte)
  );
  const [whatsapp, setWhatsapp] = useState(CONFIG_PADRAO.whatsapp);
  const [somPedido, setSomPedido] = useState(CONFIG_PADRAO.somPedido);
  const [cashbackAtivo, setCashbackAtivo] = useState(CONFIG_PADRAO.cashbackAtivo);
  const [cashbackPct, setCashbackPct] = useState(
    String(Math.round(CONFIG_PADRAO.cashbackPercent * 100))
  );
  const [cupons, setCupons] = useState<CupomCfg[]>(CONFIG_PADRAO.cupons);
  const [aceitaPedidos, setAceitaPedidos] = useState(CONFIG_PADRAO.aceitaPedidos);
  const [entregaAtiva, setEntregaAtiva] = useState(CONFIG_PADRAO.entregaAtiva);
  const [retiradaAtiva, setRetiradaAtiva] = useState(CONFIG_PADRAO.retiradaAtiva);
  const [agendamentoAtivo, setAgendamentoAtivo] = useState(
    CONFIG_PADRAO.agendamentoAtivo
  );
  const [atacadoRegraMin, setAtacadoRegraMin] = useState(
    CONFIG_PADRAO.atacadoRegraMin
  );
  const [atacadoPedidoMinimo, setAtacadoPedidoMinimo] = useState(
    String(CONFIG_PADRAO.atacadoPedidoMinimo)
  );
  const [categorias, setCategorias] = useState<string[]>(CONFIG_PADRAO.categorias);
  const [categoriasOcultas, setCategoriasOcultas] = useState<string[]>([]);
  const [novaCat, setNovaCat] = useState("");
  const [horarios, setHorarios] = useState<DiaHorario[]>(CONFIG_PADRAO.horarios);
  const [excecoes, setExcecoes] = useState<Excecao[]>(CONFIG_PADRAO.excecoes);
  const [instagram, setInstagram] = useState(CONFIG_PADRAO.redes.instagram);
  const [facebook, setFacebook] = useState(CONFIG_PADRAO.redes.facebook);
  const [heroImg, setHeroImg] = useState(CONFIG_PADRAO.heroImg);
  const [heroTag, setHeroTag] = useState(CONFIG_PADRAO.heroTag);
  const [heroTitulo, setHeroTitulo] = useState(CONFIG_PADRAO.heroTitulo);
  const [pixChave, setPixChave] = useState(CONFIG_PADRAO.pixChave);
  const [pedidoMinimo, setPedidoMinimo] = useState(
    String(CONFIG_PADRAO.pedidoMinimo)
  );
  const [salvo, setSalvo] = useState(false);

  // Carrega o config atual do servidor (Supabase) ao abrir a tela.
  useEffect(() => {
    let vivo = true;
    carregarConfig().then((c) => {
      if (!vivo) return;
    setTaxa(String(c.frete));
    setPix(String(Math.round(c.descontoPix * 100)));
    setPreparoMin(String(c.tempoEntregaMin));
    setToleranciaCorte(String(c.toleranciaCorte));
    setWhatsapp(c.whatsapp);
    setSomPedido(c.somPedido);
    setCashbackAtivo(c.cashbackAtivo);
    setCashbackPct(String(Math.round(c.cashbackPercent * 100)));
    setCupons(c.cupons);
    setAceitaPedidos(c.aceitaPedidos);
    setHorarios(c.horarios);
    setExcecoes(c.excecoes);
    setInstagram(c.redes.instagram);
    setFacebook(c.redes.facebook);
    setHeroImg(c.heroImg);
    setHeroTag(c.heroTag);
    setHeroTitulo(c.heroTitulo);
    setPixChave(c.pixChave);
    setPedidoMinimo(String(c.pedidoMinimo));
    setEntregaAtiva(c.entregaAtiva);
    setRetiradaAtiva(c.retiradaAtiva);
    setAgendamentoAtivo(c.agendamentoAtivo);
    setAtacadoRegraMin(c.atacadoRegraMin);
    setAtacadoPedidoMinimo(String(c.atacadoPedidoMinimo));
    if (c.categorias?.length) setCategorias(c.categorias);
    setCategoriasOcultas(c.categoriasOcultas ?? []);
    });
    return () => {
      vivo = false;
    };
  }, []);

  function salvar() {
    const c: ConfigLoja = {
      frete: num(taxa),
      descontoPix: num(pix) / 100,
      tempoEntregaMin: num(preparoMin),
      tempoEntregaMax: CONFIG_PADRAO.tempoEntregaMax,
      toleranciaCorte: num(toleranciaCorte),
      whatsapp: whatsapp.trim(),
      somPedido,
      cashbackAtivo,
      cashbackPercent: num(cashbackPct) / 100,
      cupons: cupons
        .map((cp) => ({ ...cp, codigo: cp.codigo.trim().toUpperCase() }))
        .filter((cp) => cp.codigo),
      aceitaPedidos,
      horarios,
      excecoes: excecoes.filter((e) => e.data),
      redes: {
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        whatsapp: whatsapp.trim(),
      },
      heroImg: heroImg.trim(),
      heroTag: heroTag.trim(),
      heroTitulo: heroTitulo.trim(),
      pixChave: pixChave.trim(),
      pedidoMinimo: num(pedidoMinimo),
      entregaAtiva,
      retiradaAtiva,
      agendamentoAtivo,
      atacadoRegraMin,
      atacadoPedidoMinimo: num(atacadoPedidoMinimo),
      categorias: categorias.map((s) => s.trim()).filter(Boolean),
      categoriasOcultas,
    };
    salvarConfig(c);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
  }

  function addCupom() {
    setCupons([
      ...cupons,
      { codigo: "", tipo: "percent", valor: 10, minimo: 0, descricao: "", ativo: true },
    ]);
  }
  function updCupom(i: number, patch: Partial<CupomCfg>) {
    setCupons(cupons.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }
  function delCupom(i: number) {
    setCupons(cupons.filter((_, j) => j !== i));
  }

  function updHorario(i: number, patch: Partial<DiaHorario>) {
    setHorarios(horarios.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  }
  function addExcecao() {
    setExcecoes([
      ...excecoes,
      { data: "", aberto: false, abre: "08:00", fecha: "18:00", motivo: "" },
    ]);
  }
  function updExcecao(i: number, patch: Partial<Excecao>) {
    setExcecoes(excecoes.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function delExcecao(i: number) {
    setExcecoes(excecoes.filter((_, j) => j !== i));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary">
          Configurações
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          As regras da sua loja. Cada loja pode ter as suas — hoje valem para o
          delivery e o PDV.
        </p>
      </div>

      {/* Status da loja */}
      <Secao icone="storefront" titulo="Status da loja (delivery)">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-md text-on-surface">Aceitar pedidos</p>
            <p className="text-label-sm text-on-surface-variant">
              Desligado, a loja aparece como fechada no delivery (o cliente ainda
              navega o catálogo).
            </p>
          </div>
          <button
            onClick={() => setAceitaPedidos((v) => !v)}
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
              aceitaPedidos ? "bg-tertiary" : "bg-outline-variant"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                aceitaPedidos ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </Secao>

      {/* Formas de recebimento */}
      <Secao icone="takeout_dining" titulo="Formas de recebimento">
        <ToggleLinha
          titulo="Entrega (delivery)"
          sub="Cliente recebe no endereço."
          ativo={entregaAtiva}
          onToggle={() => setEntregaAtiva((v) => !v)}
        />
        <ToggleLinha
          titulo="Retirada na loja"
          sub="Cliente busca no balcão. Desligado, some do checkout."
          ativo={retiradaAtiva}
          onToggle={() => setRetiradaAtiva((v) => !v)}
        />
        <ToggleLinha
          titulo="Permitir pedidos agendados"
          sub="Com a loja fechada, o cliente ainda envia o pedido como AGENDADO (vocês combinam o horário no WhatsApp)."
          ativo={agendamentoAtivo}
          onToggle={() => setAgendamentoAtivo((v) => !v)}
        />
      </Secao>

      {/* Regras do atacado */}
      <Secao icone="inventory_2" titulo="Regras do atacado">
        <div>
          <label className="block text-label-md text-on-surface">
            Quantidade mínima
          </label>
          <p className="mb-1 text-label-sm text-on-surface-variant">
            Como o mínimo é exigido no catálogo de atacado (/pedidos-atacado).
          </p>
          <select
            value={atacadoRegraMin}
            onChange={(e) =>
              setAtacadoRegraMin(e.target.value as typeof atacadoRegraMin)
            }
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none focus:border-primary"
          >
            <option value="nenhum">Sem quantidade mínima</option>
            <option value="produto">Mínimo por produto</option>
            <option value="pedido">Mínimo para o pedido (total)</option>
            <option value="ambos">Ambos (produto + pedido)</option>
          </select>
        </div>
        {(atacadoRegraMin === "produto" || atacadoRegraMin === "ambos") && (
          <p className="rounded-lg bg-cream-surface px-md py-2 text-label-sm text-on-surface-variant">
            O mínimo <strong>por produto</strong> é definido no cadastro de cada
            produto (Produtos → Editar → Atacado → “Pedido mínimo”).
          </p>
        )}
        {(atacadoRegraMin === "pedido" || atacadoRegraMin === "ambos") && (
          <Campo
            rotulo="Mínimo do pedido (soma das quantidades)"
            valor={atacadoPedidoMinimo}
            onChange={setAtacadoPedidoMinimo}
            dica="Ex.: 20 = o cliente só fecha o pedido de atacado com 20 itens somados (kg/peças)."
          />
        )}
      </Secao>

      {/* Categorias */}
      <Secao icone="category" titulo="Categorias do catálogo">
        <p className="text-label-sm text-on-surface-variant">
          Usadas na loja, no PDV e no cadastro de produtos.
        </p>
        <div className="flex flex-wrap gap-sm">
          {categorias.map((c, i) => {
            const oculta = categoriasOcultas.includes(c);
            return (
              <span
                key={i}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-label-md ${
                  oculta
                    ? "bg-surface-container text-on-surface-variant line-through"
                    : "bg-primary-container/10 text-primary"
                }`}
              >
                {c}
                <button
                  onClick={() =>
                    setCategoriasOcultas(
                      oculta
                        ? categoriasOcultas.filter((x) => x !== c)
                        : [...categoriasOcultas, c]
                    )
                  }
                  className="material-symbols-outlined text-[16px] opacity-70 hover:opacity-100"
                  title={oculta ? "Mostrar ao cliente" : "Ocultar do cliente"}
                >
                  {oculta ? "visibility_off" : "visibility"}
                </button>
                <button
                  onClick={() => setCategorias(categorias.filter((_, j) => j !== i))}
                  className="material-symbols-outlined text-[16px] opacity-60 hover:text-danger-red"
                  title="Excluir categoria"
                >
                  close
                </button>
              </span>
            );
          })}
        </div>
        <div className="flex gap-sm">
          <input
            value={novaCat}
            onChange={(e) => setNovaCat(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && novaCat.trim()) {
                setCategorias([...categorias, novaCat.trim()]);
                setNovaCat("");
              }
            }}
            placeholder="Nova categoria (ex.: Embutidos, Bebidas...)"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-md outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              if (novaCat.trim()) {
                setCategorias([...categorias, novaCat.trim()]);
                setNovaCat("");
              }
            }}
            className="flex-shrink-0 rounded-lg border border-outline-variant px-md py-2.5 text-label-md text-primary"
          >
            + Adicionar
          </button>
        </div>
        <p className="text-label-sm text-on-surface-variant">
          Lembre de salvar as configurações no fim da página.
        </p>
      </Secao>

      {/* Vitrine */}
      <Secao icone="image" titulo="Vitrine (banner da loja)">
        <p className="text-label-sm text-on-surface-variant">
          O destaque no topo da loja. Escolha uma foto ou cole uma URL. (Upload de
          arquivo entra com o Supabase.)
        </p>
        <Campo rotulo="Etiqueta" valor={heroTag} onChange={setHeroTag} />
        <Campo rotulo="Título" valor={heroTitulo} onChange={setHeroTitulo} />
        <div>
          <label className="block text-label-md text-on-surface">Foto do banner</label>
          <div className="mt-1 flex flex-wrap gap-sm">
            <button
              onClick={() => setHeroImg("")}
              className={`flex h-16 w-24 flex-col items-center justify-center rounded-lg border text-label-sm ${
                heroImg === ""
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-outline-variant text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">gradient</span>
              Gradiente
            </button>
            {FOTOS_VITRINE.map((src) => (
              <button
                key={src}
                onClick={() => setHeroImg(src)}
                className={`h-16 w-24 overflow-hidden rounded-lg border-2 ${
                  heroImg === src ? "border-primary" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <input
            value={heroImg.startsWith("/produtos") ? "" : heroImg}
            onChange={(e) => setHeroImg(e.target.value)}
            placeholder="Ou cole uma URL de imagem (https://...)"
            className="mt-sm w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
          />
        </div>
      </Secao>

      {/* Horário de atendimento */}
      <Secao icone="schedule" titulo="Horário de atendimento">
        <p className="text-label-sm text-on-surface-variant">
          Fora do horário, o delivery mostra a loja como fechada.
        </p>
        <div className="space-y-1">
          {horarios.map((h, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-sm rounded-lg border border-outline-variant/50 px-md py-2"
            >
              <button
                onClick={() => updHorario(i, { aberto: !h.aberto })}
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                  h.aberto ? "bg-tertiary" : "bg-outline-variant"
                }`}
                aria-label={`${DIAS_SEMANA[i]} ${h.aberto ? "aberto" : "fechado"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    h.aberto ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
              <span className="w-16 text-body-md text-on-surface">
                {DIAS_SEMANA[i]}
              </span>
              {h.aberto ? (
                <div className="flex items-center gap-1 text-body-md text-on-surface">
                  <input
                    type="time"
                    value={h.abre}
                    onChange={(e) => updHorario(i, { abre: e.target.value })}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 outline-none focus:border-primary"
                  />
                  <span className="text-on-surface-variant">às</span>
                  <input
                    type="time"
                    value={h.fecha}
                    onChange={(e) => updHorario(i, { fecha: e.target.value })}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <span className="text-label-md text-on-surface-variant">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </Secao>

      {/* Dias personalizados */}
      <Secao icone="event" titulo="Dias personalizados">
        <p className="text-label-sm text-on-surface-variant">
          Um feriado ou um dia com horário diferente. Sobrepõe o horário semanal.
        </p>
        <div className="space-y-md">
          {excecoes.map((e, i) => (
            <div
              key={i}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-md"
            >
              <div className="flex flex-wrap items-center gap-sm">
                <input
                  type="date"
                  value={e.data}
                  onChange={(ev) => updExcecao(i, { data: ev.target.value })}
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-body-md outline-none focus:border-primary"
                />
                <button
                  onClick={() => updExcecao(i, { aberto: !e.aberto })}
                  className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                    e.aberto ? "bg-tertiary" : "bg-outline-variant"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      e.aberto ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
                <span className="text-label-md text-on-surface">
                  {e.aberto ? "Aberto" : "Fechado"}
                </span>
                <button
                  onClick={() => delExcecao(i)}
                  className="material-symbols-outlined ml-auto text-danger-red"
                  title="Excluir"
                >
                  delete
                </button>
              </div>
              {e.aberto && (
                <div className="mt-sm flex items-center gap-1 text-body-md text-on-surface">
                  <input
                    type="time"
                    value={e.abre}
                    onChange={(ev) => updExcecao(i, { abre: ev.target.value })}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 outline-none focus:border-primary"
                  />
                  <span className="text-on-surface-variant">às</span>
                  <input
                    type="time"
                    value={e.fecha}
                    onChange={(ev) => updExcecao(i, { fecha: ev.target.value })}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 outline-none focus:border-primary"
                  />
                </div>
              )}
              <input
                value={e.motivo}
                onChange={(ev) => updExcecao(i, { motivo: ev.target.value })}
                placeholder="Motivo (ex.: Feriado, Confraternização) — opcional"
                className="mt-sm w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
              />
            </div>
          ))}
          <button
            onClick={addExcecao}
            className="flex items-center gap-1 text-label-md text-secondary"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar dia personalizado
          </button>
        </div>
      </Secao>

      {/* Entrega */}
      <Secao icone="local_shipping" titulo="Entrega">
        <Campo
          rotulo="Taxa de entrega"
          prefixo="R$"
          valor={taxa}
          onChange={setTaxa}
          dica="Cobrada no checkout do delivery."
        />
        <Campo
          rotulo="Tempo de preparo padrão"
          sufixo="min"
          valor={preparoMin}
          onChange={setPreparoMin}
          dica="Base para a previsão de entrega mostrada ao cliente."
        />
        <Campo
          rotulo="Pedido mínimo (entrega)"
          prefixo="R$"
          valor={pedidoMinimo}
          onChange={setPedidoMinimo}
          dica="0 = sem mínimo. Abaixo disso, o cliente não fecha o pedido de entrega."
        />
      </Secao>

      {/* Zonas e taxas */}
      <Secao icone="map" titulo="Zonas e taxas de entrega">
        <div className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant">
          {ZONAS.map((z) => (
            <div key={z.id} className="flex items-center justify-between px-md py-2.5">
              <span className="text-body-md text-on-surface">
                {z.nome}{" "}
                <span className="text-label-sm text-on-surface-variant">
                  · {z.prazo}
                </span>
              </span>
              <span className="font-label-md text-label-md text-primary">
                {brl(z.taxa)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-label-sm text-on-surface-variant">
          O cliente escolhe a zona no checkout e a taxa é aplicada. Retirada na
          loja é sempre grátis. (Edição das zonas entra com o Supabase.)
        </p>
      </Secao>

      {/* Cupons */}
      <Secao icone="local_activity" titulo="Cupons de desconto">
        <p className="text-label-sm text-on-surface-variant">
          Crie cupons e defina a partir de qual valor de compra eles valem.
        </p>
        <div className="space-y-md">
          {cupons.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-md"
            >
              <div className="flex items-center gap-sm">
                <input
                  value={c.codigo}
                  onChange={(e) => updCupom(i, { codigo: e.target.value.toUpperCase() })}
                  placeholder="CÓDIGO"
                  className="w-full flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-lg font-semibold uppercase tracking-wide outline-none focus:border-primary"
                />
                <label className="flex flex-shrink-0 cursor-pointer items-center gap-1 text-label-sm text-on-surface">
                  <input
                    type="checkbox"
                    checked={c.ativo}
                    onChange={(e) => updCupom(i, { ativo: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Ativo
                </label>
                <button
                  onClick={() => delCupom(i)}
                  className="material-symbols-outlined text-danger-red"
                  title="Excluir cupom"
                >
                  delete
                </button>
              </div>

              <div className="mt-sm grid grid-cols-2 gap-sm sm:grid-cols-3">
                <label className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                  <select
                    value={c.tipo}
                    onChange={(e) =>
                      updCupom(i, { tipo: e.target.value as CupomCfg["tipo"] })
                    }
                    className="w-full bg-transparent text-body-md outline-none"
                  >
                    <option value="percent">Desconto %</option>
                    <option value="reais">Desconto R$</option>
                  </select>
                </label>
                <div className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2">
                  <span className="text-label-sm text-on-surface-variant">
                    {c.tipo === "percent" ? "%" : "R$"}
                  </span>
                  <input
                    value={String(c.valor)}
                    onChange={(e) => updCupom(i, { valor: num(e.target.value) })}
                    inputMode="decimal"
                    className="w-full bg-transparent text-body-md outline-none"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 sm:col-span-1">
                  <span className="text-label-sm text-on-surface-variant">
                    a partir de R$
                  </span>
                  <input
                    value={String(c.minimo)}
                    onChange={(e) => updCupom(i, { minimo: num(e.target.value) })}
                    inputMode="decimal"
                    placeholder="0"
                    className="w-full bg-transparent text-body-md outline-none"
                  />
                </div>
              </div>

              <input
                value={c.descricao}
                onChange={(e) => updCupom(i, { descricao: e.target.value })}
                placeholder="Descrição (ex.: 10% de boas-vindas)"
                className="mt-sm w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2 text-body-md outline-none focus:border-primary"
              />
            </div>
          ))}
          <button
            onClick={addCupom}
            className="flex items-center gap-1 text-label-md text-secondary"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar cupom
          </button>
        </div>
      </Secao>

      {/* Produtos por peso */}
      <Secao icone="scale" titulo="Produtos por peso">
        <Campo
          rotulo="Tolerância de corte"
          sufixo="%"
          valor={toleranciaCorte}
          onChange={setToleranciaCorte}
          dica="Variação aceita entre o peso escolhido e o peso real cortado (o '±'). Ex.: 10% = 200g pode sair entre 180g e 220g sem reajuste."
        />
      </Secao>

      {/* Cashback */}
      <Secao icone="loyalty" titulo="Cashback (clube do queijo)">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-md text-on-surface">Ativar cashback</p>
            <p className="text-label-sm text-on-surface-variant">
              O cliente ganha crédito a cada compra pra usar na próxima.
            </p>
          </div>
          <button
            onClick={() => setCashbackAtivo((v) => !v)}
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
              cashbackAtivo ? "bg-tertiary" : "bg-outline-variant"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                cashbackAtivo ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {cashbackAtivo && (
          <Campo
            rotulo="Percentual de cashback"
            sufixo="%"
            valor={cashbackPct}
            onChange={setCashbackPct}
            dica="Ex.: 3% = a cada R$ 100, o cliente ganha R$ 3 de crédito."
          />
        )}
      </Secao>

      {/* Pagamento */}
      <Secao icone="payments" titulo="Pagamento">
        <Campo
          rotulo="Desconto no Pix"
          sufixo="%"
          valor={pix}
          onChange={setPix}
          dica="Desconto aplicado quando o cliente escolhe Pix."
        />
        <Campo
          rotulo="Chave Pix"
          valor={pixChave}
          onChange={setPixChave}
          dica="Mostrada ao cliente no checkout e enviada no WhatsApp do pedido."
        />
      </Secao>

      {/* Atendimento */}
      <Secao icone="support_agent" titulo="Atendimento">
        <Campo
          rotulo="WhatsApp de atendimento"
          valor={whatsapp}
          onChange={setWhatsapp}
          dica="Botão 'Falar no WhatsApp' do delivery aponta para cá."
        />
        <Campo
          rotulo="Instagram (@ ou link)"
          valor={instagram}
          onChange={setInstagram}
          dica="Aparece no aviso de loja fechada, para o cliente seguir."
        />
        <Campo
          rotulo="Facebook (link)"
          valor={facebook}
          onChange={setFacebook}
        />
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-label-md text-on-surface">Som de novo pedido</p>
            <p className="text-label-sm text-on-surface-variant">
              Toca um alerta no PDV quando entra pedido de delivery.
            </p>
          </div>
          <button
            onClick={() => setSomPedido((v) => !v)}
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
              somPedido ? "bg-tertiary" : "bg-outline-variant"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                somPedido ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </Secao>

      {/* Salvar */}
      <div className="flex items-center gap-md">
        <button
          onClick={salvar}
          className="rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98]"
        >
          Salvar configurações
        </button>
        {salvo && (
          <span className="flex items-center gap-1 text-label-md text-tertiary">
            <span className="material-symbols-outlined">check_circle</span>
            Salvo!
          </span>
        )}
      </div>
      <p className="text-caption text-on-surface-variant">
        * Salvo neste aparelho e já vale para o delivery (taxa, Pix, tempo,
        cashback). Ao ligar o Supabase, passa a valer por loja em todos os
        aparelhos.
      </p>
    </div>
  );
}

function ToggleLinha({
  titulo,
  sub,
  ativo,
  onToggle,
}: {
  titulo: string;
  sub: string;
  ativo: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-md">
      <div>
        <p className="text-label-md text-on-surface">{titulo}</p>
        <p className="text-label-sm text-on-surface-variant">{sub}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
          ativo ? "bg-tertiary" : "bg-outline-variant"
        }`}
        aria-pressed={ativo}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            ativo ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Secao({
  icone,
  titulo,
  children,
}: {
  icone: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="mb-md flex items-center gap-sm">
        <span className="material-symbols-outlined text-secondary">{icone}</span>
        <h2 className="font-headline-md text-headline-md text-on-surface">
          {titulo}
        </h2>
      </div>
      <div className="space-y-md">{children}</div>
    </section>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  prefixo,
  sufixo,
  dica,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  prefixo?: string;
  sufixo?: string;
  dica?: string;
}) {
  return (
    <div>
      <label className="block text-label-md text-on-surface">{rotulo}</label>
      <div className="mt-1 flex items-center gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 focus-within:border-primary">
        {prefixo && (
          <span className="text-body-md text-on-surface-variant">{prefixo}</span>
        )}
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-body-lg outline-none"
        />
        {sufixo && (
          <span className="text-body-md text-on-surface-variant">{sufixo}</span>
        )}
      </div>
      {dica && (
        <p className="mt-1 text-label-sm text-on-surface-variant">{dica}</p>
      )}
    </div>
  );
}
