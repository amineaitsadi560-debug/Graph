import { useState } from 'react';
import { MotionPanel } from './Motion';
import { useI18n } from '../i18n';

const POS: Record<string, string> = { cardio: '55% 6%', strength: '58% 30%', about: '35% 50%' };

/**
 * Real photo if one exists at /images/<name>.jpg (drop your own photos there and they replace the panel),
 * otherwise an animated graphic panel.
 */
export function Photo({ name, kind, word, items }: { name: string; kind: 'strength' | 'cardio' | 'about'; word: string; items: string[] }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  if (failed) return <MotionPanel kind={kind} word={word} items={items} />;
  return (<><img src={`/images/${name}.jpg`} alt="" loading="lazy" style={{ objectPosition: POS[name] ?? '50% 40%' }} onError={() => setFailed(true)} /><span className="tag">{t('photo_ai')}</span></>);
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#14110f" stroke="#2c2622" />
      <path d="M12 24v16M18 20v24M46 20v24M52 24v16M18 32h28" stroke="#ff4d1c" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
