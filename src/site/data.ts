import { useEffect, useState } from 'react';
import { configured } from '../lib/supabase';
import { getHours, getPublicPlans, getServices, getSettings } from '../lib/api';
import type { OpeningHour, Plan, Service, Settings } from '../lib/types';

export const DEFAULT_SETTINGS: Settings = {
  gym_name: 'Salle de Sport Milinium CHERGUI', phone: '+213 542 42 56 69',
  address: 'P496+H5C, Bachdjerrah, Algiers, Algeria', maps_url: 'https://maps.app.goo.gl/ALUZcH1xWkpV3CgP7?g_st=ic',
  rating_value: 4.5, rating_count: 30, prices_confirmed: false, slot_minutes: 60, slot_capacity: 10, min_notice_minutes: 60, max_advance_days: 30,
};

export interface SiteData { settings: Settings; hours: OpeningHour[]; services: Service[]; plans: Plan[]; loading: boolean; failed: boolean }

export function useSiteData(): SiteData {
  const [d, setD] = useState<SiteData>({ settings: DEFAULT_SETTINGS, hours: [], services: [], plans: [], loading: configured, failed: false });
  useEffect(() => {
    if (!configured) return;
    let alive = true;
    Promise.all([getSettings(), getHours(), getServices(), getPublicPlans()])
      .then(([settings, hours, services, plans]) => alive && setD({ settings, hours, services, plans, loading: false, failed: false }))
      .catch(() => alive && setD((p) => ({ ...p, loading: false, failed: true })));
    return () => { alive = false; };
  }, []);
  return d;
}

/** Same rule as the database's normalize_phone(): validated again server-side. */
export function validPhone(raw: string): boolean {
  let d = raw.replace(/[\s\-.()]/g, '');
  if (d.startsWith('+213')) d = '0' + d.slice(4);
  else if (d.startsWith('00213')) d = '0' + d.slice(5);
  else if (/^213\d{8,9}$/.test(d)) d = '0' + d.slice(3);
  return /^0([567]\d{8}|[1-4]\d{7})$/.test(d);
}
export function newKey(): string {
  try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
}
