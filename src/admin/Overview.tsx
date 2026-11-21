import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getHours, getSettings, getStats, listAllPlans, listBookings } from '../lib/api';
import { useBookingsLive, useLoad } from './hooks';
import { BookingCard } from './BookingCard';
import { IconRefresh } from '../components/Icons';
import { localized } from '../lib/utils';

export default function Overview() {
  const { t, lang, err } = useI18n();
  const stats = useLoad(getStats, []);
  const pend = useLoad(() => listBookings({ status: 'pending' }), []);
  const plans = useLoad(listAllPlans, []);
  const cfg = useLoad(async () => ({ s: await getSettings(), h: await getHours() }), []);
  const reload = () => { stats.reload(true); pend.reload(true); };
  useBookingsLive(reload);
  const s = stats.data;
  const cards: [string, number | undefined, boolean?][] = [
    [t('stat_pending'), s?.pending, true], [t('stat_upcoming'), s?.upcoming], [t('stat_today'), s?.today],
    [t('stat_confirmed'), s?.confirmed], [t('stat_customers'), s?.total_customers], [t('stat_completed'), s?.completed],
  ];
  const planName = (id: string) => { const p = plans.data?.find((x) => x.id === id); return p ? localized(p, 'name', lang) : '—'; };
  const max = Math.max(1, ...(s?.by_plan.map((b) => b.total) ?? [1]));
  return (
    <>
      <div className="topbar"><h1>{t('a_nav_overview')}</h1><div className="sp"><span className="live"><i />{t('live')}</span><button className="btn btn-ghost btn-sm" onClick={reload}><IconRefresh size={15} />{t('refresh')}</button></div></div>
      {stats.error && <div className="alert alert-bad" style={{ marginBottom: 14 }}>{err(stats.error)}</div>}
      {cfg.data && !cfg.data.s.prices_confirmed && <div className="alert alert-warn" style={{ marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><span>{t('ov_prices_banner')}</span><Link className="btn btn-ghost btn-sm" to="/admin/manage/prices">{t('ov_prices_btn')}</Link></div>}
      {cfg.data && cfg.data.h.length === 0 && <div className="alert alert-warn" style={{ marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><span>{t('ov_hours_banner')}</span><Link className="btn btn-ghost btn-sm" to="/admin/manage/hours">{t('ov_hours_btn')}</Link></div>}
      <div className="cards" data-testid="stats">{cards.map(([label, v, hot]) => <div key={label} className={`stat ${hot && (v ?? 0) > 0 ? 'hot' : ''}`}><b>{v ?? '–'}</b><span>{label}</span></div>)}</div>
      <div className="panel-grid">
        <div className="panel"><h2>{t('ov_pending')}</h2>
          {pend.loading && !pend.data ? <div className="spinner" /> : pend.data && pend.data.length === 0 ? <p className="muted">{t('ov_no_pending')}</p>
            : <div className="list">{pend.data?.slice().reverse().map((b) => <BookingCard key={b.id} b={b} onChanged={reload} />)}</div>}
        </div>
        <div className="panel"><h2>{t('ov_memberships')}</h2>
          {s && s.by_plan.length === 0 ? <p className="muted">{t('ov_no_stats')}</p> : (
            <div className="list">{s?.by_plan.map((b) => (
              <div key={b.plan_id}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.92rem', marginBottom: 4 }}><span>{planName(b.plan_id)}</span><b>{b.total} <span className="muted" style={{ fontWeight: 400 }}>{t('ov_registrations')}</span></b></div><div className="bar"><i style={{ width: `${(b.total / max) * 100}%` }} /></div></div>
            ))}</div>
          )}
        </div>
      </div>
    </>
  );
}
