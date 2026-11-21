import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './site/Home';
import { isDemo } from './lib/supabase';
import { useI18n } from './i18n';

// The private dashboard is a separate chunk: it is never downloaded by ordinary visitors.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  const { t } = useI18n();
  return (
    <>
    {isDemo && <div className="demo-banner">{t('demo_banner')} <bdi dir="ltr">/admin — owner@demo.dz / demo1234</bdi></div>}
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="spinner" />}><AdminApp /></Suspense>} />
      <Route path="*" element={<Home />} />
    </Routes>
    </>
  );
}
