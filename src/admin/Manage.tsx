import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useI18n, type Key } from '../i18n';
import {
  ApiError, addBlocked, addHour, addStaff, deleteBlocked, deleteHour, deletePlan, deleteService, getSettings, listAllPlans,
  listAllServices, listBlocked, listStaff, removeStaff, savePlan, saveService, updateSettings, getHours, type ErrorCode,
} from '../lib/api';
import type { Audience, OpeningHour, Plan, Service, Settings } from '../lib/types';
import { fmtDate, fmtWeekdayLong, range, todayAlgiers } from '../lib/utils';
import { useToast } from '../components/Toast';
import { useAuth } from './auth';
import { useLoad } from './hooks';

const TABS: { to: string; k: Key }[] = [
  { to: 'prices', k: 'm_prices' }, { to: 'services', k: 'm_services' }, { to: 'hours', k: 'm_hours' }, { to: 'settings', k: 'm_settings' }, { to: 'staff', k: 'm_staff' },
];

function useAct() {
  const { t, err } = useI18n(); const toast = useToast();
  return async (fn: () => Promise<unknown>, ok?: () => void) => {
    try { await fn(); toast(t('saved')); ok?.(); return true; }
    catch (e) { toast(err(e instanceof ApiError ? e.code : ('unknown' as ErrorCode)), 'bad'); return false; }
  };
}

// ---------------- Prices ----------------
const blankPlan = (): Partial<Plan> => ({ category: 'musculation', name_fr: '', name_ar: '', name_en: '', detail_fr: '', detail_ar: '', detail_en: '', price_da: null, is_featured: false, is_active: true, sort_order: 100 });

function PlanRow({ plan, onDone }: { plan: Partial<Plan>; onDone: () => void }) {
  const { t } = useI18n(); const act = useAct();
  const [p, setP] = useState<Partial<Plan>>(plan);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Plan>(k: K, v: Plan[K] | null) => setP((x) => ({ ...x, [k]: v }));
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true);
    const { id, name_fr, name_ar, name_en, detail_fr, detail_ar, detail_en, price_da, category, is_featured, is_active, sort_order } = p;
    await act(() => savePlan({ id, name_fr, name_ar: name_ar || name_fr, name_en: name_en || name_fr, detail_fr, detail_ar, detail_en, price_da: price_da ?? null, category, is_featured, is_active, sort_order }), onDone);
    setBusy(false);
  }
  async function del() { if (p.id && window.confirm(t('confirm_delete'))) await act(() => deletePlan(p.id!), onDone); }
  return (
    <form className="trow" onSubmit={submit} data-testid="plan-row">
      <div className="rowform">
        <div className="field"><label>{t('pr_name')} (FR)</label><input className="input" required value={p.name_fr ?? ''} onChange={(e) => set('name_fr', e.target.value)} /></div>
        <div className="field"><label>{t('pr_name')} (AR)</label><input className="input" dir="rtl" value={p.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} /></div>
        <div className="field"><label>{t('pr_name')} (EN)</label><input className="input" value={p.name_en ?? ''} onChange={(e) => set('name_en', e.target.value)} /></div>
        <div className="field"><label>{t('pr_price')}</label><input className="input" type="number" min={0} step={50} inputMode="numeric" dir="ltr" placeholder={t('pr_unset')} value={p.price_da ?? ''} onChange={(e) => set('price_da', e.target.value === '' ? null : Math.max(0, Math.round(Number(e.target.value))))} aria-label={t('pr_price')} data-testid="price-input" /></div>
        <div className="field"><label>{t('pr_cat')}</label><select className="input" value={p.category} onChange={(e) => set('category', e.target.value as Plan['category'])}><option value="musculation">{t('cat_musculation')}</option><option value="cardio">{t('cat_cardio')}</option></select></div>
        <div className="field"><label>{t('sort')}</label><input className="input" type="number" dir="ltr" value={p.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} /></div>
      </div>
      <details><summary className="muted" style={{ cursor: 'pointer' }}>{t('pr_detail')}</summary>
        <div className="rowform" style={{ marginTop: 10 }}>
          <input className="input" aria-label="detail fr" placeholder="FR" value={p.detail_fr ?? ''} onChange={(e) => set('detail_fr', e.target.value)} />
          <input className="input" aria-label="detail ar" dir="rtl" placeholder="AR" value={p.detail_ar ?? ''} onChange={(e) => set('detail_ar', e.target.value)} />
          <input className="input" aria-label="detail en" placeholder="EN" value={p.detail_en ?? ''} onChange={(e) => set('detail_en', e.target.value)} />
        </div></details>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <label className="switch"><input type="checkbox" checked={!!p.is_active} onChange={(e) => set('is_active', e.target.checked)} />{t('pr_active')}</label>
        <label className="switch"><input type="checkbox" checked={!!p.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />{t('pr_featured')}</label>
        <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? t('saving') : t('save')}</button>
          {p.id && <button type="button" className="btn btn-bad btn-sm" onClick={del}>{t('delete')}</button>}
        </span>
      </div>
    </form>
  );
}

