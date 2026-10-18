"use client";

// Indicador de etapas do checkout: Você → Endereço → Revisão.
// Para retirada na loja, a etapa de endereço é omitida.

type Chave = "identificacao" | "endereco" | "revisao";

export function CheckoutStepper({
  atual,
  modo,
}: {
  atual: Chave;
  modo?: "entrega" | "retirada";
}) {
  const passos: { k: Chave; label: string; icone: string }[] =
    modo === "retirada"
      ? [
          { k: "identificacao", label: "Você", icone: "person" },
          { k: "revisao", label: "Revisão", icone: "receipt_long" },
        ]
      : [
          { k: "identificacao", label: "Você", icone: "person" },
          { k: "endereco", label: "Endereço", icone: "location_on" },
          { k: "revisao", label: "Revisão", icone: "receipt_long" },
        ];
  const idx = Math.max(0, passos.findIndex((p) => p.k === atual));

  return (
    <div className="flex items-center justify-center gap-1 px-md py-md">
      {passos.map((p, i) => {
        const feito = i < idx;
        const ativo = i === idx;
        return (
          <div key={p.k} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                  feito
                    ? "border-tertiary bg-tertiary text-on-tertiary"
                    : ativo
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {feito ? "check" : p.icone}
                </span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  ativo
                    ? "text-primary"
                    : feito
                      ? "text-tertiary"
                      : "text-on-surface-variant"
                }`}
              >
                {p.label}
              </span>
            </div>
            {i < passos.length - 1 && (
              <div
                className={`mb-4 h-0.5 w-8 rounded-full sm:w-14 ${
                  i < idx ? "bg-tertiary" : "bg-outline-variant/50"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
