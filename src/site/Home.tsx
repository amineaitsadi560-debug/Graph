import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, type Key } from '../i18n';
import { LangSwitch } from '../components/LangSwitch';
import { Art, BrandMark, Photo } from '../components/Art';
import { Reveal } from '../components/Reveal';
import { CountUp, Marquee, ParallaxFrame, ScrollProgress, Words, useTilt } from '../components/Motion';
import { IconCalendar, IconCheck, IconDumbbell, IconHeart, IconMenu, IconNav, IconPhone, IconPin, IconTag, IconX } from '../components/Icons';
import type { BookingKind, Plan } from '../lib/types';
import { fmtPrice, fmtWeekdayLong, hhmm, localized, telHref, waHref } from '../lib/utils';
import { BookingForm } from './BookingForm';
import { isDemo } from '../lib/supabase';
import { useSiteData, type SiteData } from './data';

const NAV: { id: string; k: Key }[] = [
  { id: 'about', k: 'nav_about' }, { id: 'strength', k: 'nav_strength' }, { id: 'cardio', k: 'nav_cardio' },
  { id: 'plans', k: 'nav_plans' }, { id: 'booking', k: 'nav_booking' }, { id: 'contact', k: 'nav_contact' },
];

function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f(); window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open]);
  return (
    <header className={`header ${scrolled ? 'scrolled' : ''} ${open ? 'open' : ''}`}>
      <div className="container header-in">
        <a href="#top" className="brand" onClick={() => setOpen(false)}>
          <BrandMark />
          <span>Milinium<small>CHERGUI GYM</small></span>
        </a>
        <button className="burger" type="button" aria-label={t('menu')} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <IconX /> : <IconMenu />}</button>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => <a key={n.id} className="link" href={`#${n.id}`} onClick={() => setOpen(false)}>{t(n.k)}</a>)}
          <LangSwitch />
          <a className="btn btn-primary btn-sm" href="#booking" onClick={() => setOpen(false)}>{t('nav_book_cta')}</a>
        </nav>
      </div>
    </header>
  );
}

function HeroBg() {
  return <div className="hero-bg"><Art kind="hero" /></div>;
}

function Hero({ data }: { data: SiteData }) {
  const { t, lang } = useI18n();
  const { settings } = data;
  const dec = lang === 'en' ? '.' : ',';
  return (
    <section id="top" className="hero">
      <HeroBg />
      <div className="hero-shade" />
      <div className="container hero-in">
        <div className="hero-copy">
          <span className="eyebrow rise" style={{ animationDelay: '100ms' }}>{t('hero_eyebrow')}</span>
          <h1><Words text={t('hero_title_1')} delay={250} /><em><Words text={t('hero_title_2')} delay={500} /></em></h1>
          <p className="lead rise" style={{ animationDelay: '800ms' }}>{t('hero_sub')}</p>
          <div className="hero-cta rise" style={{ animationDelay: '950ms' }}>
            <a className="btn btn-primary" href="#booking"><IconCalendar size={18} />{t('hero_cta_book')}</a>
            <a className="btn btn-ghost" href="#plans"><IconTag size={18} />{t('hero_cta_plans')}</a>
          </div>
        </div>
        <dl className="facts rise" style={{ animationDelay: '1100ms' }}>
          {settings.rating_value != null && <div><dt>{t('fact_rating')}</dt><dd><CountUp to={settings.rating_value} decimals={1} format={(n) => n.toFixed(1).replace('.', dec)} /><small>/5</small></dd></div>}
          {settings.rating_count != null && <div><dt>{t('fact_reviews')}</dt><dd><CountUp to={settings.rating_count} /></dd></div>}
          {data.plans.length > 0 && <div><dt>{t('fact_plans')}</dt><dd><CountUp to={data.plans.length} /></dd></div>}
        </dl>
      </div>
      <div className="scroll-cue" aria-label={t('scroll')} />
    </section>
  );
}

function Ticker() {
  const { t } = useI18n();
  return <Marquee items={[t('nav_strength'), t('nav_cardio'), t('nav_plans'), t('hero_eyebrow'), t('nav_booking')]} />;
}

