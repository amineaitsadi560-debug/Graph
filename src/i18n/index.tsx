import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import fr, { type Key } from './fr';
import en from './en';
import ar from './ar';
import type { Lang } from '../lib/types';
import type { ErrorCode } from '../lib/api';

const dicts = { fr, en, ar } as const;
export type { Key };
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' }, { code: 'ar', label: 'عربية' }, { code: 'en', label: 'EN' },
];

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string | number>) => string; dir: 'ltr' | 'rtl'; err: (c: ErrorCode | string) => string }
const I18n = createContext<Ctx>(null as unknown as Ctx);

function initial(): Lang {
  try { const s = localStorage.getItem('lang'); if (s === 'fr' || s === 'ar' || s === 'en') return s; } catch { /* storage unavailable */ }
  return 'fr'; // French is the default language
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir; if (!location.pathname.startsWith('/admin')) document.title = dicts[lang].meta_title; }, [lang, dir]);
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem('lang', l); } catch { /* ignore */ } }, []);
  const t = useCallback((k: Key, vars?: Record<string, string | number>) => {
    let s: string = dicts[lang][k] ?? fr[k] ?? k;
    if (vars) for (const [n, v] of Object.entries(vars)) { const str = String(v); s = s.replaceAll(`{${n}}`, lang === 'ar' && /[0-9A-Za-z+]/.test(str) ? `\u2066${str}\u2069` : str); }
    return s;
  }, [lang]);
  const err = useCallback((c: string) => {
    const k = (`err_${c}` as Key);
    return dicts[lang][k] ? t(k) : t('err_unknown');
  }, [lang, t]);
  const value = useMemo(() => ({ lang, setLang, t, dir: dir as 'ltr' | 'rtl', err }), [lang, setLang, t, dir, err]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}
export const useI18n = () => useContext(I18n);
