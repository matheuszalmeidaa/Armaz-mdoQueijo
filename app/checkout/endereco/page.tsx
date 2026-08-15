"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";

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

  const valido =
    rua.trim().length > 2 && numero.trim().length > 0 && bairro.trim().length > 1;

  function usarLocalizacao() {
    if (!navigator.geolocation) {
      setGeoStatus("erro");
      return;
    }
    setGeoStatus("carregando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDados({
          geoLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
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

      <div className="px-md pt-lg">
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
            Ainda assim, confirme rua, número e bairro abaixo (número obrigatório).
          </p>
        )}

        <div className="mt-sm space-y-sm">
          <div className="grid grid-cols-3 gap-sm">
            <CampoEnd
              className="col-span-2"
              rotulo="Rua"
              valor={rua}
              onChange={setRua}
              placeholder="Nome da rua"
            />
            <CampoEnd
              rotulo="Número"
              valor={numero}
              onChange={setNumero}
              placeholder="123"
            />
          </div>
          <CampoEnd
            rotulo="Complemento (opcional)"
            valor={complemento}
            onChange={setComplemento}
            placeholder="Apto, bloco, casa..."
          />
          <CampoEnd
            rotulo="Bairro"
            valor={bairro}
            onChange={setBairro}
            placeholder="Seu bairro"
          />
          <CampoEnd
            rotulo="Ponto de referência (opcional)"
            valor={referencia}
            onChange={setReferencia}
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
