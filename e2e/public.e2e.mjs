// End-to-end test of the PUBLIC site in a real (Chromium) browser.
// Backend = the real local Postgres schema (RLS, booking functions) reached as the `anon` role.
// Only the HTTP transport is emulated: Playwright intercepts the Supabase REST calls and runs the
// equivalent SQL with `set role anon` (see run()). The dashboard needs real PostgREST + auth: see e2e/README.md.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const API = 'http://localhost:54321';
const OUT = process.env.SHOT_DIR || '/tmp/claude-0/-home-user-Graph/e8d910e3-e46d-5231-8955-39738584b57b/scratchpad/shots';
mkdirSync(OUT, { recursive: true });
const PG = { PGHOST: '/tmp', PGPORT: '54329', PGUSER: 'pgtest', PATH: process.env.PATH };

const psql = (sql, db = 'milinium') => execFileSync('psql', ['-d', db, '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], { env: PG, encoding: 'utf8' }).trim();
const q = (s) => "'" + String(s ?? '').replace(/'/g, "''") + "'";
const asAnon = (sql) => psql(`set role anon; ${sql}`).replace(/^SET\n?/, '');
const jsonRows = (from) => JSON.parse(asAnon(`select coalesce(json_agg(t), '[]'::json) from (${from}) t`));
const todayAlg = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date());
const plus = (n) => { const d = new Date(todayAlg() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Emulates PostgREST for the handful of calls the public site makes. Every query runs as role anon. */
async function route(r) {
  const req = r.request(); const u = new URL(req.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const path = u.pathname.replace('/rest/v1/', '');
  try {
    let body;
    if (path === 'gym_settings') body = jsonRows('select * from public.gym_settings where id = 1')[0];
    else if (path === 'opening_hours') body = jsonRows('select * from public.opening_hours order by weekday, opens_at');
    else if (path === 'services') body = jsonRows('select * from public.services order by sort_order');
    else if (path === 'rpc/get_public_plans') body = jsonRows('select * from public.get_public_plans()');
    else if (path === 'rpc/get_available_slots') body = jsonRows(`select * from public.get_available_slots(${q(JSON.parse(req.postData()).p_date)}::date)`);
    else if (path === 'rpc/create_booking') {
      const a = JSON.parse(req.postData());
      calls.createBooking++;
      body = JSON.parse(asAnon(`select public.create_booking(${q(a.p_full_name)},${q(a.p_phone)},${q(a.p_kind)}::booking_kind,${a.p_plan_id ? q(a.p_plan_id) : 'null'}::uuid,${a.p_service_id ? q(a.p_service_id) : 'null'}::uuid,${q(a.p_date)}::date,${q(a.p_start)}::time,${q(a.p_message)},${q(a.p_request_key)})`).split('\n')[0]);
    } else return r.fulfill({ status: 404, headers: cors, body: '{}' });
    return r.fulfill({ status: 200, headers: cors, body: JSON.stringify(body) });
  } catch (e) {
    const m = /ERROR:\s+([^\n]+)/.exec(String(e.stderr || e.message));
    return r.fulfill({ status: m && /permission denied/.test(m[1]) ? 403 : 400, headers: cors, body: JSON.stringify({ code: /permission/.test(m?.[1] ?? '') ? '42501' : 'P0001', message: m ? m[1].trim() : 'error' }) });
  }
}
const calls = { createBooking: 0 };

let passed = 0, failed = 0;
const check = (name, cond, extra = '') => { (cond ? passed++ : failed++); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ← ' + extra}`); };

function resetDb({ hours = true, capacity = 10, publish = false } = {}) {
  execFileSync('bash', ['tests/db/start_local_db.sh'], { env: { ...PG, PGPORT_LOCAL: '54329', PATH: process.env.PATH }, stdio: 'ignore' });
  psql(`update gym_settings set slot_capacity=${capacity}, prices_confirmed=${publish}`);
  if (hours) psql(`insert into opening_hours (weekday, opens_at, closes_at, audience) select d,'09:00','12:00','all' from generate_series(1,7) d; insert into opening_hours (weekday, opens_at, closes_at, audience) select d,'14:00','16:00','women' from generate_series(1,7) d;`);
}

const browser = await chromium.launch();
async function newPage(opts = devices['Pixel 5']) {
  const ctx = await browser.newContext({ ...opts, locale: 'fr-FR', timezoneId: 'Africa/Algiers' });
  const page = await ctx.newPage();
  await page.route(API + '/**', route);
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/WebSocket|realtime|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return { ctx, page, errors };
}
async function clickLang(page, label) {
  if (await page.isVisible('.burger') && !(await page.$('.header.open'))) { await page.click('.burger'); await page.waitForTimeout(300); }
  await page.getByRole('button', { name: label, exact: true }).first().click(); await page.waitForTimeout(350);
}
async function scrollAll(page) { await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); }); await page.waitForTimeout(500); }
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// ------------------------------------------------------------------ 1. defaults + pricing publication
resetDb({ publish: false });
{
  const { ctx, page, errors } = await newPage();
  await page.goto(BASE); await page.waitForSelector('[data-testid=plan-card]');
  check('default language is French (html lang=fr, dir=ltr)', (await page.getAttribute('html', 'lang')) === 'fr' && (await page.getAttribute('html', 'dir')) === 'ltr');
  check('hero shows gym name / FR copy', /Dépassez/i.test(await page.textContent('.hero h1')));
  const cards = await page.$$eval('[data-testid=plan-card]', (els) => els.map((e) => e.textContent));
  check('8 plan cards rendered (6 musculation + 2 cardio)', cards.length === 8, String(cards.length));
  check('prices HIDDEN until owner publishes ("Tarif à confirmer" everywhere)', cards.every((c) => /Tarif à confirmer/.test(c)) && !cards.some((c) => /\d\s*DA/.test(c)));
  check('rating shown as supplied (4,5/5 · 30 avis)', /4,5\/5\s*·\s*30 avis/.test(await page.textContent('.chip')));
  check('GPS button points to the supplied Google Maps link', (await page.getAttribute('[data-testid=gps-button]', 'href')).startsWith('https://maps.app.goo.gl/ALUZcH1xWkpV3CgP7'));
  check('phone number displayed', (await page.textContent('#contact')).includes('+213 542 42 56 69'));
  psql('update gym_settings set prices_confirmed = true');
  await page.reload(); await page.waitForSelector('[data-testid=plan-card]');
  const txt = await page.$$eval('[data-testid=plan-card]', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ')));
  const expect = ['250DA', '1 600DA', '1 800DA', '2 000DA', '2 600DA', '5 000DA'];
  check('after publication the six photographed prices appear', expect.every((p) => txt.some((c) => c.includes(p))), txt.join(' | '));
  check('cardio prices still NOT invented', txt.filter((c) => /Cardio/.test(c)).every((c) => /Tarif à confirmer/.test(c)));
  check('no console/page errors on home', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// ------------------------------------------------------------------ 2. full booking on a phone
resetDb({ publish: true });
{
  const { ctx, page, errors } = await newPage(devices['iPhone 13']);
  await page.goto(BASE); await page.waitForSelector('[data-testid=plan-card]');
  check('phone: no horizontal scroll (390px)', (await overflow(page)) <= 1, String(await overflow(page)));
  await scrollAll(page); await page.screenshot({ path: `${OUT}/phone-home.png`, fullPage: true });
  const unlimited = page.locator('[data-testid=plan-card]', { hasText: 'Illimité' });
  await unlimited.getByRole('button').click();
  await page.waitForTimeout(700);
  check('choosing a plan card pre-selects it in the form', (await page.inputValue('#bk-plan')) !== '' && /Illimité/.test(await page.$eval('#bk-plan', (s) => s.selectedOptions[0].textContent)));
  const date = plus(3);
  await page.fill('#bk-date', date);
  await page.waitForSelector('[data-testid=slot]');
  const slotTexts = await page.$$eval('[data-testid=slot]', (els) => els.map((e) => e.textContent));
  check('slots listed from DB opening hours (3 mixed + 2 women-only)', slotTexts.length === 5, JSON.stringify(slotTexts));
  check('women-only slots are labelled', slotTexts.filter((s) => /Femmes/.test(s)).length === 2);
  // validation first
  await page.getByRole('button', { name: /Envoyer ma demande/ }).click();
  check('empty submit shows validation errors and sends nothing', (await page.$$('.field-error')).length >= 2 && calls.createBooking === 0);
  await page.fill('#bk-name', 'Karim Benali');
  await page.fill('#bk-phone', '12345');
  await page.locator('[data-testid=slot]').first().click();
  await page.getByRole('button', { name: /Envoyer ma demande/ }).click();
  check('invalid phone rejected client-side (no request sent)', /invalide/.test(await page.textContent('.field-error')) && calls.createBooking === 0);
  await page.fill('#bk-phone', '0555 12 34 56');
  await page.fill('#bk-msg', 'Je débute, merci !');
  // double-click => exactly one booking
  const btn = page.getByRole('button', { name: /Envoyer ma demande/ });
  await btn.dblclick();
  await page.waitForSelector('[data-testid=booking-confirmation]');
  const conf = await page.textContent('[data-testid=booking-confirmation]');
  check('confirmation message shown with reference + pending status', /Demande envoyée/.test(conf) && /en attente/.test(conf) && /[0-9A-F]{8}/.test(conf));
  check('double-click created exactly one booking', psql('select count(*) from bookings') === '1' && calls.createBooking === 1, `rows=${psql('select count(*) from bookings')} calls=${calls.createBooking}`);
  const row = psql(`select status||'|'||full_name||'|'||kind||'|'||booking_date||'|'||start_time||'|'||coalesce(message,'')||'|'||(select phone from customers) from bookings`);
  check('booking stored in DB as pending with normalised phone', row === `pending|Karim Benali|registration|${date}|09:00:00|Je débute, merci !|0555123456`, row);
  await page.screenshot({ path: `${OUT}/phone-confirmation.png` });
  check('phone: no console/page errors during booking', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// ------------------------------------------------------------------ 3. conflicts / limits seen from the UI
resetDb({ publish: true, capacity: 1 });
{
  const { ctx, page } = await newPage();
  await page.goto(BASE); await page.waitForSelector('[data-testid=plan-card]');
  const date = plus(4);
  psql(`insert into blocked_slots (block_date, start_time, end_time, reason) values ('${date}','10:00','11:00','test')`);
  await page.getByRole('tab', { name: /séance/i }).click();
  await page.selectOption('#bk-service', { index: 1 });
  await page.fill('#bk-date', date);
  await page.waitForSelector('[data-testid=slot]');
  const states = await page.$$eval('[data-testid=slot]', (els) => els.map((e) => [e.textContent, e.disabled]));
  check('staff-blocked slot is shown unavailable & disabled', states.some(([t, d]) => /10:00/.test(t) && /Indisponible/.test(t) && d), JSON.stringify(states));
  // Someone else takes 09:00 after this page loaded the slot list (stale UI) -> server must refuse
  asAnon(`select public.create_booking('Other Person','0661000001','session',null,(select id from services limit 1),'${date}','09:00')`);
  await page.fill('#bk-name', 'Late Customer'); await page.fill('#bk-phone', '0770123456');
  await page.locator('[data-testid=slot]', { hasText: '09:00' }).click();
  await page.getByRole('button', { name: /Envoyer ma demande/ }).click();
  await page.waitForSelector('[data-testid=form-error]');
  check('last place taken meanwhile → friendly "créneau complet" error, nothing stored', /complet/.test(await page.textContent('[data-testid=form-error]')) && psql(`select count(*) from bookings where full_name='Late Customer'`) === '0');
  const after = await page.$$eval('[data-testid=slot]', (els) => els.map((e) => [e.textContent, e.disabled]));
  check('slot list refreshed: 09:00 now "Complet" and disabled', after.some(([t, d]) => /09:00/.test(t) && /Complet/.test(t) && d));
  await ctx.close();
}

// ------------------------------------------------------------------ 4. no opening hours configured
resetDb({ hours: false, publish: true });
{
  const { ctx, page } = await newPage();
  await page.goto(BASE); await page.waitForSelector('[data-testid=plan-card]');
  check('no hours configured → notice shown, date & submit disabled (no invented schedule)', /pas encore été publiés/.test(await page.textContent('#booking')) && await page.isDisabled('#bk-date') && await page.isDisabled('[data-testid=booking-form] button[type=submit]'));
  check('contact section says hours coming soon', /bientôt disponibles/.test(await page.textContent('#contact')));
  await ctx.close();
}

// ------------------------------------------------------------------ 5. languages, RTL, responsiveness
resetDb({ publish: true });
{
  for (const [name, opts] of [['phone-360', { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true }], ['tablet-768', devices['iPad Mini']], ['desktop-1440', { viewport: { width: 1440, height: 900 } }]]) {
    const { ctx, page } = await newPage(opts);
    await page.goto(BASE); await page.waitForSelector('[data-testid=plan-card]');
    check(`${name}: no horizontal overflow (FR)`, (await overflow(page)) <= 1, String(await overflow(page)));
    if (name === 'phone-360') {
      await page.click('.burger'); await page.waitForTimeout(350);
      check('mobile menu opens', await page.isVisible('.nav a[href="#plans"]'));
      await page.screenshot({ path: `${OUT}/phone-menu.png` });
    }
    await clickLang(page, 'عربية');
    check(`${name}: Arabic switches to RTL (html dir=rtl, lang=ar)`, (await page.getAttribute('html', 'dir')) === 'rtl' && (await page.getAttribute('html', 'lang')) === 'ar');
    check(`${name}: Arabic content translated`, /حدودك/.test(await page.textContent('.hero h1')) && /الأسعار/.test(await page.textContent('body')));
    if (name === 'phone-360') { await page.keyboard.press('Escape'); await page.waitForTimeout(300); check('phone-360: Escape closes the menu', !(await page.$('.header.open'))); }
    else if (await page.$('.header.open')) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
    await page.evaluate(() => window.scrollTo(0, 0));
    check(`${name}: no horizontal overflow (AR/RTL)`, (await overflow(page)) <= 1, String(await overflow(page)));
    await page.screenshot({ path: `${OUT}/${name}-ar.png`, fullPage: name !== 'phone-360' ? true : false });
    // English
    await clickLang(page, 'EN');
    check(`${name}: English translation + LTR`, (await page.getAttribute('html', 'dir')) === 'ltr' && /limits/i.test(await page.textContent('.hero h1')));
    check(`${name}: no horizontal overflow (EN)`, (await overflow(page)) <= 1, String(await overflow(page)));
    if (name === 'desktop-1440') { await clickLang(page, 'FR'); await scrollAll(page); await page.screenshot({ path: `${OUT}/desktop-fr-full.png`, fullPage: true }); }
    await ctx.close();
  }
  // Arabic booking end-to-end + Arabic error message
  const { ctx, page } = await newPage(devices['Pixel 5']);
  await page.goto(BASE); await page.waitForSelector('[data-testid=plan-card]');
  await page.evaluate(() => localStorage.setItem('lang', 'ar')); await page.reload(); await page.waitForSelector('[data-testid=plan-card]');
  check('language choice persists across reload', (await page.getAttribute('html', 'lang')) === 'ar');
  await page.selectOption('#bk-plan', { index: 2 });
  await page.fill('#bk-date', plus(2)); await page.waitForSelector('[data-testid=slot]');
  await page.locator('[data-testid=slot]:not([disabled])').first().click();
  await page.fill('#bk-name', 'محمد أمين'); await page.fill('#bk-phone', '+213 661 23 45 67');
  await page.getByRole('button', { name: /إرسال طلبي/ }).click();
  await page.waitForSelector('[data-testid=booking-confirmation]');
  check('Arabic booking flow completes (Arabic name stored, +213 phone normalised)', psql(`select full_name||'|'||(select phone from customers) from bookings`) === 'محمد أمين|0661234567' && /تم إرسال الطلب/.test(await page.textContent('[data-testid=booking-confirmation]')));
  await page.screenshot({ path: `${OUT}/phone-ar-confirmation.png` });
  await ctx.close();
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
