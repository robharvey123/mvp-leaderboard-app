import { createClient } from "@supabase/supabase-js";

// Read from Vite env
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Fail fast in dev so you don't get silent blanks later
  // eslint-disable-next-line no-console
  console.error("[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url!, anon!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { "x-client-info": "mvp-ui" },
  },
});

// Helpful dev logging
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info("[supabase] using", {
    url: (supabase as any).supabaseUrl,
    functionsUrl: (supabase as any).functionsUrl,
  });
}
