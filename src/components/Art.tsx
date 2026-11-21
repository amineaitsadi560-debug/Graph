import { useState } from 'react';
import { useI18n } from '../i18n';

export type ArtKind = 'hero' | 'strength' | 'cardio' | 'about';

/* ------------------------------------------------------------------------------------------------
 * Original, hand-built vector scenes (NOT photographs of the gym). Each one is lit like a studio
 * shot: steel gradients, blue rim light, reflections, grain and a little ambient motion.
 * ---------------------------------------------------------------------------------------------- */

const Grain = ({ id }: { id: string }) => (
  <>
    <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0" /></filter>
  </>
);

const steel = (id: string, a = '#5b6678', b = '#1a2029', c = '#0b0e13') => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset=".45" stopColor={b} /><stop offset="1" stopColor={c} /></linearGradient>
);

/** Wide gym scene used as the hero background. */
function HeroScene() {
  const plates = [
    { x: 0, h: 330, w: 30, c: 'p1' }, { x: 34, h: 270, w: 26, c: 'p2' }, { x: 64, h: 210, w: 22, c: 'p2' }, { x: 90, h: 150, w: 18, c: 'p3' },
  ];
  const bx = 790; const by = 650; // left end of the barbell
  const dust = Array.from({ length: 26 }, (_, i) => ({ x: (i * 197) % 1600, y: 200 + ((i * 331) % 600), r: 1 + (i % 3), d: (i * 0.7) % 9, t: 9 + (i % 5) * 2 }));
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Gym illustration" className="scene">
      <defs>
        <linearGradient id="h-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1018" /><stop offset=".65" stopColor="#07090d" /><stop offset="1" stopColor="#05070a" /></linearGradient>
        <linearGradient id="h-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10161f" /><stop offset="1" stopColor="#05070a" /></linearGradient>
        <linearGradient id="h-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc8ff" stopOpacity=".34" /><stop offset="1" stopColor="#2f7bff" stopOpacity="0" /></linearGradient>
        {steel('p1', '#7e8aa0', '#222a37', '#0a0d12')}{steel('p2', '#6a7589', '#1d2430', '#090c10')}{steel('p3', '#5c667a', '#181e29', '#080a0e')}
        <linearGradient id="h-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9f1ff" /><stop offset=".3" stopColor="#8b97ad" /><stop offset=".7" stopColor="#323b4b" /><stop offset="1" stopColor="#6c7890" /></linearGradient>
        <radialGradient id="h-glow" cx=".62" cy=".55" r=".6"><stop offset="0" stopColor="#2f7bff" stopOpacity=".5" /><stop offset="1" stopColor="#2f7bff" stopOpacity="0" /></radialGradient>
        <radialGradient id="h-vig" cx=".55" cy=".5" r=".75"><stop offset=".5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".78" /></radialGradient>
        <linearGradient id="h-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="h-refl"><rect width="1600" height="900" fill="url(#h-fade)" /></mask>
        <filter id="h-blur"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="h-soft"><feGaussianBlur stdDeviation="3" /></filter>
        <Grain id="h" />
      </defs>
      <rect width="1600" height="900" fill="url(#h-bg)" />
      {/* back wall panels */}
      <g stroke="#121a26" strokeWidth="2">{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${i * 124 + 20} 0V640`} />)}</g>
      <rect x="0" y="470" width="1600" height="6" fill="#0d131c" />
      {/* ceiling light bars + cones */}
      {[220, 700, 1180].map((x, i) => (
        <g key={x} className="flick" style={{ animationDelay: `${i * 1.3}s` }}>
          <path d={`M${x} 118L${x - 150} 640H${x + 410}L${x + 260} 118Z`} fill="url(#h-cone)" />
          <rect x={x} y="104" width="260" height="14" rx="7" fill="#e8f3ff" filter="url(#h-soft)" />
          <rect x={x} y="106" width="260" height="10" rx="5" fill="#fff" />
        </g>
      ))}
      <ellipse cx="1000" cy="560" rx="760" ry="360" fill="url(#h-glow)" />
      {/* power rack (right) */}
      <g>
        {[1110, 1430].map((x) => (<g key={x}><rect x={x} y="120" width="34" height="560" fill="url(#p3)" /><rect x={x} y="120" width="5" height="560" fill="#33405a" /></g>))}
        <rect x="1110" y="190" width="354" height="26" fill="url(#p2)" /><rect x="1110" y="300" width="354" height="18" fill="url(#p3)" opacity=".8" />
        <rect x="1110" y="190" width="354" height="4" fill="#3a4a68" />
        {[1144, 1396].map((x) => (<rect key={x} x={x - 8} y="400" width="52" height="14" rx="3" fill="#202938" />))}
        <rect x="1000" y="380" width="360" height="12" rx="6" fill="url(#h-bar)" opacity=".9" />
      </g>
      {/* floor */}
      <polygon points="0,640 1600,640 1600,900 0,900" fill="url(#h-floor)" />
      <g stroke="#162030" strokeWidth="2">{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${800 + (i - 5.5) * 80} 640L${800 + (i - 5.5) * 360} 900`} />)}</g>
      <path d="M0 700H1600M0 770H1600M0 850H1600" stroke="#0e1520" strokeWidth="2" />
      {/* reflection */}
      <g transform={`translate(0 ${by * 2 + 90}) scale(1 -1)`} mask="url(#h-refl)" opacity=".5" filter="url(#h-soft)">
        <rect x={bx - 40} y={by - 6} width="720" height="12" fill="url(#h-bar)" />
        {plates.map((p) => (<rect key={p.x} x={bx + 80 + p.x} y={by - p.h / 2} width={p.w} height={p.h} rx="8" fill={`url(#${p.c})`} />))}
      </g>
      {/* barbell */}
      <g>
        <rect x={bx - 40} y={by - 6} width="720" height="12" fill="url(#h-bar)" />
        <rect x={bx - 40} y={by - 6} width="720" height="3" fill="#fff" opacity=".7" />
        {plates.map((p) => (<g key={p.x}><rect x={bx + 80 + p.x} y={by - p.h / 2} width={p.w} height={p.h} rx="8" fill={`url(#${p.c})`} /><rect x={bx + 80 + p.x} y={by - p.h / 2} width="3" height={p.h} rx="2" fill="#4f8dff" opacity=".9" /></g>))}
        {plates.map((p) => (<g key={'r' + p.x}><rect x={bx + 600 - p.x - p.w} y={by - p.h / 2} width={p.w} height={p.h} rx="8" fill={`url(#${p.c})`} /><rect x={bx + 600 - p.x - p.w} y={by - p.h / 2} width="3" height={p.h} rx="2" fill="#4f8dff" opacity=".7" /></g>))}
        <rect x={bx + 60} y={by - 12} width="18" height="24" rx="4" fill="#9aa7bd" /><rect x={bx + 626} y={by - 12} width="18" height="24" rx="4" fill="#9aa7bd" />
        <ellipse cx={bx + 320} cy={by + 150} rx="400" ry="22" fill="#000" opacity=".6" filter="url(#h-blur)" />
      </g>
      {/* ambient dust in the light */}
      {dust.map((d, i) => <circle key={i} className="dust" cx={d.x} cy={d.y} r={d.r} fill="#cfe6ff" style={{ animationDelay: `-${d.d}s`, animationDuration: `${d.t}s` }} />)}
      <rect width="1600" height="900" fill="url(#h-vig)" />
      <rect width="1600" height="900" filter="url(#h-grain)" opacity=".07" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
}

