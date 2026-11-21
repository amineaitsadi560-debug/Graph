import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { isDemo } from './lib/supabase';
import { I18nProvider } from './i18n';
import { ToastProvider } from './components/Toast';
import App from './App';
import './styles.css';
import './fonts.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider><ToastProvider>{isDemo ? <MemoryRouter><App /></MemoryRouter> : <BrowserRouter><App /></BrowserRouter>}</ToastProvider></I18nProvider>
  </StrictMode>,
);