function About() {
  const { t } = useI18n();
  const f: { i: JSX.Element; tt: Key; d: Key }[] = [
    { i: <IconDumbbell />, tt: 'about_f1_t', d: 'about_f1_d' }, { i: <IconHeart />, tt: 'about_f2_t', d: 'about_f2_d' },
    { i: <IconTag />, tt: 'about_f3_t', d: 'about_f3_d' }, { i: <IconCalendar />, tt: 'about_f4_t', d: 'about_f4_d' },
  ];
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="split">
          <Reveal>
            <span className="eyebrow">{t('about_eyebrow')}</span>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <h2>{t('about_title')}</h2>
              <p className="muted">{t('about_p1')}</p>
              <p className="muted" style={{ marginTop: 12 }}>{t('about_p2')}</p>
            </div>
          </Reveal>
          <Reveal delay={120}><div className="collage"><ParallaxFrame className="split-art c1"><Photo name="about" kind="about" /></ParallaxFrame><ParallaxFrame className="split-art c2"><Photo name="strength" kind="strength" /></ParallaxFrame></div></Reveal>
        </div>
        <div className="features">
          {f.map((x, i) => (
            <Reveal key={x.tt} delay={i * 80}><div className="feature"><div className="ico">{x.i}</div><h3>{t(x.tt)}</h3><p className="muted">{t(x.d)}</p></div></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({ id, kind, flip, eyebrow, title, text, bullets }: { id: string; kind: 'strength' | 'cardio'; flip?: boolean; eyebrow: Key; title: Key; text: Key; bullets: Key[] }) {
  const { t } = useI18n();
  return (
    <section id={id} className={`section ${flip ? '' : 'alt'}`}>
      <div className="container">
        <div className={`split ${flip ? 'flip' : ''}`}>
          <Reveal>
            <span className="eyebrow">{t(eyebrow)}</span>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <h2>{t(title)}</h2>
              <p className="muted">{t(text)}</p>
              <ul className="checks">{bullets.map((b) => <li key={b}><IconCheck size={18} />{t(b)}</li>)}</ul>
              <a className="btn btn-ghost" style={{ marginTop: 24 }} href="#plans">{t('hero_cta_plans')}</a>
            </div>
          </Reveal>
          <ParallaxFrame className="split-art"><Photo name={id} kind={kind} /></ParallaxFrame>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ p, onChoose }: { p: Plan; onChoose: (id: string) => void }) {
  const { t, lang } = useI18n();
  const tilt = useTilt();
  return (
    <article className={`plan ${p.is_featured ? 'featured' : ''}`} data-testid="plan-card" {...tilt}>
      {p.is_featured && <span className="badge badge-confirmed ribbon">{t('plan_best')}</span>}
      <h4>{localized(p, 'name', lang)}</h4>
      <p className="detail">{localized(p, 'detail', lang)}</p>
      {p.price_da != null
        ? <div className="price"><b><CountUp to={p.price_da} format={fmtPrice} duration={900} /></b><small>{t('da')}</small></div>
        : <div className="price tbc">{t('price_tbc')}</div>}
      <button className="btn btn-primary" type="button" onClick={() => onChoose(p.id)}>{t('plan_choose')}</button>
    </article>
  );
}

function Plans({ data, onChoose }: { data: SiteData; onChoose: (id: string) => void }) {
  const { t } = useI18n();
  const muscu = data.plans.filter((p) => p.category === 'musculation');
  const cardio = data.plans.filter((p) => p.category === 'cardio');
  const anyTbc = data.plans.some((p) => p.price_da == null);
  return (
    <section id="plans" className="section">
      <div className="container">
        <Reveal><div className="section-head"><span className="eyebrow">{t('plans_eyebrow')}</span><h2>{t('plans_title')}</h2><p className="muted">{t('plans_sub')}</p></div></Reveal>
        {data.plans.length === 0 && !data.loading && <p className="muted">{t('plans_none')}</p>}
        {muscu.length > 0 && <div className="plans-group"><h3>{t('plans_cat_muscu')}</h3><div className="plans">{muscu.map((p, i) => <Reveal key={p.id} delay={i * 60}><PlanCard p={p} onChoose={onChoose} /></Reveal>)}</div></div>}
        {cardio.length > 0 && <div className="plans-group"><h3>{t('plans_cat_cardio')}</h3><div className="plans">{cardio.map((p, i) => <Reveal key={p.id} delay={i * 60}><PlanCard p={p} onChoose={onChoose} /></Reveal>)}</div>
          {cardio.every((p) => p.price_da == null) && <p className="muted" style={{ marginTop: 14 }}>{t('plans_cardio_note')}</p>}</div>}
        {anyTbc && muscu.some((p) => p.price_da == null) && <div className="alert">{t('plans_unconfirmed')}</div>}
      </div>
    </section>
  );
}

function Booking({ data, kind, setKind, planId, setPlanId }: { data: SiteData; kind: BookingKind; setKind: (k: BookingKind) => void; planId: string; setPlanId: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <section id="booking" className="section alt">
      <div className="container">
        <Reveal><div className="section-head" style={{ marginInline: 'auto', textAlign: 'center' }}><span className="eyebrow">{t('booking_eyebrow')}</span><h2>{t('booking_title')}</h2><p className="muted">{t('booking_sub')}</p></div></Reveal>
        <Reveal><div className="booking-card"><BookingForm data={data} kind={kind} setKind={setKind} planId={planId} setPlanId={setPlanId} /></div></Reveal>
      </div>
    </section>
  );
}

function Hours({ data }: { data: SiteData }) {
  const { t, lang } = useI18n();
  const order = [6, 7, 1, 2, 3, 4, 5]; // week starts on Saturday in Algeria
  if (data.hours.length === 0) return <p className="muted">{t('hours_none')}</p>;
  return (
    <div className="hours" data-testid="hours">
      {order.map((d) => {
        const w = data.hours.filter((h) => h.weekday === d);
        return (
          <div key={d}>
            <span>{fmtWeekdayLong(d, lang)}</span>
            <span style={{ textAlign: 'end' }}>
              {w.length === 0 ? <span className="muted">{t('hours_closed')}</span> : w.map((h) => (
                <span key={h.id} style={{ display: 'block' }}>{hhmm(h.opens_at)}–{hhmm(h.closes_at)}{h.audience !== 'all' && <span className={`badge badge-${h.audience}`} style={{ marginInlineStart: 8 }}>{t(h.audience === 'women' ? 'aud_women' : 'aud_men')}</span>}</span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Contact({ data }: { data: SiteData }) {
  const { t } = useI18n();
  const s = data.settings;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent('P496+H5C Bachdjerrah Algiers')}&output=embed&hl=fr`;
  return (
    <section id="contact" className="section">
      <div className="container">
        <Reveal><div className="section-head"><span className="eyebrow">{t('contact_eyebrow')}</span><h2>{t('contact_title')}</h2></div></Reveal>
        <div className="contact-grid">
          <Reveal>
            <div className="info-list">
              <a className="gps" href={s.maps_url} target="_blank" rel="noopener noreferrer" data-testid="gps-button">
                <span className="pin"><IconNav size={22} /></span>
                <span>{t('gps_button')}<small>{t('gps_sub')}</small></span>
              </a>
              <div className="info"><div className="ico"><IconPhone /></div><div><b>{t('contact_phone')}</b><a href={telHref(s.phone)} dir="ltr" style={{ display: 'inline-block' }}>{s.phone}</a>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><a className="btn btn-ghost btn-sm" href={telHref(s.phone)}>{t('contact_call')}</a><a className="btn btn-ghost btn-sm" href={waHref(s.phone)} target="_blank" rel="noopener noreferrer">{t('contact_whatsapp')}</a></div></div></div>
              <div className="info"><div className="ico"><IconPin /></div><div><b>{t('contact_address')}</b><span className="muted" dir="ltr">{s.address}</span></div></div>
              <div className="info"><div className="ico"><IconCalendar /></div><div style={{ flex: 1 }}><b style={{ marginBottom: 8 }}>{t('hours_title')}</b><Hours data={data} /></div></div>
            </div>
          </Reveal>
          <Reveal delay={120}><div className="map">{isDemo ? <a className="map-fallback" href={s.maps_url} target="_blank" rel="noopener noreferrer"><IconPin size={40} /><b>{t('map_title')}</b><span dir="ltr">{s.address}</span></a> : <iframe title={t('map_title')} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}</div></Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useI18n();
  const data = useSiteData();
  const [kind, setKind] = useState<BookingKind>('registration');
  const [planId, setPlanId] = useState('');
  const choosePlan = (id: string) => {
    setKind('registration'); setPlanId(id);
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <Hero data={data} />
        <Ticker />
        <About />
        <Feature id="strength" kind="strength" flip eyebrow="strength_eyebrow" title="strength_title" text="strength_text" bullets={['strength_b1', 'strength_b2', 'strength_b3', 'strength_b4']} />
        <Feature id="cardio" kind="cardio" eyebrow="cardio_eyebrow" title="cardio_title" text="cardio_text" bullets={['cardio_b1', 'cardio_b2', 'cardio_b3', 'cardio_b4']} />
        <Plans data={data} onChoose={choosePlan} />
        <Booking data={data} kind={kind} setKind={setKind} planId={planId} setPlanId={setPlanId} />
        <Contact data={data} />
      </main>
      <footer className="footer">
        <div className="container row">
          <span>© {new Date().getFullYear()} {data.settings.gym_name}. {t('footer_rights')}</span>
          <Link to="/admin" rel="nofollow">{t('footer_staff')}</Link>
        </div>
      </footer>
      <div className="sticky-cta"><a className="btn btn-primary" href="#booking">{t('nav_book_cta')}</a><a className="btn btn-ghost" style={{ background: 'var(--bg-2)' }} href={telHref(data.settings.phone)}><IconPhone size={18} />{t('contact_call')}</a></div>
    </>
  );
}
