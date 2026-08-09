import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fixa a raiz do Turbopack neste projeto. Sem isso, o OneDrive faz o Next
  // detectar o package-lock.json em C:\Users\mathe como raiz e bagunçar os
  // caminhos dos assets no dev (CSS/JS chegando quebrados no navegador).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