/** Close-up of a weight plate with rim light, engraved markings and slow rotation. */
function PlateScene() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="0 0 800 880" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Weight plate illustration" className="scene">
      <defs>
        <radialGradient id="s-bg" cx=".5" cy=".45" r=".8"><stop offset="0" stopColor="#13213a" /><stop offset=".6" stopColor="#090c12" /><stop offset="1" stopColor="#05070a" /></radialGradient>
        <radialGradient id="s-plate" cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#4a566b" /><stop offset=".45" stopColor="#1b222d" /><stop offset="1" stopColor="#07090d" /></radialGradient>
        <radialGradient id="s-plate2" cx=".4" cy=".35" r=".9"><stop offset="0" stopColor="#2c3647" /><stop offset="1" stopColor="#06080b" /></radialGradient>
        <linearGradient id="s-rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fd3ff" /><stop offset=".4" stopColor="#2f7bff" /><stop offset="1" stopColor="#2f7bff" stopOpacity="0" /></linearGradient>
        <radialGradient id="s-hub" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#d8e3f5" /><stop offset=".5" stopColor="#5d6a80" /><stop offset="1" stopColor="#1a212b" /></radialGradient>
        <filter id="s-blur"><feGaussianBlur stdDeviation="10" /></filter>
        <Grain id="s" />
      </defs>
      <rect width="800" height="880" fill="url(#s-bg)" />
      <circle cx="560" cy="300" r="210" fill="url(#s-plate2)" opacity=".85" />
      <circle cx="560" cy="300" r="210" fill="none" stroke="#1f2938" strokeWidth="3" />
      <g transform="translate(400 450)">
        <circle r="330" fill="#2f7bff" opacity=".25" filter="url(#s-blur)" />
        <circle r="318" fill="url(#s-plate)" />
        <circle r="318" fill="none" stroke="url(#s-rim)" strokeWidth="6" />
        <circle r="292" fill="none" stroke="#0a0d12" strokeWidth="10" />
        <circle r="268" fill="none" stroke="#2a3446" strokeWidth="2" />
        <g className="spin-slow">
          <circle r="238" fill="none" stroke="#3b4860" strokeWidth="14" strokeDasharray="2 12.9" />
          {ticks.map((i) => <rect key={i} x="-2" y="-214" width="4" height={i % 5 === 0 ? 22 : 11} fill="#566580" transform={`rotate(${i * 6})`} />)}
        </g>
        <circle r="168" fill="#0b0f15" stroke="#252f40" strokeWidth="4" />
        <circle r="150" fill="none" stroke="url(#s-rim)" strokeWidth="2" opacity=".7" />
        {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx="0" cy="-112" r="10" fill="#202a3a" stroke="#3d4b66" strokeWidth="2" transform={`rotate(${i * 60})`} />)}
        <circle r="62" fill="url(#s-hub)" />
        <circle r="30" fill="#05070a" stroke="#0e1218" strokeWidth="6" />
        <ellipse cx="-16" cy="-22" rx="14" ry="8" fill="#fff" opacity=".35" transform="rotate(-30 -16 -22)" />
      </g>
      <path d="M0 880V760Q400 700 800 770V880Z" fill="#05070a" opacity=".85" />
      <rect width="800" height="880" filter="url(#s-grain)" opacity=".08" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
}

