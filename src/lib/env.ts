export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const DEFAULT_CLUB_ID = import.meta.env.VITE_CLUB_ID as string | undefined;

export const envOk = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
