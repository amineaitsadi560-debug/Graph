import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { ApiError, createBooking, getSlots } from '../lib/api';
import { configured } from '../lib/supabase';
import type { BookingKind, BookingResult, Plan, Service, Slot } from '../lib/types';
import { addDays, fmtDate, fmtPrice, hhmm, localized, ltr, range, todayAlgiers } from '../lib/utils';
import { IconCheck } from '../components/Icons';
import { newKey, validPhone, type SiteData } from './data';

type Errs = Partial<Record<'name' | 'phone' | 'plan' | 'service' | 'date' | 'slot', string>>;

export function BookingForm({ data, kind, setKind, planId, setPlanId }: {
  data: SiteData; kind: BookingKind; setKind: (k: BookingKind) => void; planId: string; setPlanId: (id: string) => void;
}) {
  const { t, lang, err } = useI18n();
  const { settings, hours, services, plans } = data;
  const today = todayAlgiers();
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [start, setStart] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [honey, setHoney] = useState('');
  const [errors, setErrors] = useState<Errs>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const key = useRef(newKey());
  const [done, setDone] = useState<{ res: BookingResult; name: string; phone: string; label: string } | null>(null);
  const reqId = useRef(0);

  const noHours = hours.length === 0;
  const maxDate = addDays(today, settings.max_advance_days);

  // Reload the slot list whenever the date changes (live availability from the database).
  useEffect(() => {
    setStart(''); setSlots(null);
    if (!date || !configured) return;
    const id = ++reqId.current;
    setSlotsLoading(true);
    getSlots(date)
      .then((s) => { if (id === reqId.current) setSlots(s); })
      .catch((e) => { if (id === reqId.current) { setSlots([]); setFormError(err(e instanceof ApiError ? e.code : 'unknown')); } })
      .finally(() => { if (id === reqId.current) setSlotsLoading(false); });
  }, [date, err]);

  const planOptions = useMemo(() => plans, [plans]);
  const slotLabel = (s: Slot) => s.status === 'ok' ? t('slot_places', { n: s.remaining })
    : s.status === 'full' ? t('slot_full') : s.status === 'blocked' ? t('slot_blocked') : t('slot_closed');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current || busy) return;            // duplicate-submit guard
    setFormError('');
    const er: Errs = {};
    if (name.trim().length < 2) er.name = t('err_invalid_name');
    if (!validPhone(phone)) er.phone = t('err_invalid_phone');
    if (kind === 'registration' && !planId) er.plan = t('required');
    if (kind === 'session' && !serviceId) er.service = t('required');
    if (!date) er.date = t('required');
    if (date && !start) er.slot = t('required');
    setErrors(er);
    if (honey) return;                           // bots fill the hidden field
    if (Object.keys(er).length) return;
    lock.current = true; setBusy(true);
    try {
      const res = await createBooking({
        full_name: name.trim(), phone: phone.trim(), kind, plan_id: kind === 'registration' ? planId : null,
        service_id: kind === 'session' ? serviceId : null, date, start, message: message.trim(), request_key: key.current,
      });
      const label = kind === 'registration'
        ? localized(plans.find((p) => p.id === planId) ?? ({} as Plan), 'name', lang)
        : localized(services.find((s) => s.id === serviceId) ?? ({} as Service), 'name', lang);
      setDone({ res, name: name.trim(), phone: phone.trim(), label });
    } catch (x) {
      const code = x instanceof ApiError ? x.code : 'unknown';
      setFormError(err(code));
      if (code === 'full' || code === 'blocked' || code === 'too_soon') { setStart(''); getSlots(date).then(setSlots).catch(() => {}); }
    } finally { lock.current = false; setBusy(false); }
  }

  function reset() {
    key.current = newKey();
    setDone(null); setName(''); setPhone(''); setMessage(''); setStart(''); setDate(''); setSlots(null); setErrors({}); setFormError('');
  }

  if (done) {
    return (
      <div className="confirm" role="status" data-testid="booking-confirmation">
        <div className="tick"><IconCheck size={36} /></div>
        <h3>{t('conf_title')}</h3>
        <p className="muted">{t('conf_text', { name: done.name, phone: done.phone })}</p>
        <div className="ref" aria-label={t('conf_ref')}>{done.res.ref}</div>
        <div className="summary">
          <span><b>{done.label}</b></span>
          <span className="muted">{t('conf_when')} : {fmtDate(done.res.date, lang)} · {range(done.res.start, done.res.end)}</span>
          <span className="badge badge-pending" style={{ width: 'fit-content' }}>{t('conf_status')}</span>
        </div>
        <p className="muted" style={{ fontSize: '.85rem' }}>{t('conf_note')}</p>
        <button className="btn btn-ghost" type="button" onClick={reset}>{t('conf_new')}</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate data-testid="booking-form">
      <div className="tabs" role="tablist">
        {(['registration', 'session'] as BookingKind[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>{t(k === 'registration' ? 'kind_registration' : 'kind_session')}</button>
        ))}
      </div>

      {!configured && <div className="alert alert-warn" style={{ marginBottom: 16 }}>{t('cfg_text')}</div>}
      {configured && noHours && !data.loading && <div className="alert alert-warn" style={{ marginBottom: 16 }}>{t('hours_unconfigured')}</div>}

      <div className="form-grid">
        {kind === 'registration' ? (
          <div className="field full">
            <label htmlFor="bk-plan">{t('f_plan')}</label>
            <select id="bk-plan" className="input" value={planId} onChange={(e) => setPlanId(e.target.value)} aria-invalid={!!errors.plan}>
              <option value="">{t('choose')}</option>
              {planOptions.map((p) => (
                <option key={p.id} value={p.id}>{localized(p, 'name', lang)}{p.price_da != null ? ` — ${ltr(fmtPrice(p.price_da))} ${t('da')}` : ''}</option>
              ))}
            </select>
            {errors.plan && <span className="field-error">{errors.plan}</span>}
          </div>
        ) : (
          <div className="field full">
            <label htmlFor="bk-service">{t('f_service')}</label>
            <select id="bk-service" className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)} aria-invalid={!!errors.service}>
              <option value="">{t('choose')}</option>
              {services.map((s) => <option key={s.id} value={s.id}>{localized(s, 'name', lang)}</option>)}
            </select>
            {errors.service && <span className="field-error">{errors.service}</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor="bk-date">{t('f_date')}</label>
          <input id="bk-date" type="date" className="input" min={today} max={maxDate} value={date} disabled={noHours}
                 onChange={(e) => setDate(e.target.value)} aria-invalid={!!errors.date} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>
        <div className="field">
          <span className="label">{t('f_time')}</span>
          <div aria-live="polite" className="muted" style={{ fontSize: '.9rem' }}>
            {!date ? t('slots_pick_date') : slotsLoading ? t('slots_loading') : slots && slots.length === 0 ? t('slots_none') : ''}
          </div>
        </div>
        {slots && slots.length > 0 && (
          <div className="field full">
            <div className="slots" role="group" aria-label={t('f_time')}>
              {slots.map((s) => (
                <button key={s.slot_start} type="button" className={`slot ${s.audience === 'women' ? 'women' : ''}`} disabled={s.status !== 'ok'}
                        aria-pressed={start === s.slot_start} onClick={() => setStart(s.slot_start)} data-testid="slot">
                  <span>{ltr(hhmm(s.slot_start))}</span>
                  <small>{slotLabel(s)}</small>
                  {s.audience !== 'all' && <small>{s.audience === 'women' ? '♀ ' + t('slot_women') : '♂ ' + t('slot_men')}</small>}
                </button>
              ))}
            </div>
            {errors.slot && <span className="field-error">{errors.slot}</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor="bk-name">{t('f_name')}</label>
          <input id="bk-name" className="input" autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="bk-phone">{t('f_phone')}</label>
          <input id="bk-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="05 42 42 56 69" dir="ltr" value={phone}
                 onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>
        <div className="field full">
          <label htmlFor="bk-msg">{t('f_message')} <span className="muted">({t('optional')})</span></label>
          <textarea id="bk-msg" className="input" maxLength={500} placeholder={t('f_message_ph')} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honey} onChange={(e) => setHoney(e.target.value)} />
      </div>

      {formError && <div className="alert alert-bad" role="alert" style={{ marginTop: 16 }} data-testid="form-error">{formError}</div>}
      <button className="btn btn-primary btn-block" style={{ marginTop: 20, minHeight: 54 }} type="submit" disabled={busy || !configured || noHours}>
        {busy ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
