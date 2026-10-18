// Animação de "enviar para o carrinho": uma bolinha com a foto do produto
// voa do botão até a barra do carrinho, que dá um pulinho ao receber.
// Usa a Web Animations API (sem libs). Seguro no servidor (no-op).

export function flyToCart(fromEl: HTMLElement | null, imgSrc?: string) {
  if (typeof window === "undefined" || !fromEl) return;
  // Respeita quem prefere menos animação.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const from = fromEl.getBoundingClientRect();
  const alvo = document.getElementById("barra-carrinho");
  const to = alvo?.getBoundingClientRect();

  const size = 46;
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;

  const bolha = document.createElement("div");
  bolha.style.cssText = [
    "position:fixed",
    `left:${cx - size / 2}px`,
    `top:${cy - size / 2}px`,
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:9999px",
    "z-index:9999",
    "pointer-events:none",
    "overflow:hidden",
    "box-shadow:0 8px 20px rgba(0,0,0,.28)",
    "background:#6b2d2d",
    "display:flex",
    "align-items:center",
    "justify-content:center",
  ].join(";");

  if (imgSrc) {
    const img = document.createElement("img");
    img.src = imgSrc;
    img.style.cssText = "width:100%;height:100%;object-fit:cover";
    bolha.appendChild(img);
  } else {
    bolha.innerHTML =
      '<span style="color:#fff;font-weight:700;font-size:16px">+1</span>';
  }
  document.body.appendChild(bolha);

  const destX = to ? to.left + to.width / 2 : window.innerWidth / 2;
  const destY = to ? to.top + to.height / 2 : window.innerHeight - 44;
  const dx = destX - cx;
  const dy = destY - cy;

  const anim = bolha.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 70}px) scale(.92)`,
        opacity: 1,
        offset: 0.6,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: 0.35 },
    ],
    { duration: 680, easing: "cubic-bezier(.5,-0.15,.3,1)" }
  );

  anim.onfinish = () => {
    bolha.remove();
    alvo?.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)" },
        { transform: "scale(1)" },
      ],
      { duration: 340, easing: "ease-out" }
    );
  };
}
