import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Headline whose words slide up out of a mask, one after another. */
export function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i}><span className="w"><span style={{ animationDelay: `${delay + i * 90}ms` } as CSSProperties}>{w}</span></span>{' '}</span>
      ))}
    </>
  );
}

/** Counts up to `to` the first time it scrolls into view. */
export function CountUp({ to, decimals = 0, format, duration = 1100 }: { to: number; decimals?: number; format?: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(reduced() ? to : 0);
  useEffect(() => {
    if (reduced()) { setV(to); return; }
    const el = ref.current; if (!el) return;
    let raf = 0;
    const run = () => {
      const t0 = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - t0) / duration); setV(to * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  const n = Number(v.toFixed(decimals));
  return <span ref={ref}>{format ? format(n) : n.toFixed(decimals)}</span>;
}

/** Thin bar at the top showing how far the page is scrolled. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const f = () => { raf = 0; const h = document.documentElement; const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight); ref.current?.style.setProperty('--p', String(p)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(f); };
    window.addEventListener('scroll', on, { passive: true }); f();
    return () => window.removeEventListener('scroll', on);
  }, []);
  return <div className="progress" ref={ref} aria-hidden="true" />;
}

/** Image that is wiped in when visible and drifts slightly while scrolling (parallax). */
export function ParallaxFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduced() || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    let raf = 0;
    const f = () => { raf = 0; const r = el.getBoundingClientRect(); const c = r.top + r.height / 2 - innerHeight / 2; el.style.setProperty('--py', String(Math.max(-60, Math.min(60, -c * 0.08)))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(f); };
    window.addEventListener('scroll', on, { passive: true }); f();
    return () => { io.disconnect(); window.removeEventListener('scroll', on); };
  }, []);
  return <div ref={ref} className={`pframe ${shown ? 'in' : ''} ${className}`}><div className="pframe-clip">{children}</div></div>;
}

/** Scrolling ticker of keywords. */
export function Marquee({ items }: { items: string[] }) {
  const row = (k: string) => (
    <div className="marquee-row" key={k} aria-hidden={k === 'b'}>
      {items.map((x, i) => <span key={i}>{x}<i /></span>)}
    </div>
  );
  return <div className="marquee" role="presentation"><div className="marquee-track">{row('a')}{row('b')}</div></div>;
}

/** Pointer-driven tilt + spotlight for cards. Spread the returned props on the element. */
export function useTilt() {
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.currentTarget; const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
      el.style.setProperty('--rx', `${(0.5 - y) * 7}deg`); el.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { const el = e.currentTarget; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); },
  };
}

/** Rising embers: a canvas of sparks that drift up and flee the cursor. */
export function Embers({ count = 90 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const mouse = { x: -999, y: -999 };
    let w = 0, h = 0, raf = 0, visible = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const colors = ['255,147,64', '255,77,28', '255,46,77', '255,190,90'];
    type P = { x: number; y: number; r: number; v: number; a: number; ph: number; col: string };
    const mk = (init: boolean): P => ({ x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: 0.6 + Math.random() * 2.4, v: 0.25 + Math.random() * 1.1, a: 0.25 + Math.random() * 0.75, ph: Math.random() * 6.28, col: colors[(Math.random() * colors.length) | 0] });
    let ps: P[] = [];
    const resize = () => { const r = c.getBoundingClientRect(); w = r.width; h = r.height; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ps = Array.from({ length: Math.round(count * Math.min(1, w / 1100 + 0.35)) }, () => mk(true)); };
    resize();
    const still = reduced();
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of ps) {
        if (!still) {
          p.y -= p.v; p.x += Math.sin(t / 900 + p.ph) * 0.35;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 110) { p.x += (dx / d) * 2.2; p.y += (dy / d) * 2.2; }
          if (p.y < -10) Object.assign(p, mk(false));
        }
        const tw = 0.6 + 0.4 * Math.sin(t / 300 + p.ph);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(${p.col},${p.a * tw})`); g.addColorStop(1, `rgba(${p.col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
      }
    };
    raf = requestAnimationFrame(draw);
    const mv = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; });
    io.observe(c);
    window.addEventListener('pointermove', mv, { passive: true }); window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('pointermove', mv); window.removeEventListener('resize', resize); };
  }, [count]);
  return <canvas ref={ref} className="embers" aria-hidden="true" />;
}

/** Subtle magnetic pull on primary buttons (desktop pointers only). */
export function PointerFx() {
  useEffect(() => {
    if (reduced() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const mv = (e: PointerEvent) => {
      document.querySelectorAll<HTMLElement>('.btn-primary, .magnetic').forEach((b) => {
        const r = b.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
        if (d < 110) b.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`; else if (b.style.transform) b.style.transform = '';
      });
    };
    window.addEventListener('pointermove', mv, { passive: true });
    return () => window.removeEventListener('pointermove', mv);
  }, []);
  return null;
}

/** Circular rotating text badge. */
export function SpinBadge({ text }: { text: string }) {
  const full = text + ' •';
  return (
    <svg className="spinbadge" viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id="sb" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" /></defs>
      <g className="spinbadge-ring"><text fontSize="15" fontWeight="700" fill="currentColor"><textPath href="#sb" textLength="486" lengthAdjust="spacing">{full}</textPath></text></g>
      <path d="M72 100h56M80 86v28M120 86v28M70 92v16M130 92v16" stroke="var(--blue-2)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** Clean animated graphic panel (no text on top of it) used until real photos exist. */
export function MotionPanel({ kind }: { kind: 'strength' | 'cardio' | 'about'; word?: string; items?: string[] }) {
  return (
    <div className={`mpanel mp-${kind}`} role="img" aria-hidden="true">
      <div className="mp-bg" />
      <div className="mp-rings"><i /><i /><i /></div>
      <div className="mp-icon">
        {kind === 'cardio'
          ? <svg viewBox="0 0 120 120"><path className="mp-pulse" d="M8 64h26l12-34 18 62 14-42 8 14h26" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <svg viewBox="0 0 120 120" className="mp-bell"><path d="M28 36v48M40 28v64M80 28v64M92 36v48M40 60h40M16 48v24M104 48v24" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" /></svg>}
      </div>
    </div>
  );
}
