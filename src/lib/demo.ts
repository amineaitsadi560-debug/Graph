// DEMO MODE ONLY (VITE_DEMO=1): an in-memory stand-in for Supabase so the app can be previewed without a backend.
// All data is fictional. The production build never uses this file's data (see supabase.ts).
/* eslint-disable @typescript-eslint/no-explicit-any */
const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
const algNow = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) % 24 * 60 + Number(p.minute) };
};
const addDays = (d: string, n: number) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const isoDow = (d: string) => { const g = new Date(d + 'T12:00:00Z').getUTCDay(); return g === 0 ? 7 : g; };
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
class PgErr { constructor(public message: string, public code = 'P0001') {} }

const T = algNow().date;
const L = (fr: string, ar: string, en: string) => ({ name_fr: fr, name_ar: ar, name_en: en });
const db: Record<string, any[]> = {
  gym_settings: [{ id: 1, gym_name: 'Salle de Sport Milinium CHERGUI', phone: '+213 542 42 56 69', address: 'P496+H5C, Bachdjerrah, Algiers, Algeria', maps_url: 'https://maps.app.goo.gl/ALUZcH1xWkpV3CgP7?g_st=ic', rating_value: 4.5, rating_count: 30, prices_confirmed: true, slot_minutes: 60, slot_capacity: 10, min_notice_minutes: 60, max_advance_days: 30 }],
  opening_hours: [] as any[],
  services: [
    { id: 's1', ...L('Séance de musculation', 'حصة بناء الأجسام', 'Strength-training session'), sort_order: 10, is_active: true },
    { id: 's2', ...L('Séance de cardio', 'حصة كارديو', 'Cardio session'), sort_order: 20, is_active: true },
    { id: 's3', ...L('Visite et découverte de la salle', 'زيارة واكتشاف القاعة', 'Gym visit & tour'), sort_order: 30, is_active: true },
  ],
  membership_plans: [
    ['musculation', 'Séance unique', 'حصة واحدة', 'Single session', '1 séance', 'حصة واحدة', '1 session', 250, false],
    ['musculation', '2 séances / semaine', 'حصتان في الأسبوع', '2 sessions / week', '2 séances par semaine', 'حصتان في الأسبوع', '2 sessions per week', 1600, false],
    ['musculation', '3 séances / semaine', '3 حصص في الأسبوع', '3 sessions / week', '3 séances par semaine', '3 حصص في الأسبوع', '3 sessions per week', 1800, false],
    ['musculation', '4 séances / semaine', '4 حصص في الأسبوع', '4 sessions / week', '4 séances par semaine', '4 حصص في الأسبوع', '4 sessions per week', 2000, false],
    ['musculation', 'Illimité', 'غير محدود', 'Unlimited', 'Accès illimité', 'دخول غير محدود', 'Unlimited access', 2600, true],
    ['musculation', 'Offre spéciale 3 mois', 'عرض خاص 3 أشهر', 'Special 3-month offer', 'Offre de 3 mois', 'عرض لمدة 3 أشهر', '3-month offer', 5000, true],
    ['cardio', 'Cardio · Tapis de course', 'كارديو · جهاز الجري', 'Cardio · Treadmill', 'Forfait tapis de course', 'باقة جهاز الجري', 'Treadmill package', null, false],
    ['cardio', 'Cardio · Vélo', 'كارديو · دراجة', 'Cardio · Bike', 'Forfait vélo', 'باقة الدراجة', 'Bike package', null, false],
  ].map((r: any[], i) => ({ id: 'p' + (i + 1), category: r[0], name_fr: r[1], name_ar: r[2], name_en: r[3], detail_fr: r[4], detail_ar: r[5], detail_en: r[6], price_da: r[7], is_featured: r[8], sort_order: (i + 1) * 10, is_active: true })),
  customers: [], bookings: [], blocked_slots: [], staff: [{ user_id: 'owner', email: 'owner@demo.dz', display_name: 'Démo (propriétaire)', role: 'owner' }],
};
// Demo-only opening hours (the real site ships with NONE; the owner configures them)
for (let d = 1; d <= 7; d++) {
  db.opening_hours.push({ id: uid(), weekday: d, opens_at: '09:00:00', closes_at: '12:00:00', audience: 'all' });
  db.opening_hours.push({ id: uid(), weekday: d, opens_at: '14:00:00', closes_at: '16:00:00', audience: 'women' });
  db.opening_hours.push({ id: uid(), weekday: d, opens_at: '16:00:00', closes_at: '20:00:00', audience: 'all' });
}
const S = () => db.gym_settings[0];