function Prices() {
  const { t } = useI18n(); const { owner } = useAuth(); const act = useAct();
  const plans = useLoad(listAllPlans, []);
  const cfg = useLoad(getSettings, []);
  const [adding, setAdding] = useState(false);
  const published = cfg.data?.prices_confirmed;
  const toggle = () => act(() => updateSettings({ prices_confirmed: !published }), () => cfg.reload(true));
  return (
    <>
      <div className="panel"><h2>{t('pr_title')}</h2><p className="muted" style={{ marginBottom: 14 }}>{t('pr_help')}</p>
        <div className={`alert ${published ? 'alert-ok' : 'alert-warn'}`} data-testid="price-state" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ flex: 1 }}>{published ? t('pr_state_on') : t('pr_state_off')}</span>
          {owner ? <button className={`btn btn-sm ${published ? 'btn-ghost' : 'btn-primary'}`} onClick={toggle} data-testid="publish-prices">{published ? t('pr_unpublish') : t('pr_publish')}</button> : <span className="muted">{t('pr_owner_only')}</span>}
        </div></div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => setAdding((a) => !a)}>+ {t('pr_add')}</button>
      {adding && <PlanRow plan={blankPlan()} onDone={() => { setAdding(false); plans.reload(true); }} />}
      {plans.loading && !plans.data ? <div className="spinner" /> : plans.data?.map((p) => <PlanRow key={p.id + (p.price_da ?? 'n')} plan={p} onDone={() => plans.reload(true)} />)}
    </>
  );
}

// ---------------- Services ----------------
function ServiceRow({ s, onDone }: { s: Partial<Service>; onDone: () => void }) {
  const { t } = useI18n(); const act = useAct();
  const [v, setV] = useState<Partial<Service>>(s);
  async function submit(e: FormEvent) { e.preventDefault(); const { id, name_fr, name_ar, name_en, sort_order, is_active } = v; await act(() => saveService({ id, name_fr, name_ar: name_ar || name_fr, name_en: name_en || name_fr, sort_order, is_active }), onDone); }
  return (
    <form className="trow" onSubmit={submit}><div className="rowform">
      <div className="field"><label>FR</label><input className="input" required value={v.name_fr ?? ''} onChange={(e) => setV({ ...v, name_fr: e.target.value })} /></div>
      <div className="field"><label>AR</label><input className="input" dir="rtl" value={v.name_ar ?? ''} onChange={(e) => setV({ ...v, name_ar: e.target.value })} /></div>
      <div className="field"><label>EN</label><input className="input" value={v.name_en ?? ''} onChange={(e) => setV({ ...v, name_en: e.target.value })} /></div>
      <div className="field"><label>{t('sort')}</label><input className="input" type="number" dir="ltr" value={v.sort_order ?? 0} onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })} /></div></div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}><label className="switch"><input type="checkbox" checked={!!v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />{t('pr_active')}</label>
        <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 8 }}><button className="btn btn-primary btn-sm">{t('save')}</button>
          {s.id && <button type="button" className="btn btn-bad btn-sm" onClick={async () => { if (window.confirm(t('confirm_delete'))) await act(() => deleteService(s.id!), onDone); }}>{t('delete')}</button>}</span></div>
    </form>
  );
}
function Services() {
  const { t } = useI18n();
  const l = useLoad(listAllServices, []); const [adding, setAdding] = useState(false);
  return (<><div className="panel"><h2>{t('sv_title')}</h2><p className="muted">{t('sv_help')}</p></div>
    <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }} onClick={() => setAdding((a) => !a)}>+ {t('add')}</button>
    {adding && <ServiceRow s={{ name_fr: '', name_ar: '', name_en: '', sort_order: 100, is_active: true }} onDone={() => { setAdding(false); l.reload(true); }} />}
    {l.data?.map((s) => <ServiceRow key={s.id} s={s} onDone={() => l.reload(true)} />)}</>);
}

