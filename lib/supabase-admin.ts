import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente SERVIDOR com a service_role — ignora RLS. NUNCA importar em componente
// de cliente; só em Route Handlers (app/api/**). A chave fica em
// SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC → não vai para o navegador).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminConfigurado = Boolean(url && service);

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}
