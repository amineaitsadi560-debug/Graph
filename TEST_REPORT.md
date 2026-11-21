# Test report (what was actually verified, and what was NOT)

Environment: sandbox with no access to supabase.com, netlify.com or Unsplash. Therefore **nothing was run against a real Supabase project or Netlify**.

## Verified (automated, re-runnable)
**Database (`npm run test:db`, real PostgreSQL 16 with Supabase-like roles; ~80 assertions + concurrency race)**
- anon cannot read customers/bookings/plans/staff/blocked_slots; cannot update prices/settings; cannot insert bookings directly; cannot call staff/bootstrap functions
- employee/owner/stranger permissions; only owner can publish prices, add/remove staff; staff table not writable directly
- booking rules: invalid name/phone, outside hours, off-grid time, past, too far, blocked slot, whole-day block, capacity full, same-customer duplicate, idempotency key, max 3 pending per phone, closed weekday
- status workflow (pending→confirmed/rejected/cancelled, confirmed→completed…, completed final), reopening into a full slot refused, reschedule re-validated
- 8 simultaneous requests for the last place → exactly 1 succeeds

**Public site (`e2e/public.e2e.mjs`, real Chromium, 47 checks)**: French default, Arabic RTL, English; prices hidden until published, cardio prices not invented; full phone booking (iPhone 13 / Pixel 5) stored in DB; double-click = 1 booking; client validation; stale-slot conflict message; blocked/full slots disabled; no-hours state; no horizontal overflow at 360/390/768/1440 px in FR/AR/EN; language persistence.
Caveat: HTTP transport emulated by Playwright running equivalent SQL as role `anon`.

## NOT verified yet
- Dashboard UI (login, list, approve/reject, calendar, price/hours editing) in a browser: it compiles (`tsc`) and builds but has **not been exercised**; needs PostgREST + GoTrue (a PostgREST test run was blocked by the sandbox permission layer).
- Supabase Auth login, Realtime push, real RLS through PostgREST/JWT, Google Maps iframe rendering, Netlify deployment, real GitHub→Netlify pipeline.
