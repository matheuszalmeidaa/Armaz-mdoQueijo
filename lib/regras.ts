// ============================================================
// REGRAS DO ESTABELECIMENTO
// Hoje ficam aqui (valores padrão). No futuro virão do Supabase e serão
// EDITÁVEIS pelo lojista no Painel do Lojista — cada loja define as suas.
// Centralizado para nunca espalhar número mágico pelo app.
// ============================================================

export const REGRAS = {
  frete: 15.0, // taxa de entrega
  descontoPix: 0.05, // 5% no Pix
  tempoEntregaMin: 45, // minutos
  tempoEntregaMax: 60,
};