function slotStatus(date: string, startMin: number, ignoreTiming = false, exclude?: string) {
  const s = S(); const end = startMin + s.slot_minutes;
  const w = db.opening_hours.find((o) => o.weekday === isoDow(date) && startMin >= mins(o.opens_at) && end <= mins(o.closes_at) && (startMin - mins(o.opens_at)) % s.slot_minutes === 0);
  if (!w) return 'outside_hours';
  if (db.blocked_slots.some((b) => b.block_date === date && (!b.start_time || (mins(b.start_time) < end && mins(b.end_time) > startMin)))) return 'blocked';
  if (!ignoreTiming) {
    const n = algNow();
    if (date < n.date || (date === n.date && startMin < n.min + s.min_notice_minutes)) return 'too_soon';
    if (date > addDays(n.date, s.max_advance_days)) return 'too_far';
  }
  const booked = db.bookings.filter((k) => k.booking_date === date && ['pending', 'confirmed'].includes(k.status) && mins(k.start_time) < end && mins(k.end_time) > startMin && k.id !== exclude).length;
  return booked >= s.slot_capacity ? 'full' : 'ok';
}
function normPhone(p: string) {
  let d = (p || '').replace(/[\s\-.()]/g, '');
  if (d.startsWith('+213')) d = '0' + d.slice(4); else if (d.startsWith('00213')) d = '0' + d.slice(5);
  return /^0([567]\d{8}|[1-4]\d{7})$/.test(d) ? d : null;
}
function createBooking(a: any, byStaff: boolean) {
  const name = (a.p_full_name || '').trim(); const phone = normPhone(a.p_phone);
  if (name.length < 2 || name.length > 100) throw new PgErr('invalid_name');
  if (!phone) throw new PgErr('invalid_phone');
  if (a.p_kind === 'registration' && !db.membership_plans.some((p) => p.id === a.p_plan_id && p.is_active)) throw new PgErr('invalid_plan');
  if (a.p_kind === 'session' && !db.services.some((p) => p.id === a.p_service_id && p.is_active)) throw new PgErr('invalid_service');
  if (a.p_request_key) { const ex = db.bookings.find((b) => b.request_key === a.p_request_key); if (ex) return { ref: ex.id.slice(0, 8).toUpperCase(), status: ex.status, date: ex.booking_date, start: ex.start_time, end: ex.end_time, duplicate: true }; }
  const sm = mins(a.p_start); const st = slotStatus(a.p_date, sm, byStaff); if (st !== 'ok') throw new PgErr(st);
  let c = db.customers.find((x) => x.phone === phone);
  if (!c) { c = { id: uid(), full_name: name, phone, created_at: new Date().toISOString() }; db.customers.push(c); }
  const end = sm + S().slot_minutes;
  if (db.bookings.some((b) => b.customer_id === c.id && b.booking_date === a.p_date && ['pending', 'confirmed'].includes(b.status) && mins(b.start_time) < end && mins(b.end_time) > sm)) throw new PgErr('duplicate');
  if (!byStaff && db.bookings.filter((b) => b.customer_id === c.id && b.status === 'pending').length >= 3) throw new PgErr('too_many_pending');
  const w = db.opening_hours.find((o) => o.weekday === isoDow(a.p_date) && sm >= mins(o.opens_at) && end <= mins(o.closes_at));
  const b = { id: uid().padEnd(12, '0'), customer_id: c.id, full_name: name, kind: a.p_kind, plan_id: a.p_plan_id ?? null, service_id: a.p_service_id ?? null, booking_date: a.p_date, start_time: hm(sm), end_time: hm(end), audience: w?.audience ?? 'all', status: byStaff ? 'confirmed' : 'pending', message: (a.p_message || '').trim() || null, staff_note: null, request_key: a.p_request_key ?? null, created_at: new Date().toISOString() };
  db.bookings.push(b);
  return { ref: b.id.slice(0, 8).toUpperCase(), status: b.status, date: b.booking_date, start: b.start_time, end: b.end_time, duplicate: false };
}
// fictional starter data so the dashboard is not empty
[['Karim Benali', '0555123456', 'registration', 'p5', null, 1, 9, 'pending', 'Je débute, merci !'], ['Sarah Haddad', '0661234567', 'session', null, 's1', 1, 10, 'pending', null], ['Yacine Mebarki', '0770123456', 'registration', 'p2', null, 2, 16, 'confirmed', null], ['Lina Boudiaf', '0542987654', 'session', null, 's2', 0, 17, 'confirmed', null]].forEach(([n, p, k, pl, sv, off, h, st, msg]: any) => {
  try { const r = createBooking({ p_full_name: n, p_phone: p, p_kind: k, p_plan_id: pl, p_service_id: sv, p_date: addDays(T, off), p_start: hm(h * 60), p_message: msg }, true); const b = db.bookings.find((x) => x.id.slice(0, 8).toUpperCase() === r.ref); if (b) b.status = st; } catch { /* slot may be past today */ }
});

