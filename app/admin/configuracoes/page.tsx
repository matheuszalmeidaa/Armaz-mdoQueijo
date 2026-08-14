"use client";

import { useEffect, useState } from "react";
import { ZONAS } from "@/lib/regras";
import {
  CONFIG_PADRAO,
  lerConfig,
  salvarConfig,
  type ConfigLoja,
  type CupomCfg,
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
  const [salvo, setSalvo] = useState(false);

  // Carrega o que já foi salvo (localStorage) ao abrir a tela.
  useEffect(() => {
    const c = lerConfig();
    setTaxa(String(c.frete));
    setPix(String(Math.round(c.descontoPix * 100)));
    setPreparoMin(String(c.tempoEntregaMin));
    setToleranciaCorte(String(c.toleranciaCorte));
    setWhatsapp(c.whatsapp);
    setSomPedido(c.somPedido);
    setCashbackAtivo(c.cashbackAtivo);
    setCashbackPct(String(Math.round(c.cashbackPercent * 100)));
    setCupons(c.cupons);
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
      </Secao>

      {/* Atendimento */}
      <Secao icone="support_agent" titulo="Atendimento">
        <Campo
          rotulo="WhatsApp de atendimento"
          valor={whatsapp}
          onChange={setWhatsapp}
          dica="Botão 'Falar no WhatsApp' do delivery aponta para cá."
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
