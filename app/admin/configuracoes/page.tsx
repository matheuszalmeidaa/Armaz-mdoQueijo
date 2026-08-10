"use client";

import { useState } from "react";
import { REGRAS, ZONAS, CUPONS } from "@/lib/regras";
import { brl } from "@/lib/catalogo";

export default function Configuracoes() {
  // Pré-preenchido com as regras padrão. No futuro salva no Supabase por loja.
  const [taxa, setTaxa] = useState(String(REGRAS.frete));
  const [pix, setPix] = useState(String(Math.round(REGRAS.descontoPix * 100)));
  const [preparoMin, setPreparoMin] = useState(String(REGRAS.tempoEntregaMin));
  const [toleranciaCorte, setToleranciaCorte] = useState("10");
  const [whatsapp, setWhatsapp] = useState("(73) 99811-2345");
  const [somPedido, setSomPedido] = useState(true);
  const [cashbackAtivo, setCashbackAtivo] = useState(REGRAS.cashback.ativo);
  const [cashbackPct, setCashbackPct] = useState(
    String(Math.round(REGRAS.cashback.percent * 100))
  );
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    // Mock: sem Supabase ainda. Aqui persistiria as regras da loja.
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2000);
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
      <Secao icone="local_activity" titulo="Cupons ativos">
        <div className="divide-y divide-outline-variant/20 rounded-lg border border-outline-variant">
          {CUPONS.map((c) => (
            <div key={c.codigo} className="flex items-center justify-between px-md py-2.5">
              <span className="font-label-md text-label-md text-on-surface">
                {c.codigo}
              </span>
              <span className="text-body-md text-on-surface-variant">
                {c.descricao}
              </span>
            </div>
          ))}
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
        * Ainda em maquete — ao ligar o Supabase, isto passa a salvar de verdade
        por loja.
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
