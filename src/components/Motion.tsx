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
