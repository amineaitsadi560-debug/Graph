import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { ApiError, getSlots, listAllPlans, listAllServices, staffCreateBooking } from '../lib/api';
import type { BookingKind, Plan, Service, Slot } from '../lib/types';
import { fmtDate, hhmm, localized, ltr, todayAlgiers } from '../lib/utils';
import { useToast } from '../components/Toast';

export default function NewBooking({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t, lang, err } = useI18n();
  const toast = useToast();
  const [kind, setKind] = useState<BookingKind>('session');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [planId, setPlanId] = useState(''); const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayAlgiers());
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [start, setStart] = useState('');
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [message, setMessage] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  useEffect(() => { listAllPlans().then((p) => setPlans(p.filter((x) => x.is_active))).catch(() => {}); listAllServices().then((s) => setServices(s.filter((x) => x.is_active))).catch(() => {}); }, []);
  useEffect(() => {
    setStart(''); setSlots(null); if (!date) return;
    const id = ++seq.current;
    getSlots(date).then((s) => id === seq.current && setSlots(s)).catch(() => id === seq.current && setSlots([]));
  }, [date]);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    setError('');
    if (!start || (kind === 'registration' ? !planId : !serviceId)) { setError(t('required')); return; }
    setBusy(true);
    try {
      await staffCreateBooking({ full_name: name, phone, kind, plan_id: kind === 'registration' ? planId : null, service_id: kind === 'session' ? serviceId : null, date, start, message });
      toast(t('created_confirmed')); onCreated(); onClose();
    } catch (x) { setError(err(x instanceof ApiError ? x.code : 'unknown')); }
    finally { setBusy(false); }
  }
  return (
    <div className="modal-back" onClick={onClose} role="dialog" aria-modal="true">
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} data-testid="new-booking">
        <h2>{t('new_booking')}</h2>
        <div className="form-grid">
          <div className="field full"><div className="seg">{(['session', 'registration'] as BookingKind[]).map((k) => <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{t(k === 'session' ? 'kind_ses_short' : 'kind_reg_short')}</button>)}</div></div>
          {kind === 'registration'
            ? <div className="field full"><label>{t('f_plan')}</label><select className="input" value={planId} onChange={(e) => setPlanId(e.target.value)}><option value="">{t('choose')}</option>{plans.map((p) => <option key={p.id} value={p.id}>{localized(p, 'name', lang)}</option>)}</select></div>
            : <div className="field full"><label>{t('f_service')}</label><select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}><option value="">{t('choose')}</option>{services.map((s) => <option key={s.id} value={s.id}>{localized(s, 'name', lang)}</option>)}</select></div>}
          <div className="field full"><label>{t('f_date')}</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="field full">
            {slots === null ? <span className="muted">{t('slots_loading')}</span> : slots.length === 0 ? <span className="muted">{t('slots_none')}</span> : (
              <div className="slots">{slots.map((s) => <button type="button" key={s.slot_start} className={`slot ${s.audience === 'women' ? 'women' : ''}`} disabled={s.status !== 'ok'} aria-pressed={start === s.slot_start} onClick={() => setStart(s.slot_start)}><span>{ltr(hhmm(s.slot_start))}</span><small>{s.status === 'ok' ? t('slot_places', { n: s.remaining }) : s.status === 'full' ? t('slot_full') : s.status === 'blocked' ? t('slot_blocked') : t('slot_closed')}</small></button>)}</div>
            )}
            {start && <span className="muted" style={{ fontSize: '.85rem' }}>{fmtDate(date, lang)} · {ltr(hhmm(start))}</span>}
          </div>
          <div className="field"><label>{t('f_name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /></div>
          <div className="field"><label>{t('f_phone')}</label><input className="input" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
          <div className="field full"><label>{t('f_message')} ({t('optional')})</label><textarea className="input" maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        </div>
        {error && <div className="alert alert-bad" role="alert" style={{ marginTop: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}><button className="btn btn-primary" disabled={busy}>{busy ? t('saving') : t('save')}</button><button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button></div>
      </form>
    </div>
  );
}
