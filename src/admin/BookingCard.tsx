import { useState } from 'react';
import { useI18n, type Key } from '../i18n';
import { ApiError, setBookingNote, setBookingStatus } from '../lib/api';
import type { Booking, BookingStatus } from '../lib/types';
import { fmtDate, localized, ltr, range, telHref } from '../lib/utils';
import { useToast } from '../components/Toast';
import { IconPhone } from '../components/Icons';

export const STATUS_KEY: Record<BookingStatus, Key> = { pending: 'status_pending', confirmed: 'status_confirmed', rejected: 'status_rejected', cancelled: 'status_cancelled', completed: 'status_completed' };

export function StatusBadge({ s }: { s: BookingStatus }) { const { t } = useI18n(); return <span className={`badge badge-${s}`}>{t(STATUS_KEY[s])}</span>; }

export function bookingLabel(b: Booking, lang: 'fr' | 'ar' | 'en') {
  const o = b.kind === 'registration' ? b.membership_plans : b.services;
  return o ? localized(o, 'name', lang) : '—';
}

export function BookingCard({ b, onChanged }: { b: Booking; onChanged: () => void }) {
  const { t, lang, err } = useI18n();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(b.staff_note ?? '');
  const [noteOpen, setNoteOpen] = useState(false);
  const phone = b.customers?.phone ?? '';

  async function act(status: BookingStatus, confirmKey?: Key) {
    if (busy) return;
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    setBusy(true);
    try { await setBookingStatus(b.id, status); onChanged(); }
    catch (e) { toast(err(e instanceof ApiError ? e.code : 'unknown'), 'bad'); onChanged(); }
    finally { setBusy(false); }
  }
  async function saveNote() {
    try { await setBookingNote(b.id, note.trim()); toast(t('saved')); setNoteOpen(false); onChanged(); }
    catch (e) { toast(err(e instanceof ApiError ? e.code : 'unknown'), 'bad'); }
  }
  const S = b.status;
  return (
    <div className={`bk s-${S}`} data-testid="booking-card" data-status={S}>
      <div className="bk-top">
        <div><div className="bk-name">{b.full_name}</div>
          <div className="bk-meta"><a href={telHref(phone)} dir="ltr" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--blue-2)' }}><IconPhone size={14} />{phone}</a></div></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatusBadge s={S} />
          <span className="badge">{t(b.kind === 'registration' ? 'kind_reg_short' : 'kind_ses_short')}</span>
          {b.audience !== 'all' && <span className={`badge badge-${b.audience}`}>{t(b.audience === 'women' ? 'aud_women' : 'aud_men')}</span>}
        </div>
      </div>
      <div className="bk-meta">
        <span><b>{bookingLabel(b, lang)}</b></span>
        <span><b>{fmtDate(b.booking_date, lang, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</b> · {range(b.start_time, b.end_time)}</span>
        <span>{t('received')} {fmtDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date(b.created_at)), lang, { day: 'numeric', month: 'short', year: 'numeric' })} {ltr(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Algiers' }).format(new Date(b.created_at)))}</span>
      </div>
      {b.message && <div className="bk-msg">“{b.message}”</div>}
      {b.staff_note && !noteOpen && <div className="bk-msg" style={{ borderInlineStart: '3px solid var(--warn)' }}>📝 {b.staff_note}</div>}
      {noteOpen && (
        <div className="field"><textarea className="input" maxLength={500} placeholder={t('note_ph')} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="bk-actions"><button className="btn btn-primary btn-sm" onClick={saveNote}>{t('save')}</button><button className="btn btn-ghost btn-sm" onClick={() => setNoteOpen(false)}>{t('cancel')}</button></div></div>
      )}
      <div className="bk-actions">
        {S === 'pending' && <>
          <button className="btn btn-ok btn-sm" disabled={busy} onClick={() => act('confirmed')}>{t('act_confirm')}</button>
          <button className="btn btn-bad btn-sm" disabled={busy} onClick={() => act('rejected', 'confirm_reject')}>{t('act_reject')}</button>
        </>}
        {S === 'confirmed' && <>
          <button className="btn btn-ok btn-sm" disabled={busy} onClick={() => act('completed')}>{t('act_complete')}</button>
          <button className="btn btn-bad btn-sm" disabled={busy} onClick={() => act('cancelled', 'confirm_cancel')}>{t('act_cancel')}</button>
        </>}
        {S === 'pending' && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act('cancelled', 'confirm_cancel')}>{t('act_cancel')}</button>}
        {(S === 'rejected' || S === 'cancelled') && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act('pending')}>{t('act_reopen')}</button>}
        <button className="btn btn-ghost btn-sm" onClick={() => setNoteOpen((o) => !o)}>{t('note')}</button>
        <a className="btn btn-ghost btn-sm" href={telHref(phone)}><IconPhone size={14} />{t('call')}</a>
      </div>
    </div>
  );
}