// ---------------- Hours + blocked slots ----------------
const ORDER = [6, 7, 1, 2, 3, 4, 5];
function Hours() {
  const { t, lang } = useI18n(); const act = useAct();
  const hours = useLoad(getHours, []);
  const today = todayAlgiers();
  const blocked = useLoad(() => listBlocked(today), []);
  const [h, setH] = useState({ weekday: 6, opens_at: '09:00', closes_at: '12:00', audience: 'all' as Audience });
  const [days, setDays] = useState<number[]>([]);
  const [b, setB] = useState({ block_date: today, whole: true, start_time: '09:00', end_time: '10:00', reason: '' });
  async function addH(e: FormEvent) {
    e.preventDefault();
    const targets = days.length ? days : [h.weekday];
    for (const d of targets) { const ok = await act(() => addHour({ weekday: d, opens_at: h.opens_at, closes_at: h.closes_at, audience: h.audience })); if (!ok) break; }
    hours.reload(true);
  }
  async function addB(e: FormEvent) {
    e.preventDefault();
    await act(() => addBlocked({ block_date: b.block_date, start_time: b.whole ? null : b.start_time, end_time: b.whole ? null : b.end_time, reason: b.reason || null }), () => blocked.reload(true));
  }
  const byDay = (d: number): OpeningHour[] => (hours.data ?? []).filter((x) => x.weekday === d);
  return (
    <>
      <div className="panel"><h2>{t('hr_title')}</h2><p className="muted" style={{ marginBottom: 14 }}>{t('hr_help')}</p>
        <form onSubmit={addH} data-testid="hours-form"><div className="rowform">
          <div className="field"><label>{t('hr_weekday')}</label><select className="input" value={h.weekday} onChange={(e) => setH({ ...h, weekday: Number(e.target.value) })}>{ORDER.map((d) => <option key={d} value={d}>{fmtWeekdayLong(d, lang)}</option>)}</select></div>
          <div className="field"><label>{t('hr_opens')}</label><input className="input" type="time" required value={h.opens_at} onChange={(e) => setH({ ...h, opens_at: e.target.value })} dir="ltr" /></div>
          <div className="field"><label>{t('hr_closes')}</label><input className="input" type="time" required value={h.closes_at} onChange={(e) => setH({ ...h, closes_at: e.target.value })} dir="ltr" /></div>
          <div className="field"><label>{t('hr_audience')}</label><select className="input" value={h.audience} onChange={(e) => setH({ ...h, audience: e.target.value as Audience })}><option value="all">{t('aud_all')}</option><option value="women">{t('aud_women')}</option><option value="men">{t('aud_men')}</option></select></div>
        </div>
          <div className="seg" style={{ margin: '12px 0' }}>{ORDER.map((d) => <button type="button" key={d} aria-pressed={days.includes(d)} onClick={() => setDays((x) => x.includes(d) ? x.filter((y) => y !== d) : [...x, d])}>{fmtWeekdayLong(d, lang)}</button>)}</div>
          <button className="btn btn-primary btn-sm">+ {t('add')}</button></form>
      </div>
      <div className="panel">{hours.data && hours.data.length === 0 && <p className="muted">{t('hr_none')}</p>}
        <div className="list">{ORDER.map((d) => byDay(d).length ? (
          <div key={d} className="trow"><b>{fmtWeekdayLong(d, lang)}</b>{byDay(d).map((x) => (
            <div key={x.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><span>{range(x.opens_at, x.closes_at)}</span>
              <span className={`badge ${x.audience === 'all' ? '' : 'badge-' + x.audience}`}>{t(x.audience === 'all' ? 'aud_all' : x.audience === 'women' ? 'aud_women' : 'aud_men')}</span>
              <button className="btn btn-bad btn-sm" style={{ marginInlineStart: 'auto' }} onClick={() => act(() => deleteHour(x.id), () => hours.reload(true))}>{t('delete')}</button></div>))}</div>) : null)}</div></div>
      <div className="panel"><h2>{t('bl_title')}</h2><p className="muted" style={{ marginBottom: 14 }}>{t('bl_help')}</p>
        <form onSubmit={addB} data-testid="block-form"><div className="rowform">
          <div className="field"><label>{t('bl_date')}</label><input className="input" type="date" required min={today} value={b.block_date} onChange={(e) => setB({ ...b, block_date: e.target.value })} /></div>
          <label className="switch"><input type="checkbox" checked={b.whole} onChange={(e) => setB({ ...b, whole: e.target.checked })} />{t('bl_whole_day')}</label>
          {!b.whole && <><div className="field"><label>{t('bl_from')}</label><input className="input" type="time" value={b.start_time} onChange={(e) => setB({ ...b, start_time: e.target.value })} dir="ltr" /></div>
            <div className="field"><label>{t('bl_to')}</label><input className="input" type="time" value={b.end_time} onChange={(e) => setB({ ...b, end_time: e.target.value })} dir="ltr" /></div></>}
          <div className="field"><label>{t('bl_reason')}</label><input className="input" value={b.reason} onChange={(e) => setB({ ...b, reason: e.target.value })} /></div></div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>+ {t('add')}</button></form>
        <div className="list" style={{ marginTop: 16 }}>{blocked.data?.length === 0 && <p className="muted">{t('bl_none')}</p>}
          {blocked.data?.map((x) => <div key={x.id} className="trow" style={{ gridAutoFlow: 'column', alignItems: 'center' }}><span>⛔ {fmtDate(x.block_date, lang)} · {x.start_time ? range(x.start_time, x.end_time) : t('bl_whole_day')}{x.reason ? ` · ${x.reason}` : ''}</span><button className="btn btn-bad btn-sm" onClick={() => act(() => deleteBlocked(x.id), () => blocked.reload(true))}>{t('delete')}</button></div>)}</div></div>
    </>
  );
}

// ---------------- Settings ----------------
function SettingsPage() {
  const { t } = useI18n(); const act = useAct();
  const { data } = useLoad(getSettings, []);
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return <div className="spinner" />;
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) });
  async function submit(e: FormEvent) {
    e.preventDefault();
    await act(() => updateSettings({ phone: s!.phone, address: s!.address, maps_url: s!.maps_url, slot_minutes: s!.slot_minutes, slot_capacity: s!.slot_capacity, min_notice_minutes: s!.min_notice_minutes, max_advance_days: s!.max_advance_days }));
  }
  return (
    <form className="panel" onSubmit={submit} data-testid="settings-form"><h2>{t('st_title')}</h2><div className="form-grid">
      <div className="field"><label>{t('st_phone')}</label><input className="input" dir="ltr" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></div>
      <div className="field"><label>{t('st_address')}</label><input className="input" dir="ltr" value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></div>
      <div className="field full"><label>{t('st_maps')}</label><input className="input" dir="ltr" type="url" value={s.maps_url} onChange={(e) => setS({ ...s, maps_url: e.target.value })} /></div>
      <div className="field"><label>{t('st_slot')}</label><select className="input" value={s.slot_minutes} onChange={num('slot_minutes') as unknown as React.ChangeEventHandler<HTMLSelectElement>}>{[15, 20, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} {t('minutes')}</option>)}</select></div>
      <div className="field"><label>{t('st_capacity')}</label><input className="input" type="number" min={1} max={500} dir="ltr" value={s.slot_capacity} onChange={num('slot_capacity')} /><span className="muted" style={{ fontSize: '.8rem' }}>{t('st_capacity_help')}</span></div>
      <div className="field"><label>{t('st_notice')}</label><input className="input" type="number" min={0} dir="ltr" value={s.min_notice_minutes} onChange={num('min_notice_minutes')} /></div>
      <div className="field"><label>{t('st_advance')}</label><input className="input" type="number" min={1} max={365} dir="ltr" value={s.max_advance_days} onChange={num('max_advance_days')} /></div></div>
      <button className="btn btn-primary" style={{ marginTop: 16 }}>{t('save')}</button></form>
  );
}

