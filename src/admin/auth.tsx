import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isOwner, isStaff } from '../lib/api';

interface AuthCtx { session: Session | null; staff: boolean; owner: boolean; loading: boolean; denied: boolean; signIn: (e: string, p: string) => Promise<string | null>; signOut: () => Promise<void> }
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState(false);
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const check = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) { setStaff(false); setOwner(false); setLoading(false); return; }
    try {
      const [st, ow] = await Promise.all([isStaff(), isOwner()]);
      setStaff(st); setOwner(ow);
      if (!st) { setDenied(true); await supabase.auth.signOut(); setSession(null); }
    } catch { setStaff(false); }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === 'SIGNED_OUT') { setSession(null); setStaff(false); setOwner(false); }
      else if (ev === 'TOKEN_REFRESHED') setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [check]);

  const signIn = useCallback(async (email: string, password: string) => {
    setDenied(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return 'bad_creds';
    setLoading(true);
    await check(data.session);
    return null;
  }, [check]);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); setSession(null); setStaff(false); }, []);

  return <Ctx.Provider value={{ session, staff, owner, loading, denied, signIn, signOut }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
