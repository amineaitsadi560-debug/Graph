import { useState } from 'react';
import { useI18n } from '../i18n';
import { listBlocked, listBookings } from '../lib/api';
import type { Booking } from '../lib/types';
import { addDays, endOfMonth, fmtDate, fmtMonth, fmtWeekdayShort, hhmm, startOfMonth, startOfWeek, todayAlgiers } from '../lib/utils';
import { IconChevron } from '../components/Icons';
import { useBookingsLive, useLoad } from './hooks';
import { BookingCard, bookingLabel } from './BookingCard';

type View = 'day' | 'week' | 'month';
const ACTIVE = new Set(['pending', 'confirmed', 'completed']);

export default function CalendarPage() {
  const { t, lang, dir } = useI18n();
  const today = todayAlgiers();
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(today);
  const from = view === 'day' ? anchor : view === 'week' ? startOfWeek(anchor) : startOfWeek(startOfMonth(anchor));
  const to = view === 'day' ? anchor : view === 'week' ? addDays(from, 6) : addDays(startOfWeek(startOfMonth(anchor)), 41);
  const { data, loading, reload } = useLoad(async () => {
    const [b, bl] = await Promise.all([listBookings({ from, to }), listBlocked(from)]);
    return { b: b.filter((x) => ACTIVE.has(x.status)).sort((x, y) => (x.booking_date + x.start_time).localeCompare(y.booking_date + y.start_time)), bl: bl.filter((x) => x.block_date <= to) };
  }, [from, to]);
  useBookingsLive(() => reload(true));
  const step = view === 'day' ? 1 : view === 'week' ? 7 : 0;
  const move = (n: number) => setAnchor(view === 'month' ? addDays(n > 0 ? endOfMonth(anchor) : startOfMonth(anchor), n > 0 ? 1 : -1) : addDays(anchor, n * step));
  const byDay = (d: string) => (data?.b ?? []).filter((x) => x.booking_date === d);
  const blocksOn = (d: string) => (data?.bl ?? []).filter((x) => x.block_date === d);
  const title = view === 'month' ? fmtMonth(anchor, lang) : view === 'day' ? fmtDate(anchor, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${fmtDate(from, lang, { day: 'numeric', month: 'short' })} – ${fmtDate(to, lang, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const days = Array.from({ length: view === 'week' ? 7 : 42 }, (_, i) => addDays(from, i));
  const Mini = ({ b }: { b: Booking }) => <div className={`mini s-${b.status}`}><b>{hhmm(b.start_time)} · {b.full_name}</b><span className="muted">{bookingLabel(b, lang)}</span></div>;
  return (
    <>
      <div className="topbar"><h1>{t('a_nav_calendar')}</h1><div className="sp"><div className="seg">{(['day', 'week', 'month'] as View[]).map((v) => <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>{t(v === 'day' ? 'cal_day' : v === 'week' ? 'cal_week' : 'cal_month')}</button>)}</div></div></div>
      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm" aria-label="previous" onClick={() => move(-1)}><IconChevron size={16} dir={dir === 'rtl' ? 'right' : 'left'} /></button>
        <button className="btn btn-ghost btn-sm" onClick={() => setAnchor(today)}>{t('cal_today')}</button>
        <button className="btn btn-ghost btn-sm" aria-label="next" onClick={() => move(1)}><IconChevron size={16} dir={dir === 'rtl' ? 'left' : 'right'} /></button>
        <h2>{title}</h2>
      </div>
      {loading && !data ? <div className="spinner" /> : view === 'day' ? (
        <div className="list" data-testid="cal-day">
          {blocksOn(anchor).map((b) => <div key={b.id} className="blockmini">⛔ {t('cal_blocked')} {b.start_time ? `${hhmm(b.start_time)}–${hhmm(b.end_time)}` : t('bl_whole_day')}{b.reason ? ` · ${b.reason}` : ''}</div>)}
          {byDay(anchor).length === 0 ? <p className="muted">{t('cal_empty')}</p> : byDay(anchor).map((b) => <BookingCard key={b.id} b={b} onChanged={() => reload(true)} />)}
        </div>
      ) : view === 'week' ? (
        <div className="week" data-testid="cal-week">{days.map((d) => (
          <div key={d} className={`daycol ${d === today ? 'today' : ''}`}><h4>{fmtDate(d, lang, { weekday: 'short', day: 'numeric', month: 'short' })}</h4>
            {blocksOn(d).map((b) => <div key={b.id} className="blockmini">⛔ {b.start_time ? hhmm(b.start_time) : t('bl_whole_day')}</div>)}
            {byDay(d).map((b) => <Mini key={b.id} b={b} />)}{byDay(d).length === 0 && blocksOn(d).length === 0 && <span className="muted" style={{ fontSize: '.8rem' }}>—</span>}</div>))}
        </div>
      ) : (
        <div data-testid="cal-month">
          <div className="month">{[1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="dow">{fmtWeekdayShort(i, lang)}</div>)}
            {days.map((d) => { const bs = byDay(d); const p = bs.filter((x) => x.status === 'pending').length; const c = bs.length - p; const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
              return (<button key={d} className={`cell ${inMonth ? '' : 'dim'} ${d === today ? 'today' : ''}`} onClick={() => { setAnchor(d); setView('day'); }} style={{ cursor: 'pointer', color: 'inherit' }}>
                <span className="n">{Number(d.slice(8))}</span>{p > 0 && <span className="pill p">{p} ⏳</span>}{c > 0 && <span className="pill c">{c} ✓</span>}{blocksOn(d).length > 0 && <span className="pill x">⛔</span>}</button>); })}
          </div>
        </div>
      )}
    </>
  );
}
