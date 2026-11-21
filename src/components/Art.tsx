import { useState } from 'react';
import { useI18n } from '../i18n';

/** Original vector illustrations (NOT photographs of the gym). */
export function Art({ kind }: { kind: 'hero' | 'strength' | 'cardio' | 'about' }) {
  const id = `g-${kind}`;
  const defs = (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2f7bff" /><stop offset="1" stopColor="#22b8ff" /></linearGradient>
      <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
  );
  const stroke = { stroke: `url(#${id})`, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none', filter: `url(#${id}-glow)` };
  if (kind === 'cardio') {
    return (
      <svg viewBox="0 0 400 340" role="img" aria-label="Cardio illustration">{defs}
        <circle cx="200" cy="170" r="130" {...stroke} strokeWidth={2} opacity=".35" />
        <circle cx="200" cy="170" r="95" {...stroke} strokeWidth={2} opacity=".55" />
        <path d="M30 175h90l24-70 44 150 34-110 22 30h126" {...stroke} />
        <path d="M60 300h280M110 300l40-60h110l30 60" {...stroke} strokeWidth={4} opacity=".5" />
      </svg>
    );
  }
  if (kind === 'strength' || kind === 'about') {
    return (
      <svg viewBox="0 0 400 340" role="img" aria-label="Strength illustration">{defs}
        <path d="M40 170h320" {...stroke} strokeWidth={8} />
        <path d="M90 90v160M120 70v200M150 100v140M310 90v160M280 70v200M250 100v140" {...stroke} strokeWidth={14} />
        <path d="M60 130v80M340 130v80" {...stroke} strokeWidth={10} />
        <path d="M70 300h260" {...stroke} strokeWidth={3} opacity=".4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Gym illustration">{defs}
      <circle cx="200" cy="200" r="170" {...stroke} strokeWidth={1.5} opacity=".3" />
      <circle cx="200" cy="200" r="130" {...stroke} strokeWidth={1.5} opacity=".5" strokeDasharray="4 10" />
      <path d="M40 200h320" {...stroke} strokeWidth={9} />
      <path d="M95 120v160M130 90v220M165 125v150M305 120v160M270 90v220M235 125v150" {...stroke} strokeWidth={16} />
      <path d="M62 160v80M338 160v80" {...stroke} strokeWidth={11} />
    </svg>
  );
}

/** Shows a real photo from /images/<name>.jpg when the owner uploads one; otherwise a clearly-labelled illustration. */
export function Photo({ name, kind }: { name: string; kind: 'hero' | 'strength' | 'cardio' | 'about' }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  if (failed) return (<><Art kind={kind} /><span className="tag">{t('photo_hint')}</span></>);
  return <img src={`/images/${name}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#10141b" stroke="#252c3a" />
      <path d="M12 24v16M18 20v24M46 20v24M52 24v16M18 32h28" stroke="#2f7bff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