const OK = { allowed: { pending: ['confirmed', 'rejected', 'cancelled'], confirmed: ['completed', 'cancelled', 'pending'], rejected: ['pending'], cancelled: ['pending'], completed: [] } as Record<string, string[]> };
function applyUpdate(table: string, row: any, patch: any) {
  if (table === 'bookings' && patch.status && patch.status !== row.status) {
    if (!OK.allowed[row.status].includes(patch.status)) throw new PgErr('invalid_transition');
    if (['pending', 'confirmed'].includes(patch.status) && !['pending', 'confirmed'].includes(row.status)) { const st = slotStatus(row.booking_date, mins(row.start_time), true, row.id); if (st !== 'ok') throw new PgErr(st); }
  }
  Object.assign(row, patch);
}
const embed = (table: string, sel: string, row: any) => {
  const r: any = { ...row };
  if (table === 'bookings') {
    if (sel.includes('customers(')) { const c = db.customers.find((x) => x.id === row.customer_id); r.customers = c ? { phone: c.phone, full_name: c.full_name } : null; }
    if (sel.includes('membership_plans(')) r.membership_plans = db.membership_plans.find((x) => x.id === row.plan_id) ?? null;
    if (sel.includes('services(')) r.services = db.services.find((x) => x.id === row.service_id) ?? null;
  }
  if (table === 'customers' && sel.includes('bookings(')) r.bookings = [{ count: db.bookings.filter((b) => b.customer_id === row.id).length }];
  return r;
};

