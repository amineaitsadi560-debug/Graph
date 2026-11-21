-- LOCAL TEST ONLY: emulates the parts of Supabase the schema depends on.
create role anon nologin; create role authenticated nologin;
create role authenticator noinherit login password 'test';
grant anon, authenticated to authenticator;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique, encrypted_password text);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
-- Supabase grants everything on new public objects to anon/authenticated by default; reproduce that
-- so the schema's explicit REVOKEs are really tested.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
create publication supabase_realtime;
