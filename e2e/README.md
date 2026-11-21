# End-to-end tests

`public.e2e.mjs` drives the public site in real Chromium. The database is the real schema running in a local
Postgres (RLS, booking functions, `anon` role); only the HTTP layer is emulated by Playwright (it runs the SQL
equivalent of each Supabase call). Run:

```bash
tests/db/start_local_db.sh
VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=x npx vite build --outDir dist-e2e
npx vite preview --outDir dist-e2e --port 4173 &
NODE_PATH=$(npm root -g) node e2e/public.e2e.mjs
```
