import type { Lang } from './types';

/** Today's date (YYYY-MM-DD) in the gym's timezone (Africa/Algiers, UTC+1, no DST). */
export function todayAlgiers(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date());
}
export function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
/** ISO weekday: 1 = Monday … 7 = Sunday */
export function isoWeekday(ymd: string): number { const d = new Date(ymd + 'T12:00:00Z').getUTCDay(); return d === 0 ? 7 : d; }
export function startOfWeek(ymd: string): string { return addDays(ymd, -(isoWeekday(ymd) - 1)); }
export function startOfMonth(ymd: string): string { return ymd.slice(0, 8) + '01'; }
export function endOfMonth(ymd: string): string {
  const [y, m] = ymd.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : '');

const localeOf = (l: Lang) => (l === 'ar' ? 'ar-DZ-u-nu-latn' : l === 'en' ? 'en-GB' : 'fr-FR');
export function fmtDate(ymd: string, l: Lang, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  return new Intl.DateTimeFormat(localeOf(l), { ...opts, timeZone: 'UTC' }).format(new Date(ymd + 'T12:00:00Z'));
}
export function fmtMonth(ymd: string, l: Lang) { return fmtDate(ymd, l, { month: 'long', year: 'numeric' }); }
export function fmtWeekdayShort(ymdOrIso: number, l: Lang): string {
  // 1 = Monday … 7 = Sunday ; 2024-01-01 is a Monday
  return fmtDate(`2024-01-0${ymdOrIso}`, l, { weekday: 'short' });
}
export function fmtWeekdayLong(iso: number, l: Lang): string { return fmtDate(`2024-01-0${iso}`, l, { weekday: 'long' }); }
export function fmtPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
}
export function localized(obj: object, base: string, l: Lang): string {
  const o = obj as Record<string, string | null | undefined>;
  return o[`${base}_${l}`] || o[`${base}_fr`] || '';
}
export function telHref(phone: string) { return 'tel:' + phone.replace(/[^\d+]/g, ''); }
export function waHref(phone: string) { return 'https://wa.me/' + phone.replace(/[^\d]/g, ''); }
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');
