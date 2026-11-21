import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ApiError } from '../lib/api';

/** Loads data with a function; exposes loading/error and a reload(). Ignores stale responses. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seq = useRef(0);
  const fnRef = useRef(fn); fnRef.current = fn;
  const reload = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    try { const d = await fnRef.current(); if (id === seq.current) { setData(d); setError(''); } }
    catch (e) { if (id === seq.current) setError(e instanceof ApiError ? e.code : 'unknown'); }
    finally { if (id === seq.current) setLoading(false); }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);
  return { data, loading, error, reload, setData };
}

/** Calls `cb` whenever a booking changes (Supabase Realtime) + every 30s + when the tab regains focus. */
export function useBookingsLive(cb: () => void) {
  const ref = useRef(cb); ref.current = cb;
  useEffect(() => {
    const ch = supabase.channel('bookings-live-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => ref.current())
      .subscribe();
    const iv = setInterval(() => ref.current(), 30000);
    const onVis = () => { if (document.visibilityState === 'visible') ref.current(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { supabase.removeChannel(ch); clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);
}
