import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './site/Home';
import { isDemo } from './lib/supabase';

// The private dashboard is a separate chunk: it is never downloaded by ordinary visitors.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <>
    {isDemo && <div className="demo-banner">APERÇU DÉMO · données fictives, rien n’est enregistré · dashboard : /admin (owner@demo.dz / demo1234)</div>}
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="spinner" />}><AdminApp /></Suspense>} />
      <Route path="*" element={<Home />} />
    </Routes>
    </>
  );
}