// ---------------- Staff ----------------
function Staff() {
  const { t, err } = useI18n(); const { owner, session } = useAuth(); const act = useAct();
  const l = useLoad(listStaff, []);
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [role, setRole] = useState<'employee' | 'owner'>('employee');
  async function submit(e: FormEvent) { e.preventDefault(); if (await act(() => addStaff(email, name, role))) { setEmail(''); setName(''); l.reload(true); } }
  return (<>
    <div className="panel"><h2>{t('sf_title')}</h2>
      {l.error && <div className="alert alert-bad">{err(l.error)}</div>}
      <div className="list">{l.data?.map((m) => (
        <div key={m.user_id} className="trow" style={{ gridAutoFlow: 'column', alignItems: 'center' }}><span><b>{m.display_name}</b> {m.user_id === session?.user.id && <span className="badge">{t('sf_you')}</span>}<br /><span className="muted" dir="ltr">{m.email}</span></span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span className={`badge ${m.role === 'owner' ? 'badge-confirmed' : ''}`}>{t(m.role === 'owner' ? 'role_owner' : 'role_employee')}</span>
            {owner && m.user_id !== session?.user.id && <button className="btn btn-bad btn-sm" onClick={async () => { if (window.confirm(t('confirm_delete'))) await act(() => removeStaff(m.user_id), () => l.reload(true)); }}>{t('sf_remove')}</button>}</span></div>))}</div></div>
    {owner ? (
      <form className="panel" onSubmit={submit}><p className="muted" style={{ marginBottom: 12 }}>{t('sf_help')}</p><div className="rowform">
        <div className="field"><label>{t('sf_email')}</label><input className="input" type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>{t('sf_name')}</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>{t('sf_role')}</label><select className="input" value={role} onChange={(e) => setRole(e.target.value as 'employee' | 'owner')}><option value="employee">{t('role_employee')}</option><option value="owner">{t('role_owner')}</option></select></div></div>
        <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>{t('sf_add')}</button></form>
    ) : <div className="alert">{t('err_owner_only')}</div>}
  </>);
}

export default function Manage() {
  const { t } = useI18n();
  return (
    <>
      <div className="topbar"><h1>{t('a_nav_manage')}</h1></div>
      <nav className="subtabs">{TABS.map((x) => <NavLink key={x.to} to={x.to} className={({ isActive }) => (isActive ? 'active' : '')}>{t(x.k)}</NavLink>)}</nav>
      <Routes>
        <Route index element={<Navigate to="prices" replace />} />
        <Route path="prices" element={<Prices />} /><Route path="services" element={<Services />} /><Route path="hours" element={<Hours />} />
        <Route path="settings" element={<SettingsPage />} /><Route path="staff" element={<Staff />} />
      </Routes>
    </>
  );
}