/** Treadmill belt in perspective, moving, with a heart-rate trace. */
function CardioScene() {
  const bands = Array.from({ length: 14 }, (_, i) => i);
  return (
    <svg viewBox="0 0 800 880" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Treadmill illustration" className="scene">
      <defs>
        <linearGradient id="c-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c1422" /><stop offset="1" stopColor="#05070a" /></linearGradient>
        <linearGradient id="c-belt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10161f" /><stop offset="1" stopColor="#1b2431" /></linearGradient>
        <linearGradient id="c-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#22b8ff" stopOpacity="0" /><stop offset=".5" stopColor="#7ed0ff" /><stop offset="1" stopColor="#2f7bff" /></linearGradient>
        <linearGradient id="c-edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2f7bff" /><stop offset="1" stopColor="#22b8ff" /></linearGradient>
        <clipPath id="c-clip"><polygon points="330,330 470,330 760,880 40,880" /></clipPath>
        <filter id="c-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <radialGradient id="c-halo" cx=".5" cy=".3" r=".7"><stop offset="0" stopColor="#2f7bff" stopOpacity=".45" /><stop offset="1" stopColor="#2f7bff" stopOpacity="0" /></radialGradient>
        <Grain id="c" />
      </defs>
      <rect width="800" height="880" fill="url(#c-bg)" />
      <rect width="800" height="880" fill="url(#c-halo)" />
      {/* console + rails */}
      <rect x="290" y="150" width="220" height="110" rx="14" fill="#0e131b" stroke="#2b384f" strokeWidth="3" />
      <rect x="304" y="164" width="192" height="82" rx="8" fill="#050a14" />
      <path className="ecg" d="M312 206h34l10-30 14 56 12-44 10 18h28l8-14 10 14h52" fill="none" stroke="url(#c-line)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#c-glow)" />
      <path d="M330 260L300 330M470 260L500 330" stroke="#1c2433" strokeWidth="12" strokeLinecap="round" />
      <path d="M262 150C220 330 150 520 70 700M538 150C580 330 650 520 730 700" fill="none" stroke="#1a2230" strokeWidth="16" strokeLinecap="round" />
      <path d="M262 150C220 330 150 520 70 700M538 150C580 330 650 520 730 700" fill="none" stroke="#3a4a68" strokeWidth="2" strokeLinecap="round" />
      {/* belt */}
      <polygon points="330,330 470,330 760,880 40,880" fill="url(#c-belt)" />
      <g clipPath="url(#c-clip)">
        <g className="belt">
          {bands.map((i) => { const y = 330 + Math.pow(i / 13, 2.1) * 620; return <path key={i} d={`M0 ${y}H800`} stroke="#2a3a55" strokeWidth={1 + i * 0.5} />; })}
        </g>
        <path d="M400 330L400 880" stroke="#22b8ff" strokeWidth="2" opacity=".25" strokeDasharray="14 18" className="lane" />
      </g>
      <polygon points="330,330 470,330 760,880 40,880" fill="none" stroke="url(#c-edge)" strokeWidth="4" />
      <path d="M326 326L36 884M474 326L764 884" stroke="#bfe3ff" strokeWidth="1.5" opacity=".6" />
      <ellipse cx="400" cy="860" rx="420" ry="40" fill="#2f7bff" opacity=".18" />
      <rect width="800" height="880" filter="url(#c-grain)" opacity=".08" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
}

/** Rack of chrome dumbbells receding into the dark. */
function DumbbellScene() {
  const rows = [0, 1, 2, 3, 4];
  const hex = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k + Math.PI / 6; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * 0.78 * Math.sin(a)).toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox="0 0 800 880" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Dumbbells illustration" className="scene">
      <defs>
        <linearGradient id="d-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#101a2c" /><stop offset="1" stopColor="#05070a" /></linearGradient>
        <linearGradient id="d-chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f8ff" /><stop offset=".25" stopColor="#8d9ab2" /><stop offset=".5" stopColor="#2c3546" /><stop offset=".72" stopColor="#8794ac" /><stop offset="1" stopColor="#0f141c" /></linearGradient>
        <linearGradient id="d-grip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c8d3e6" /><stop offset=".5" stopColor="#566177" /><stop offset="1" stopColor="#1a202b" /></linearGradient>
        <pattern id="d-knurl" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0H8" stroke="#0b0f15" strokeWidth="1.5" opacity=".55" /></pattern>
        <linearGradient id="d-rack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a3446" /><stop offset="1" stopColor="#0a0d12" /></linearGradient>
        <radialGradient id="d-glow" cx=".7" cy=".25" r=".7"><stop offset="0" stopColor="#2f7bff" stopOpacity=".5" /><stop offset="1" stopColor="#2f7bff" stopOpacity="0" /></radialGradient>
        <Grain id="d" />
      </defs>
      <rect width="800" height="880" fill="url(#d-bg)" />
      <rect width="800" height="880" fill="url(#d-glow)" />
      {rows.map((i) => {
        const s = 1 - i * 0.035; const y = 135 + i * 165; const x = 50 + i * 14;
        const len = 700 * s; const r = 88 * s;
        return (
          <g key={i} opacity={1 - i * 0.07}>
            <rect x={x - 20} y={y + r * 0.95} width={len + 70} height={16 * s} rx="6" fill="url(#d-rack)" />
            <rect x={x + r * 1.5} y={y - 14 * s} width={len - r * 3} height={28 * s} rx={8 * s} fill="url(#d-grip)" />
            <rect x={x + r * 1.5} y={y - 14 * s} width={len - r * 3} height={28 * s} rx={8 * s} fill="url(#d-knurl)" />
            {[x + r * 0.9, x + len - r * 0.9].map((cx, k) => (
              <g key={k}>
                <polygon points={hex(cx, y, r)} fill="url(#d-chrome)" stroke="#06080c" strokeWidth="2" />
                <polygon points={hex(cx, y, r * 0.62)} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
                <circle cx={cx} cy={y} r={9 * s} fill="#06080c" />
              </g>
            ))}
            <path d={`M${x + r * 0.2} ${y - r * 0.6}L${x + r * 0.7} ${y - r * 0.75}`} stroke="#bfe3ff" strokeWidth="4" strokeLinecap="round" opacity=".8" />
          </g>
        );
      })}
      <rect x="0" y="0" width="800" height="880" fill="url(#d-glow)" opacity=".35" />
      <rect width="800" height="880" filter="url(#d-grain)" opacity=".08" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  );
}

export function Art({ kind }: { kind: ArtKind }) {
  return kind === 'hero' ? <HeroScene /> : kind === 'strength' ? <PlateScene /> : kind === 'cardio' ? <CardioScene /> : <DumbbellScene />;
}

/**
 * Drop a real photo at /images/<name>.jpg and it replaces the illustration automatically.
 * Until then the original illustration is shown and labelled as such.
 */
export function Photo({ name, kind }: { name: string; kind: ArtKind }) {
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
