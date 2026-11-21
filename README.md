# Salle de Sport Milinium CHERGUI — site + gestion des réservations

React + TypeScript (Vite) · Supabase (PostgreSQL, Auth, RLS) · Netlify. All free-tier; no paid services.

* Public site: `/` (French default, Arabic RTL, English)
* Private dashboard: `/admin` (separate lazy-loaded bundle, login required, `noindex`)

## 1. Supabase setup
1. Create a free project at supabase.com.
2. **SQL Editor** → run `supabase/migrations/0001_schema.sql`, then `0002_seed.sql`.
3. **Authentication → Providers → Email**: keep Email on, **turn OFF "Allow new users to sign up"** (no public registration).
4. **Authentication → Users → Add user**: create the owner (e-mail + strong password, tick *Auto Confirm*).
5. SQL Editor → edit and run `supabase/create_owner.sql` (works only while no owner exists).
6. **Project Settings → API**: copy the *Project URL* and the *anon public* key. Never use the `service_role` key anywhere in this project.
7. Extra employees: create the account in Authentication → Users, then the owner adds the e-mail in dashboard → Gérer → Équipe.

## 2. Environment variables
| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key (public by design; RLS protects data) |

Local: copy `.env.example` to `.env.local`, then `npm install && npm run dev`.

## 3. GitHub + Netlify
1. Push this repo to GitHub.
2. Netlify → *Add new site → Import from Git* → pick the repo. Build command `npm run build`, publish dir `dist` (already in `netlify.toml`, which also handles the SPA redirect so `/admin` works on refresh).
3. Site configuration → Environment variables → add the two variables above → redeploy.
4. Your site is live at `https://<name>.netlify.app` (rename in Site configuration → Change site name). No custom domain needed.

## 4. First-day owner checklist (nothing is invented for you)
1. Log in at `/admin`.
2. **Gérer → Horaires**: add real opening ranges (and any *women-only* ranges). Until you do, customers cannot book.
3. **Gérer → Réglages**: slot length, places per slot (default 10 — adjust), notice and advance-booking limits.
4. **Gérer → Tarifs**: check the six prices (from your photo), enter cardio prices if you wish, then press **"Je confirme les tarifs et je les publie"**. Until then the public site shows "Tarif à confirmer". Only the owner can publish.
5. Optionally add real photos (`public/images/README.md`).

## 5. Security model
* RLS on every table. Public (`anon`) can read only: gym settings, opening hours, active services; plans via `get_public_plans()` (price hidden until published); slots via `get_available_slots()`.
* Public can write **only** through `create_booking()` (validated, rate-limited to 3 pending per phone, idempotent, conflict-checked under a per-day lock). No public read of customers/bookings.
* Staff = rows in `staff`, created only by `bootstrap_owner()` / `add_staff()` (owner). `service_role` key is never used.
* Status workflow, slot re-validation on reschedule and owner-only price publishing are enforced by DB triggers.

## 6. Tests
`npm run test:db` — SQL/RLS/booking-rule suite (needs local Postgres 16). `e2e/` — browser tests (see `e2e/README.md`).
See `TEST_REPORT.md` for exactly what was and was not verified.
