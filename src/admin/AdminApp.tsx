import { Navigate, NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useI18n, type Key } from '../i18n';
import { LangSwitch } from '../components/LangSwitch';
import { BrandMark } from '../components/Art';
import { IconCalendar, IconCog, IconHome, IconList, IconLogout, IconUsers } from '../components/Icons';
import { getStats } from '../lib/api';
import { AuthProvider, useAuth } from './auth';
import { useBookingsLive } from './hooks';
import Login from './Login';
import Overview from './Overview';
import Bookings from './Bookings';
import CalendarPage from './CalendarPage';
import Customers from './Customers';
import Manage from './Manage';

const ITEMS: { to: string; k: Key; icon: JSX.Element; end?: boolean }[] = [
  { to: '/admin', k: 'a_nav_overview', icon: <IconHome />, end: true },
  { to: '/admin/bookings', k: 'a_nav_bookings', icon: <IconList /> },
  { to: '/admin/calendar', k: 'a_nav_calendar', icon: <IconCalendar /> },
  { to: '/admin/customers', k: 'a_nav_customers', icon: <IconUsers /> },
  { to: '/admin/manage', k: 'a_nav_manage', icon: <IconCog /> },
];

function Shell() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [pending, setPending] = useState(0);
  const loc = useLocation();
  const refresh = useCallback(() => { getStats().then((s) => setPending(s.pending)).catch(() => {}); }, []);
  useEffect(refresh, [refresh, loc.pathname]);
  useBookingsLive(refresh);
  useEffect(() => { document.title = 'Milinium — ' + t('a_title'); }, [t]);
  const count = (k: Key) => (k === 'a_nav_bookings' && pending > 0 ? <span className="count" data-testid="pending-count">{pending}</span> : null);
  return (
    <div className="admin">
      <aside className="sidebar">
        <Link to="/admin" className="brand"><BrandMark /><span>Milinium<small>{t('a_title')}</small></span></Link>
        {ITEMS.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className="navitem">{i.icon}{t(i.k)}{count(i.k)}</NavLink>)}
        <div className="side-foot"><LangSwitch /><button className="btn btn-ghost btn-sm" onClick={signOut}><IconLogout size={16} />{t('a_signout')}</button><Link to="/" className="muted" style={{ fontSize: '.85rem' }}>← {t('a_back_site')}</Link></div>
      </aside>
      <div className="a-main">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="customers" element={<Customers />} />
          <Route path="manage/*" element={<Manage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        <div className="mobile-only" style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="lang-m"><LangSwitch /></span>
          <button className="btn btn-ghost btn-sm" onClick={signOut}><IconLogout size={16} />{t('a_signout')}</button>
        </div>
      </div>
      <nav className="bottomnav" aria-label="Admin">
        {ITEMS.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? 'active' : '')}>{i.icon}<span>{t(i.k)}</span>{count(i.k)}</NavLink>)}
      </nav>
    </div>
  );
}

function Gate() {
  const { session, staff, loading } = useAuth();
  if (loading) return <div className="login"><div className="spinner" /></div>;
  if (!session || !staff) return <Login />;
  return <Shell />;
}

export default function AdminApp() {
  return (<><meta name="robots" content="noindex" /><AuthProvider><Gate /></AuthProvider></>);
}
