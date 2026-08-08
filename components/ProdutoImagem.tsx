"use client";

import { useState } from "react";

// Mostra a foto do produto; se falhar (ex.: offline sem cache), cai
// graciosamente para o gradiente + ícone da marca. Nunca quebra o layout.
export function ProdutoImagem({
  src,
  alt,
  icone,
  className = "",
  iconSize = 56,
}: {
  src: string;
  alt: string;
  icone: string;
  className?: string;
  iconSize?: number;
}) {
  const [erro, setErro] = useState(false);

  if (erro) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-secondary-container to-primary-container/20 ${className}`}
      >
        <span
          className="material-symbols-outlined text-primary/40"
          style={{ fontSize: iconSize }}
        >
          {icone}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setErro(true)}
      className={`object-cover ${className}`}
    />
  );
}
