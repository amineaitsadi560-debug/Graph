import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { listBookings, listCustomers } from '../lib/api';
import type { Customer } from '../lib/types';
import { fmtDate, telHref } from '../lib/utils';
import { IconPhone } from '../components/Icons';
import { useLoad } from './hooks';
import { BookingCard } from './BookingCard';

function History({ id }: { id: string }) {
  const { data, loading, reload } = useLoad(() => listBookings({ customerId: id }), [id]);
  if (loading && !data) return <div className="spinner" />;
  return <div className="list" style={{ marginTop: 10 }}>{data?.map((b) => <BookingCard key={b.id} b={b} onChanged={() => reload(true)} />)}</div>;
}

export default function Customers() {
  const { t, lang, err } = useI18n();
  const { data, loading, error } = useLoad(listCustomers, []);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState('');
  const rows = useMemo(() => { const s = q.trim().toLowerCase(); return (data ?? []).filter((c: Customer) => !s || c.full_name.toLowerCase().includes(s) || c.phone.includes(s.replace(/\s/g, ''))); }, [data, q]);
  return (
    <>
      <div className="topbar"><h1>{t('cu_title')} <span className="muted" style={{ fontSize: '1.1rem' }}>({rows.length})</span></h1></div>
      <div className="toolbar"><input className="input grow" type="search" placeholder={t('search_ph')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {error && <div className="alert alert-bad">{err(error)}</div>}
      {loading && !data ? <div className="spinner" /> : rows.length === 0 ? <p className="muted">{t('no_results')}</p> : (
        <div className="list" data-testid="customer-list">{rows.map((c) => (
          <div key={c.id} className="bk"><div className="bk-top"><div><div className="bk-name">{c.full_name}</div><div className="bk-meta"><a href={telHref(c.phone)} dir="ltr" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', color: 'var(--blue-2)' }}><IconPhone size={14} />{c.phone}</a><span>{t('cu_since')} {fmtDate(c.created_at.slice(0, 10), lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span></div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === c.id ? '' : c.id)}>{t('cu_history')} ({c.bookings?.[0]?.count ?? 0} {t('cu_bookings')})</button></div>
            {open === c.id && <History id={c.id} />}</div>))}</div>
      )}
    </>
  );
}
