import { useState } from 'react';
import { MotionPanel } from './Motion';

/**
 * Real photo if one exists at /images/<name>.jpg (drop your own photos there and they replace the panel),
 * otherwise an animated graphic panel.
 */
export function Photo({ name, kind, word, items }: { name: string; kind: 'strength' | 'cardio' | 'about'; word: string; items: string[] }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MotionPanel kind={kind} word={word} items={items} />;
  return <img src={`/images/${name}.jpg`} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#14110f" stroke="#2c2622" />
      <path d="M12 24v16M18 20v24M46 20v24M52 24v16M18 32h28" stroke="#ff4d1c" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
