"use client";

// Comanda em layout de impressora térmica (bobina 80mm). Fica escondida na tela
// e só aparece ao imprimir (window.print). O operador imprime manualmente ou
// de forma automática quando entra um pedido novo (ver Recebimento).

import type { PedidoLive } from "@/lib/pedidos-store";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function telFmt(t?: string) {
  const d = (t ?? "").replace(/\D/g, "");
  if (d.length < 10) return t ?? "";
  const cel = d.length === 11;
  return `(${d.slice(0, 2)}) ${d.slice(2, cel ? 7 : 6)}-${d.slice(cel ? 7 : 6)}`;
}

export function ComandaTermica({ pedido }: { pedido: PedidoLive | null }) {
  return (
    <>
      {/* Só imprime esta área; o resto da página fica oculto. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .comanda-print, .comanda-print * { visibility: visible !important; }
          .comanda-print {
            position: absolute; left: 0; top: 0;
            width: 80mm; padding: 2mm 3mm; margin: 0;
            color: #000; background: #fff;
          }
          @page { size: 80mm auto; margin: 0; }
        }
      `}</style>

      {pedido && (
        <div
          className="comanda-print hidden"
          style={{
            fontFamily:
              "ui-monospace, 'Courier New', Courier, monospace",
            fontSize: "12px",
            lineHeight: 1.35,
            color: "#000",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>
              ARMAZÉM DO QUEIJO
            </div>
            <div>Comanda #{pedido.numero}</div>
            <div>
              {new Date(pedido.criadoEm).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" · "}
              {pedido.canal}
            </div>
            {pedido.agendado && (
              <div style={{ fontWeight: 700 }}>*** AGENDADO ***</div>
            )}
          </div>

          <Hr />

          <div style={{ fontWeight: 700 }}>{pedido.cliente}</div>
          {pedido.telefone && <div>{telFmt(pedido.telefone)}</div>}
          <div>
            {pedido.modo === "retirada"
              ? "RETIRADA NA LOJA"
              : `ENTREGA: ${pedido.entrega}`}
          </div>

          <Hr />

          {pedido.itens.map((it, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>
                  {it.qtd} {it.nome}
                </span>
                <span>{brl(it.preco)}</span>
              </div>
              {(it.adicionais ?? []).map((a, j) => (
                <div key={j} style={{ paddingLeft: "10px" }}>
                  + {a.nome} ({brl(a.preco)})
                </div>
              ))}
            </div>
          ))}

          <Hr />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span>TOTAL</span>
            <span>{brl(pedido.total)}</span>
          </div>
          <div>Pagamento: {pedido.pagamento}</div>

          {pedido.observacao && (
            <>
              <Hr />
              <div>Obs.: {pedido.observacao}</div>
            </>
          )}

          <Hr />
          <div style={{ textAlign: "center", marginTop: "2px" }}>
            Obrigado pela preferência! 🧀
          </div>
        </div>
      )}
    </>
  );
}

function Hr() {
  return (
    <div
      style={{
        borderTop: "1px dashed #000",
        margin: "4px 0",
      }}
    />
  );
}
