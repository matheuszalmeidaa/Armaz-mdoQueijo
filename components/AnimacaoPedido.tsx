"use client";

// Ilustração animada do pedido: entrega (motoboy da loja → casa) ou
// retirada (cliente indo até a loja). Pura CSS, leve e sem libs.

export function AnimacaoPedido({ modo }: { modo: "entrega" | "retirada" }) {
  const entrega = modo !== "retirada";
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-b from-secondary-container/40 to-primary-container/10">
      <style>{`
        @keyframes apMoto { 0%{left:14%;opacity:0} 10%{opacity:1} 86%{left:70%;opacity:1} 100%{left:72%;opacity:0} }
        @keyframes apAnda { 0%{left:10%;opacity:0} 12%{opacity:1} 84%{left:60%;opacity:1} 100%{left:62%;opacity:0} }
        @keyframes apBob { 0%,100%{transform:translateY(0) scaleX(var(--flip,1))} 50%{transform:translateY(-4px) scaleX(var(--flip,1))} }
        @keyframes apPop { 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
        .ap-moto{ position:absolute; bottom:30px; animation: apMoto 3s ease-in-out infinite; }
        .ap-anda{ position:absolute; bottom:30px; animation: apAnda 3s ease-in-out infinite; }
        .ap-bob{ display:inline-block; animation: apBob .5s ease-in-out infinite; }
        .ap-pop{ display:inline-block; animation: apPop .5s ease-out both; }
      `}</style>

      {/* chão */}
      <div className="absolute inset-x-0 bottom-6 border-t-2 border-dashed border-primary/20" />

      {entrega ? (
        <>
          {/* loja (origem) */}
          <span className="absolute bottom-7 left-[6%] text-[34px]">🏪</span>
          {/* casa (destino) */}
          <span className="absolute bottom-7 right-[8%] text-[34px] ap-pop">
            🏠
          </span>
          {/* motoboy */}
          <span className="ap-moto text-[32px]">
            <span className="ap-bob">🛵</span>
          </span>
        </>
      ) : (
        <>
          {/* loja (destino) */}
          <span className="absolute bottom-7 right-[10%] text-[34px]">🏪</span>
          {/* cliente indo retirar */}
          <span className="ap-anda text-[30px]">
            <span className="ap-bob">🧍</span>
          </span>
          {/* sacola esperando */}
          <span className="absolute bottom-7 right-[8%] text-[20px] ap-pop">
            🛍️
          </span>
        </>
      )}
    </div>
  );
}
