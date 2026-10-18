"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { CheckoutStepper } from "@/components/CheckoutStepper";
import { ResumoPedidoMini } from "@/components/ResumoPedidoMini";
import {
  useEnderecos,
  salvarEndereco,
  removerEndereco,
  type EnderecoSalvo,
} from "@/lib/enderecos";

// Mascara dados sensíveis, como no design ("Math***", "73998112***")
function mascarar(valor: string, visiveis: number) {
  if (!valor) return "";
  const limpo = valor.trim();
  return limpo.slice(0, visiveis) + "***";
}

export default function Endereco() {
  const router = useRouter();
  const { dados, setDados } = useCart();
  const [geoStatus, setGeoStatus] = useState<"" | "carregando" | "ok" | "erro">("");
  const [rua, setRua] = useState(dados.rua ?? "");
  const [numero, setNumero] = useState(dados.numero ?? "");
  const [complemento, setComplemento] = useState(dados.complemento ?? "");
  const [bairro, setBairro] = useState(dados.bairro ?? "");
  const [referencia, setReferencia] = useState(dados.referencia ?? "");
  const [selId, setSelId] = useState<string | null>(null);
  const enderecos = useEnderecos();

  const valido =
    rua.trim().length > 2 && numero.trim().length > 0 && bairro.trim().length > 1;

  function escolher(e: EnderecoSalvo) {
    setSelId(e.id);
    setRua(e.rua);
    setNumero(e.numero);
    setComplemento(e.complemento ?? "");
    setBairro(e.bairro);
    setReferencia(e.referencia ?? "");
    if (e.geoLink) setDados({ geoLink: e.geoLink });
  }
  function novoEndereco() {
    setSelId(null);
    setRua("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setReferencia("");
  }

  function usarLocalizacao() {
    if (!navigator.geolocation) {
      setGeoStatus("erro");
      return;
    }
    setGeoStatus("carregando");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setDados({
          geoLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
        // Converte as coordenadas em endereço (rua/bairro) e preenche os campos,
        // deixando a pessoa revisar. O número continua manual (obrigatório).
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&accept-language=pt-BR&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const a = data?.address ?? {};
          const ruaGeo =
            a.road || a.pedestrian || a.footway || a.residential || a.path || "";
          const bairroGeo =
            a.suburb ||
            a.neighbourhood ||
            a.city_district ||
            a.quarter ||
            a.village ||
            a.town ||
            "";
          if (ruaGeo) setRua(ruaGeo);
          if (bairroGeo) setBairro(bairroGeo);
        } catch {
          // Sem internet/serviço: mantém só o link do mapa; a pessoa digita.
        }
        setGeoStatus("ok");
      },
      () => setGeoStatus("erro"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function confirmar() {
    if (!valido) return;
    const enderecoStr =
      `${rua.trim()}, ${numero.trim()}` +
      (complemento.trim() ? ` — ${complemento.trim()}` : "") +
      ` — ${bairro.trim()}` +
      (referencia.trim() ? ` (ref: ${referencia.trim()})` : "");
    setDados({
      rua: rua.trim(),
      numero: numero.trim(),
      complemento: complemento.trim(),
      bairro: bairro.trim(),
      referencia: referencia.trim(),
      endereco: enderecoStr,
    });
    // Guarda/atualiza no catálogo de endereços deste aparelho.
    salvarEndereco({
      rua: rua.trim(),
      numero: numero.trim(),
      complemento: complemento.trim() || undefined,
      bairro: bairro.trim(),
      referencia: referencia.trim() || undefined,
      geoLink: dados.geoLink,
    });
    router.push("/checkout/revisao");
  }

  return (
    <main className="mx-auto min-h-full max-w-[28rem] pb-28">
      <header className="sticky top-0 z-50 flex items-center gap-md border-b border-outline-variant/30 bg-surface/90 px-md py-sm backdrop-blur-md">
        <Link
          href="/checkout/identificacao"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="font-headline-md text-headline-md text-primary">
          Adicione seu endereço
        </span>
      </header>

      <CheckoutStepper atual="endereco" modo="entrega" />

      <ResumoPedidoMini />

      <div className="px-md pt-sm">
        {/* Minhas informações (mascaradas) */}
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Minhas informações
        </h2>
        <div className="mt-sm rounded-xl bg-surface-container-lowest p-md shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-md">
              <InfoLinha icone="person" rotulo="Nome" valor={dados.nome ?? "—"} />
              <InfoLinha
                icone="call"
                rotulo="Telefone"
                valor={dados.telefone ?? "—"}
              />
            </div>
            <Link
              href="/checkout/identificacao"
              className="flex items-center gap-1 text-label-md text-tertiary"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Mudar
            </Link>
          </div>
        </div>

        {/* Endereço de entrega */}
        <h2 className="mt-lg font-headline-md text-headline-md text-on-surface">
          Endereço de entrega
        </h2>

        {/* Endereços salvos — escolher um já cadastrado */}
        {enderecos.length > 0 && (
          <div className="mt-sm space-y-sm">
            <p className="text-label-sm text-on-surface-variant">
              Seus endereços
            </p>
            {enderecos.map((e) => {
              const ativo = selId === e.id;
              return (
                <div
                  key={e.id}
                  className={`flex items-start gap-sm rounded-xl border px-md py-3 transition-colors ${
                    ativo
                      ? "border-primary bg-primary-container/5"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
                >
                  <button
                    onClick={() => escolher(e)}
                    className="flex min-w-0 flex-grow items-start gap-sm text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        ativo ? "border-primary" : "border-outline-variant"
                      }`}
                    >
                      {ativo && (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-label-md text-on-surface">
                        {e.rua}, {e.numero}
                        {e.complemento ? ` — ${e.complemento}` : ""}
                      </span>
                      <span className="block truncate text-caption text-on-surface-variant">
                        {e.bairro}
                        {e.referencia ? ` · ${e.referencia}` : ""}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      removerEndereco(e.id);
                      if (selId === e.id) novoEndereco();
                    }}
                    className="flex-shrink-0 text-danger-red active:scale-90"
                    aria-label="Remover endereço"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      delete
                    </span>
                  </button>
                </div>
              );
            })}
            <button
              onClick={novoEndereco}
              className="flex items-center gap-1 text-label-md text-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_location_alt
              </span>
              Usar um novo endereço
            </button>
          </div>
        )}

        <button
          onClick={usarLocalizacao}
          className="mt-sm flex w-full items-center justify-center gap-sm rounded-lg border border-primary/40 bg-primary-container/5 py-3 text-label-md font-medium text-primary active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[20px]">
            {geoStatus === "ok" ? "check_circle" : "my_location"}
          </span>
          {geoStatus === "carregando"
            ? "Obtendo localização..."
            : geoStatus === "ok"
              ? "Localização anexada ✓"
              : "Usar minha localização"}
        </button>
        {geoStatus === "erro" && (
          <p className="mt-1 text-label-sm text-danger-red">
            Não foi possível obter a localização. Preencha o endereço abaixo.
          </p>
        )}
        {geoStatus === "ok" && (
          <p className="mt-1 text-label-sm text-on-surface-variant">
            Preenchemos a rua e o bairro pela sua localização — confira e
            complete o <strong>número</strong> (obrigatório).
          </p>
        )}

        <div className="mt-sm space-y-sm">
          <div className="grid grid-cols-3 gap-sm">
            <CampoEnd
              className="col-span-2"
              rotulo="Rua"
              valor={rua}
              onChange={(v) => {
                setRua(v);
                setSelId(null);
              }}
              placeholder="Nome da rua"
            />
            <CampoEnd
              rotulo="Número"
              valor={numero}
              onChange={(v) => {
                setNumero(v);
                setSelId(null);
              }}
              placeholder="123"
            />
          </div>
          <CampoEnd
            rotulo="Complemento (opcional)"
            valor={complemento}
            onChange={(v) => {
              setComplemento(v);
              setSelId(null);
            }}
            placeholder="Apto, bloco, casa..."
          />
          <CampoEnd
            rotulo="Bairro"
            valor={bairro}
            onChange={(v) => {
              setBairro(v);
              setSelId(null);
            }}
            placeholder="Seu bairro"
          />
          <CampoEnd
            rotulo="Ponto de referência (opcional)"
            valor={referencia}
            onChange={(v) => {
              setReferencia(v);
              setSelId(null);
            }}
            placeholder="Perto de..., portão azul..."
          />
        </div>
      </div>

      {/* Botão */}
      <div className="glass-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[28rem] -translate-x-1/2 border-t border-outline-variant/20 bg-surface/95 px-md py-sm backdrop-blur-md">
        <button
          onClick={confirmar}
          disabled={!valido}
          className="w-full rounded-lg bg-primary px-lg py-4 text-body-lg font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          Confirmar o endereço
        </button>
      </div>
    </main>
  );
}

function CampoEnd({
  rotulo,
  valor,
  onChange,
  placeholder,
  className,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-label-sm text-on-surface-variant">{rotulo}</label>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-2.5 text-body-lg outline-none placeholder:text-on-surface-variant/50 focus:border-primary"
      />
    </div>
  );
}

function InfoLinha({
  icone,
  rotulo,
  valor,
}: {
  icone: string;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-sm">
      <span className="material-symbols-outlined text-primary">{icone}</span>
      <div className="leading-tight">
        <span className="block text-label-sm text-on-surface-variant">
          {rotulo}
        </span>
        <span className="block text-body-lg text-on-surface">
          {valor || "—"}
        </span>
      </div>
    </div>
  );
}