class Q {
  mode = 'select'; filters: ((r: any) => boolean)[] = []; orders: [string, boolean][] = []; lim = Infinity; sel = '*'; one = false; payload: any; returning = true;
  constructor(public table: string) {}
  select(s = '*') { this.sel = s; if (this.mode !== 'select') this.returning = true; return this; }
  insert(p: any) { this.mode = 'insert'; this.payload = p; this.returning = false; return this; }
  update(p: any) { this.mode = 'update'; this.payload = p; this.returning = false; return this; }
  delete() { this.mode = 'delete'; this.returning = false; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  gte(c: string, v: any) { this.filters.push((r) => r[c] >= v); return this; }
  lte(c: string, v: any) { this.filters.push((r) => r[c] <= v); return this; }
  order(c: string, o: { ascending?: boolean } = {}) { this.orders.push([c, o.ascending !== false]); return this; }
  limit(n: number) { this.lim = n; return this; }
  single() { this.one = true; return this; }
  then<A, B>(f?: (v: any) => A, r?: (e: any) => B) { return Promise.resolve(this.run()).then(f, r); }
  run() {
    try {
      const rows = db[this.table]; let out: any[] = [];
      if (this.mode === 'insert') {
        const row = { id: uid(), created_at: new Date().toISOString(), ...this.payload };
        if (this.table === 'opening_hours') { const o = rows.find((x) => x.weekday === row.weekday && mins(x.opens_at) < mins(row.closes_at) && mins(x.closes_at) > mins(row.opens_at)); if (o) throw new PgErr('hours_overlap'); }
        rows.push(row); out = [row];
      } else {
        out = rows.filter((r) => this.filters.every((f) => f(r)));
        if (this.mode === 'update') out.forEach((r) => applyUpdate(this.table, r, this.payload));
        if (this.mode === 'delete') {
          if (this.table === 'membership_plans' && out.some((p) => db.bookings.some((b) => b.plan_id === p.id))) throw Object.assign(new PgErr('fk', '23503'));
          if (this.table === 'services' && out.some((p) => db.services && db.bookings.some((b) => b.service_id === p.id))) throw Object.assign(new PgErr('fk', '23503'));
          out.forEach((r) => rows.splice(rows.indexOf(r), 1));
        }
      }
      for (const [c, asc] of [...this.orders].reverse()) out = [...out].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
      out = out.slice(0, this.lim).map((r) => embed(this.table, this.sel, r));
      if (this.one) return out[0] ? { data: out[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'no rows' } };
      return { data: this.mode === 'select' || this.returning ? out : null, error: null };
    } catch (e: any) { return { data: null, error: { message: e.message, code: e.code ?? 'P0001' } }; }
  }
}

const rpcs: Record<string, (a: any) => any> = {
  get_public_plans: () => db.membership_plans.filter((p) => p.is_active).map((p) => ({ ...p, price_da: S().prices_confirmed ? p.price_da : null })),
  get_available_slots: (a) => db.opening_hours.filter((o) => o.weekday === isoDow(a.p_date)).flatMap((o) => {
    const out = []; for (let m = mins(o.opens_at); m + S().slot_minutes <= mins(o.closes_at); m += S().slot_minutes) {
      const e = m + S().slot_minutes; const used = db.bookings.filter((k) => k.booking_date === a.p_date && ['pending', 'confirmed'].includes(k.status) && mins(k.start_time) < e && mins(k.end_time) > m).length;
      out.push({ slot_start: hm(m), slot_end: hm(e), audience: o.audience, remaining: Math.max(0, S().slot_capacity - used), status: slotStatus(a.p_date, m) });
    } return out; }).sort((x, y) => x.slot_start.localeCompare(y.slot_start)),
  create_booking: (a) => createBooking(a, false),
  staff_create_booking: (a) => createBooking(a, true),
  is_staff: () => true, is_owner: () => true,
  dashboard_stats: () => {
    const n = algNow().date; const bs = db.bookings; const by: Record<string, any> = {};
    bs.filter((b) => b.kind === 'registration' && b.plan_id).forEach((b) => { by[b.plan_id] ??= { plan_id: b.plan_id, total: 0, active: 0 }; by[b.plan_id].total++; if (b.status !== 'rejected' && b.status !== 'cancelled') by[b.plan_id].active++; });
    return { total_customers: db.customers.length, pending: bs.filter((b) => b.status === 'pending').length, confirmed: bs.filter((b) => b.status === 'confirmed').length, upcoming: bs.filter((b) => b.status === 'confirmed' && b.booking_date >= n).length, today: bs.filter((b) => ['pending', 'confirmed'].includes(b.status) && b.booking_date === n).length, completed: bs.filter((b) => b.status === 'completed').length, by_plan: Object.values(by) };
  },
  list_staff: () => db.staff,
  add_staff: (a) => { db.staff.push({ user_id: uid(), email: a.p_email, display_name: a.p_name, role: a.p_role }); return null; },
  remove_staff: (a) => { db.staff = db.staff.filter((s) => s.user_id !== a.p_user); return null; },
};

export function createDemoClient(): any {
  let session: any = null;
  return {
    from: (t: string) => new Q(t),
    rpc: async (name: string, args: any = {}) => { try { return { data: rpcs[name](args) ?? null, error: null }; } catch (e: any) { return { data: null, error: { message: e.message, code: e.code ?? 'P0001' } }; } },
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async ({ email, password }: any) => {
        if (email.trim().toLowerCase() === 'owner@demo.dz' && password === 'demo1234') { session = { user: { id: 'owner', email } }; return { data: { session }, error: null }; }
        return { data: { session: null }, error: { message: 'Invalid login credentials' } };
      },
      signOut: async () => { session = null; return { error: null }; },
    },
    channel: () => { const c: any = { on: () => c, subscribe: () => c }; return c; },
    removeChannel: () => {},
  };
}
