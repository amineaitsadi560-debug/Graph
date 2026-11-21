import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const configured = Boolean(url && anon && !url.includes('YOUR-PROJECT'));

// Only the public anon key is ever used in the browser. Data is protected by Row Level Security.
export const supabase = createClient(
  configured ? url! : 'http://localhost:54321',
  configured ? anon! : 'public-anon-key-placeholder',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
