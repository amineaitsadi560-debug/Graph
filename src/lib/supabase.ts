import { createClient } from '@supabase/supabase-js';
import { createDemoClient } from './demo';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const demo = import.meta.env.VITE_DEMO === '1';
export const isDemo = demo;
export const configured = demo || Boolean(url && anon && !url.includes('YOUR-PROJECT'));

// Only the public anon key is ever used in the browser. Data is protected by Row Level Security.
export const supabase = demo ? (createDemoClient() as ReturnType<typeof createClient>) : createClient(
  configured ? url! : 'http://localhost:54321',
  configured ? anon! : 'public-anon-key-placeholder',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
