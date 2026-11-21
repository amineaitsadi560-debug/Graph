import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './site/Home';

// The private dashboard is a separate chunk: it is never downloaded by ordinary visitors.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="spinner" />}><AdminApp /></Suspense>} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
