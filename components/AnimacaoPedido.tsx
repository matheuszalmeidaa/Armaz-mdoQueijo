"use client";

// Ilustração animada do pedido em SVG (sem libs), nas cores da marca.
// Entrega: scooter com entregador sai da loja e vai até a casa.
// Retirada: cliente caminha até a loja.

const CORES = {
  vinho: "#6b2d2d",
  vinhoClaro: "#9c4a46",
  creme: "#f7efe2",
  amber: "#e0a458",
  verde: "#5b8f6e",
  telha: "#b5524a",
  cinza: "#cbb9a8",
  escuro: "#3a2a1a",
  pele: "#f1c9a5",
};

export function AnimacaoPedido({ modo }: { modo: "entrega" | "retirada" }) {
  const entrega = modo !== "retirada";
  return (
    <div className="w-full overflow-hidden rounded-xl bg-gradient-to-b from-secondary-container/40 to-primary-container/10">
      <style>{`
        @keyframes apDrive { 0%{transform:translateX(0);opacity:0} 7%{opacity:1} 90%{transform:translateX(250px);opacity:1} 100%{transform:translateX(258px);opacity:0} }
        @keyframes apWalk  { 0%{transform:translateX(0);opacity:0} 9%{opacity:1} 88%{transform:translateX(230px);opacity:1} 100%{transform:translateX(236px);opacity:0} }
        @keyframes apWheel { to { transform: rotate(360deg); } }
        @keyframes apBob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
        @keyframes apStep  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes apPop   { 0%{transform:scale(0)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
        .ap-drive{ animation: apDrive 3.6s ease-in-out infinite; }
        .ap-walk { animation: apWalk 3.6s ease-in-out infinite; }
        .ap-bob  { animation: apBob .5s ease-in-out infinite; }
        .ap-step { animation: apStep .4s ease-in-out infinite; }
        .ap-wheel{ transform-box: fill-box; transform-origin: center; animation: apWheel .5s linear infinite; }
        .ap-pop  { transform-box: fill-box; transform-origin: bottom center; animation: apPop .6s ease-out both; }
      `}</style>

      <svg viewBox="0 0 400 140" className="h-32 w-full" role="img" aria-label="Acompanhamento do pedido">
        {/* céu/sol suave */}
        <circle cx="340" cy="34" r="16" fill={CORES.amber} opacity="0.35" />

        {/* chão */}
        <line x1="0" y1="116" x2="400" y2="116" stroke={CORES.vinho} strokeWidth="2" strokeDasharray="10 8" opacity="0.3" />

        {entrega ? (
          <>
            <Loja x={14} />
            <Casa x={320} pop />
            <g className="ap-drive">
              <g className="ap-bob">
                <Scooter />
              </g>
            </g>
          </>
        ) : (
          <>
            <Loja x={320} />
            <g className="ap-pop">
              <Sacola x={332} />
            </g>
            <g className="ap-walk">
              <Pessoa />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

function Loja({ x }: { x: number }) {
  return (
    <g transform={`translate(${x}, 58)`}>
      {/* corpo */}
      <rect x="0" y="14" width="56" height="44" rx="2" fill={CORES.creme} stroke={CORES.cinza} />
      {/* toldo listrado */}
      <path d="M-4 14 H60 L54 2 H2 Z" fill={CORES.vinho} />
      <path d="M8 14 l4 -12 h8 l-4 12 Z" fill={CORES.creme} opacity="0.9" />
      <path d="M28 14 l4 -12 h8 l-4 12 Z" fill={CORES.creme} opacity="0.9" />
      {/* vitrine */}
      <rect x="6" y="24" width="20" height="18" rx="1" fill={CORES.verde} opacity="0.5" />
      {/* porta */}
      <rect x="34" y="30" width="14" height="28" rx="1" fill={CORES.vinhoClaro} />
      {/* placa */}
      <rect x="16" y="6" width="22" height="9" rx="2" fill={CORES.escuro} />
      <text x="27" y="13" textAnchor="middle" fontSize="6" fill={CORES.creme} fontWeight="700">
        ARMAZÉM
      </text>
    </g>
  );
}

function Casa({ x, pop }: { x: number; pop?: boolean }) {
  return (
    <g transform={`translate(${x}, 66)`} className={pop ? "ap-pop" : undefined}>
      <rect x="4" y="18" width="48" height="32" rx="2" fill={CORES.creme} stroke={CORES.cinza} />
      <path d="M0 20 L28 0 L56 20 Z" fill={CORES.telha} />
      <rect x="22" y="32" width="14" height="18" rx="1" fill={CORES.vinhoClaro} />
      <rect x="10" y="26" width="9" height="9" rx="1" fill={CORES.amber} opacity="0.7" />
      <rect x="39" y="26" width="9" height="9" rx="1" fill={CORES.amber} opacity="0.7" />
    </g>
  );
}

function Scooter() {
  // centrado em ~ (70..110, y ~ 78..116)
  return (
    <g transform="translate(60, 72)">
      {/* caixa de entrega */}
      <rect x="-10" y="4" width="20" height="18" rx="2" fill={CORES.amber} stroke={CORES.escuro} strokeWidth="0.6" />
      <circle cx="0" cy="13" r="3.2" fill={CORES.creme} />
      {/* corpo da scooter */}
      <path d="M6 26 q14 2 20 -6 l3 6 q4 0 4 4 l-2 4 q-1 6 -7 6 h-3" fill="none" stroke={CORES.vinho} strokeWidth="5" strokeLinecap="round" />
      <path d="M10 30 q10 0 14 -8" fill="none" stroke={CORES.vinhoClaro} strokeWidth="4" strokeLinecap="round" />
      {/* guidão */}
      <line x1="33" y1="18" x2="33" y2="30" stroke={CORES.escuro} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="30" y1="18" x2="38" y2="18" stroke={CORES.escuro} strokeWidth="2.4" strokeLinecap="round" />
      {/* entregador */}
      <circle cx="16" cy="6" r="5" fill={CORES.pele} />
      <path d="M11 6 a5 5 0 0 1 10 0 l0 -1 a5 5 0 0 0 -10 0 Z" fill={CORES.vinho} />
      <path d="M16 11 q6 1 7 9 l-3 1 q-1 -6 -5 -7 Z" fill={CORES.verde} />
      <line x1="19" y1="14" x2="31" y2="20" stroke={CORES.verde} strokeWidth="3" strokeLinecap="round" />
      {/* rodas */}
      <g className="ap-wheel">
        <circle cx="8" cy="40" r="7" fill={CORES.escuro} />
        <circle cx="8" cy="40" r="2.6" fill={CORES.cinza} />
        <line x1="8" y1="34" x2="8" y2="46" stroke={CORES.cinza} strokeWidth="1" />
        <line x1="2" y1="40" x2="14" y2="40" stroke={CORES.cinza} strokeWidth="1" />
      </g>
      <g className="ap-wheel">
        <circle cx="34" cy="40" r="7" fill={CORES.escuro} />
        <circle cx="34" cy="40" r="2.6" fill={CORES.cinza} />
        <line x1="34" y1="34" x2="34" y2="46" stroke={CORES.cinza} strokeWidth="1" />
        <line x1="28" y1="40" x2="40" y2="40" stroke={CORES.cinza} strokeWidth="1" />
      </g>
      {/* risquinhos de velocidade */}
      <line x1="-16" y1="30" x2="-24" y2="30" stroke={CORES.vinho} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="-16" y1="38" x2="-28" y2="38" stroke={CORES.vinho} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
    </g>
  );
}

function Pessoa() {
  return (
    <g transform="translate(50, 70)">
      <g className="ap-step">
        {/* cabeça */}
        <circle cx="10" cy="6" r="6" fill={CORES.pele} />
        <path d="M4 6 a6 6 0 0 1 12 0 l0 -1 a6 6 0 0 0 -12 0 Z" fill={CORES.escuro} />
        {/* tronco */}
        <rect x="4" y="12" width="12" height="20" rx="4" fill={CORES.verde} />
        {/* braço com sacola */}
        <line x1="16" y1="16" x2="22" y2="26" stroke={CORES.pele} strokeWidth="3" strokeLinecap="round" />
        <rect x="20" y="26" width="10" height="11" rx="1.5" fill={CORES.amber} stroke={CORES.escuro} strokeWidth="0.5" />
        <path d="M22 26 q3 -4 6 0" fill="none" stroke={CORES.escuro} strokeWidth="1" />
      </g>
      {/* pernas (alternam leve) */}
      <line x1="8" y1="32" x2="5" y2="46" stroke={CORES.vinho} strokeWidth="3.5" strokeLinecap="round" className="ap-step" />
      <line x1="13" y1="32" x2="16" y2="46" stroke={CORES.vinhoClaro} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  );
}

function Sacola({ x }: { x: number }) {
  return (
    <g transform={`translate(${x}, 96)`}>
      <rect x="0" y="4" width="14" height="16" rx="2" fill={CORES.amber} stroke={CORES.escuro} strokeWidth="0.6" />
      <path d="M3 4 q4 -5 8 0" fill="none" stroke={CORES.escuro} strokeWidth="1.2" />
    </g>
  );
}
