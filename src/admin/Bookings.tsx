import { useState } from 'react';
import { useI18n } from '../i18n';
import { listBookings } from '../lib/api';
import type { BookingKind, BookingStatus } from '../lib/types';
import { addDays, startOfWeek, todayAlgiers } from '../lib/utils';
import { useBookingsLive, useLoad } from './hooks';
import { BookingCard, STATUS_KEY } from './BookingCard';
import NewBooking from './NewBooking';

type Range = 'all' | 'upcoming' | 'today' | 'week';
export default function Bookings() {
  const { t, err } = useI18n();
  const [status, setStatus] = useState<BookingStatus | 'all'>('pending');
  const [kind, setKind] = useState<BookingKind | 'all'>('all');
  const [range, setRange] = useState<Range>('all');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const today = todayAlgiers();
  const bounds = range === 'today' ? { from: today, to: today } : range === 'week' ? { from: startOfWeek(today), to: addDays(startOfWeek(today), 6) }
    : range === 'upcoming' ? { from: today, to: addDays(today, 365) } : {};
  const { data, loading, error, reload } = useLoad(() => listBookings({ status, kind, search, ...bounds }), [status, kind, range, search]);
  useBookingsLive(() => reload(true));
  const statuses: (BookingStatus | 'all')[] = ['pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'all'];
  return (
    <>
      <div className="topbar"><h1>{t('a_nav_bookings')}</h1><div className="sp"><span className="live"><i />{t('live')}</span><button className="btn btn-primary btn-sm" onClick={() => setCreating(true)} data-testid="new-booking-btn">+ {t('new_booking')}</button></div></div>
      <div className="toolbar">
        <input className="input grow" type="search" placeholder={t('search_ph')} value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t('search_ph')} />
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as BookingKind | 'all')} aria-label={t('f_kind')}>
          <option value="all">{t('f_kind')}: {t('all')}</option><option value="registration">{t('kind_reg_short')}</option><option value="session">{t('kind_ses_short')}</option>
        </select>
        <select className="input" value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="all">{t('range_all')}</option><option value="upcoming">{t('range_upcoming')}</option><option value="today">{t('range_today')}</option><option value="week">{t('range_week')}</option>
        </select>
      </div>
      <div className="seg" style={{ marginBottom: 16 }} role="group" aria-label={t('f_status')}>
        {statuses.map((s) => <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>{s === 'all' ? t('all') : t(STATUS_KEY[s])}</button>)}
      </div>
      {error && <div className="alert alert-bad">{err(error)}</div>}
      {loading && !data ? <div className="spinner" /> : data && data.length === 0 ? <p className="muted">{t('no_results')}</p>
        : <div className="list" data-testid="booking-list">{data?.map((b) => <BookingCard key={b.id} b={b} onChanged={() => reload(true)} />)}</div>}
      {creating && <NewBooking onClose={() => setCreating(false)} onCreated={() => reload(true)} />}
    </>
  );
}
