import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { LangSwitch } from '../components/LangSwitch';
import { BrandMark } from '../components/Art';
import { configured } from '../lib/supabase';
import { useAuth } from './auth';

export default function Login() {
  const { t } = useI18n();
  const { signIn, denied } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return;
    setBusy(true); setBad(false);
    const r = await signIn(email, pw);
    if (r) setBad(true);
    setBusy(false);
  }
  return (
    <div className="login">
      <form className="card" onSubmit={submit} data-testid="login-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div className="brand"><BrandMark /><span>Milinium<small>{t('a_title')}</small></span></div><LangSwitch /></div>
        <p className="muted">{t('a_login_sub')}</p>
        {!configured && <div className="alert alert-warn">{t('cfg_text')}</div>}
        <div className="field"><label htmlFor="em">{t('a_email')}</label><input id="em" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" /></div>
        <div className="field"><label htmlFor="pw">{t('a_password')}</label><input id="pw" className="input" type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" /></div>
        {bad && <div className="alert alert-bad" role="alert">{t('a_bad_creds')}</div>}
        {denied && !bad && <div className="alert alert-bad" role="alert">{t('a_not_staff')}</div>}
        <button className="btn btn-primary btn-block" disabled={busy || !configured}>{busy ? t('loading') : t('a_signin')}</button>
        <Link to="/" className="muted" style={{ textAlign: 'center', fontSize: '.9rem' }}>← {t('a_back_site')}</Link>
      </form>
    </div>
  );
}
