"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Destino = { id: string; rota: string; label: string; chamada: string };
const DESTINOS: Destino[] = [
  {
    id: "loja",
    rota: "/loja",
    label: "Cardápio (delivery)",
    chamada: "Peça pelo celular",
  },
  {
    id: "atacado",
    rota: "/pedidos-atacado",
    label: "Atacado",
    chamada: "Faça seu pedido no atacado",
  },
];

export default function QrCodePage() {
  const [origin, setOrigin] = useState("");
  const [destinoId, setDestinoId] = useState("loja");
  const [dataUrl, setDataUrl] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const destino = DESTINOS.find((d) => d.id === destinoId) ?? DESTINOS[0];
  const url = useMemo(
    () => (origin ? `${origin}${destino.rota}` : ""),
    [origin, destino]
  );

  // Gera o QR (alta correção de erro p/ aguentar impressão/desgaste).
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 1024,
      color: { dark: "#3a2a1a", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [url]);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  }

  function baixar() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `armazem-qrcode-${destino.id}.png`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-lg">
      <div className="no-print">
        <h1 className="font-headline-lg text-headline-lg text-primary">
          QR Code do cardápio
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Imprima e deixe na mesa, no balcão ou na vitrine. O cliente aponta a
          câmera e cai direto no seu cardápio.
        </p>
      </div>

      {/* Escolha do destino */}
      <div className="no-print flex flex-wrap gap-sm">
        {DESTINOS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDestinoId(d.id)}
            className={`rounded-lg border px-md py-2 text-label-md transition-colors ${
              destinoId === d.id
                ? "border-primary bg-primary text-on-primary"
                : "border-outline-variant bg-surface-container-lowest text-on-surface"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Cartaz imprimível */}
      <div className="flex justify-center">
        <div
          id="cartaz"
          className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-outline-variant/30 bg-white px-lg py-xl text-center shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          <span className="text-caption font-semibold uppercase tracking-[0.2em] text-secondary">
            🧀 Armazém do Queijo
          </span>
          <h2 className="mt-sm font-headline-lg text-headline-lg text-primary">
            {destino.chamada}
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Aponte a câmera do celular
          </p>

          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="QR Code do cardápio"
              className="mt-md h-64 w-64"
            />
          ) : (
            <div className="mt-md flex h-64 w-64 items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-pulse text-[48px]">
                qr_code_2
              </span>
            </div>
          )}

          <p className="mt-md text-label-sm text-on-surface-variant">
            ou acesse
          </p>
          <p className="break-all text-label-md font-semibold text-on-surface">
            {url.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="no-print flex flex-wrap items-center gap-md">
        <button
          onClick={() => window.print()}
          disabled={!dataUrl}
          className="flex items-center gap-2 rounded-lg bg-primary px-lg py-3 text-body-lg font-semibold text-on-primary shadow-lg active:scale-[0.98] disabled:opacity-40"
        >
          <span className="material-symbols-outlined">print</span>
          Imprimir
        </button>
        <button
          onClick={baixar}
          disabled={!dataUrl}
          className="flex items-center gap-2 rounded-lg border border-outline-variant px-lg py-3 text-body-lg text-on-surface active:scale-[0.98] disabled:opacity-40"
        >
          <span className="material-symbols-outlined">download</span>
          Baixar PNG
        </button>
        <button
          onClick={copiarLink}
          className="flex items-center gap-2 text-label-md text-secondary"
        >
          <span className="material-symbols-outlined text-[18px]">
            {copiado ? "check" : "link"}
          </span>
          {copiado ? "Link copiado!" : "Copiar link"}
        </button>
      </div>

      {/* Impressão: mostra só o cartaz, centralizado */}
      <style>{`
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          #cartaz {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
