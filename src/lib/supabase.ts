import { createClient } from "@supabase/supabase-js";

// Cliente server-only. Usa la service_role key: nunca debe importarse desde
// un componente cliente ni exponerse al navegador. Todas las páginas y
// server actions de este proyecto son Server Components / 'use server',
// así que esto corre siempre en el servidor.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en las variables de entorno."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
