import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase do navegador. Lê as chaves das variáveis de ambiente
// (NEXT_PUBLIC_*, definidas na Vercel). Se não estiverem configuradas, o
// cliente fica null e o app continua no modo localStorage — nada quebra.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anon);

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url as string, anon as string, {
      auth: { persistSession: false },
    })
  : null;
