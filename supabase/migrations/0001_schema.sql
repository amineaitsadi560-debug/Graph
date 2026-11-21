-- =====================================================================
-- Milinium CHERGUI — database schema, booking logic and Row Level Security
-- Run in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run on a fresh project. (Not idempotent: run once.)
-- =====================================================================

-- ---------- Types ----------------------------------------------------
create type public.booking_status as enum ('pending','confirmed','rejected','cancelled','completed');
create type public.booking_kind   as enum ('registration','session');
create type public.audience       as enum ('all','women','men');

-- ---------- Tables ---------------------------------------------------
-- Single-row gym configuration (id is forced to 1).
create table public.gym_settings (
  id                 smallint primary key default 1 check (id = 1),
  gym_name           text    not null default 'Salle de Sport Milinium CHERGUI',
  phone              text    not null default '+213 542 42 56 69',
  address            text    not null default 'P496+H5C, Bachdjerrah, Algiers, Algeria',
  maps_url           text    not null default 'https://maps.app.goo.gl/ALUZcH1xWkpV3CgP7?g_st=ic',
  rating_value       numeric(2,1),
  rating_count       integer,
  prices_confirmed   boolean not null default false,   -- owner must confirm before prices are shown publicly
  slot_minutes       integer not null default 60  check (slot_minutes in (15,20,30,45,60,90,120)),
  slot_capacity      integer not null default 10  check (slot_capacity between 1 and 500),
  min_notice_minutes integer not null default 60  check (min_notice_minutes >= 0),
  max_advance_days   integer not null default 30  check (max_advance_days between 1 and 365),
  updated_at         timestamptz not null default now()
);

-- Opening windows. weekday uses ISO numbering: 1 = Monday … 7 = Sunday.
-- NOTHING is seeded: the owner must configure real hours (and any women-only windows).
create table public.opening_hours (
  id        uuid primary key default gen_random_uuid(),
  weekday   smallint not null check (weekday between 1 and 7),
  opens_at  time not null,
  closes_at time not null,
  audience  public.audience not null default 'all',
  check (opens_at < closes_at)
);

create table public.services (
  id             uuid primary key default gen_random_uuid(),
  name_fr        text not null,
  name_ar        text not null,
  name_en        text not null,
  description_fr text, description_ar text, description_en text,
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.membership_plans (
  id          uuid primary key default gen_random_uuid(),
  category    text not null default 'musculation' check (category in ('musculation','cardio')),
  name_fr     text not null,
  name_ar     text not null,
  name_en     text not null,
  detail_fr   text, detail_ar text, detail_en text,
  price_da    integer check (price_da is null or price_da >= 0),  -- NULL = price not set
  is_featured boolean not null default false,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text not null unique,          -- normalised national format, e.g. 0542425669
  created_at timestamptz not null default now()
);

create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  full_name    text not null,               -- name as typed on this request
  kind         public.booking_kind not null,
  plan_id      uuid references public.membership_plans(id) on delete restrict,
  service_id   uuid references public.services(id) on delete restrict,
  booking_date date not null,
  start_time   time not null,
  end_time     time not null,
  audience     public.audience not null default 'all',
  status       public.booking_status not null default 'pending',
  message      text check (message is null or char_length(message) <= 500),
  staff_note   text check (staff_note is null or char_length(staff_note) <= 500),
  request_key  text unique,                 -- client idempotency key (duplicate-submit protection)
  handled_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (end_time > start_time),
  check ((kind = 'registration' and plan_id is not null) or (kind = 'session' and service_id is not null))
);
create index bookings_date_idx     on public.bookings (booking_date, start_time);
create index bookings_status_idx   on public.bookings (status);
create index bookings_customer_idx on public.bookings (customer_id);

-- Slots the staff blocked. start_time/end_time NULL = whole day.
create table public.blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  block_date date not null,
  start_time time,
  end_time   time,
  reason     text,
  created_at timestamptz not null default now(),
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null and start_time < end_time))
);
create index blocked_date_idx on public.blocked_slots (block_date);

-- Authorised employees. Rows are created ONLY by bootstrap_owner() / add_staff().
create table public.staff (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role         text not null default 'employee' check (role in ('owner','employee')),
  created_at   timestamptz not null default now()
);

-- ---------- Helper functions -----------------------------------------
create function public.local_now() returns timestamp
language sql stable as $$ select now() at time zone 'Africa/Algiers' $$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.staff where user_id = auth.uid()) $$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.staff where user_id = auth.uid() and role = 'owner') $$;

-- Algerian numbers: +213 / 00213 / 0 prefix; mobile 05/06/07 + 8 digits, landline 01-04 + 7 digits.
create function public.normalize_phone(p text) returns text
language plpgsql immutable as $$
declare d text := regexp_replace(coalesce(p,''), '[\s\-\.\(\)]', '', 'g');
begin
  if    d ~ '^\+213' then d := '0' || substr(d, 5);
  elsif d ~ '^00213' then d := '0' || substr(d, 6);
  elsif d ~ '^213[0-9]{8,9}$' then d := '0' || substr(d, 4);
  end if;
  if d ~ '^0([567][0-9]{8}|[1-4][0-9]{7})$' then return d; end if;
  return null;
end $$;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- Opening-hours sanity: windows of one weekday must not overlap
create function public.check_opening_overlap() returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.opening_hours o
             where o.weekday = new.weekday and o.id <> new.id
               and o.opens_at < new.closes_at and o.closes_at > new.opens_at) then
    raise exception 'hours_overlap' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger opening_hours_overlap before insert or update on public.opening_hours
  for each row execute function public.check_opening_overlap();

-- ---------- Settings: only an owner may publish/unpublish prices ------
create function public.settings_guard() returns trigger language plpgsql as $$
begin
  new.id := 1;
  new.updated_at := now();
  if new.prices_confirmed is distinct from old.prices_confirmed
     and auth.uid() is not null and not public.is_owner() then
    raise exception 'owner_only' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger gym_settings_guard before update on public.gym_settings
  for each row execute function public.settings_guard();

-- ---------- Slot logic -----------------------------------------------
-- Returns 'ok' or the reason a slot cannot be booked:
-- outside_hours | blocked | too_soon | too_far | full
create function public.slot_status(
  p_date date, p_start time,
  p_ignore_timing boolean default false, p_exclude uuid default null
) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  s public.gym_settings;
  w public.opening_hours;
  start_min int := (extract(epoch from p_start)::int) / 60;
  end_min   int;
  slot_end  time;
  booked    int;
begin
  select * into s from public.gym_settings where id = 1;
  end_min  := start_min + s.slot_minutes;
  slot_end := make_time(end_min / 60, end_min % 60, 0);

  select * into w from public.opening_hours
   where weekday = extract(isodow from p_date)
     and start_min >= (extract(epoch from opens_at)::int) / 60
     and end_min   <= (extract(epoch from closes_at)::int) / 60
     and (start_min - (extract(epoch from opens_at)::int) / 60) % s.slot_minutes = 0
   limit 1;
  if not found or end_min >= 1440 then return 'outside_hours'; end if;

  if exists (select 1 from public.blocked_slots b
             where b.block_date = p_date
               and (b.start_time is null or (b.start_time < slot_end and b.end_time > p_start)))
  then return 'blocked'; end if;

  if not p_ignore_timing then
    if (p_date + p_start) < public.local_now() + make_interval(mins => s.min_notice_minutes) then return 'too_soon'; end if;
    if p_date > public.local_now()::date + s.max_advance_days then return 'too_far'; end if;
  end if;

  select count(*) into booked from public.bookings k
   where k.booking_date = p_date and k.status in ('pending','confirmed')
     and k.start_time < slot_end and k.end_time > p_start
     and k.id is distinct from p_exclude;
  if booked >= s.slot_capacity then return 'full'; end if;

  return 'ok';
end $$;

-- Public: list every slot of a day with its availability (no personal data).
create function public.get_available_slots(p_date date)
returns table (slot_start time, slot_end time, audience public.audience, remaining integer, status text)
language plpgsql stable security definer set search_path = public as $$
declare s public.gym_settings;
begin
  select * into s from public.gym_settings where id = 1;
  return query
  with slots as (
    select m as sm, o.audience as aud
    from public.opening_hours o,
         lateral generate_series(
           (extract(epoch from o.opens_at)::int) / 60,
           (extract(epoch from o.closes_at)::int) / 60 - s.slot_minutes,
           s.slot_minutes) m
    where o.weekday = extract(isodow from p_date)
  )
  select make_time(sl.sm / 60, sl.sm % 60, 0),
         make_time((sl.sm + s.slot_minutes) / 60, (sl.sm + s.slot_minutes) % 60, 0),
         sl.aud,
         greatest(0, s.slot_capacity - (
           select count(*)::int from public.bookings k
            where k.booking_date = p_date and k.status in ('pending','confirmed')
              and k.start_time < make_time((sl.sm + s.slot_minutes) / 60, (sl.sm + s.slot_minutes) % 60, 0)
              and k.end_time   > make_time(sl.sm / 60, sl.sm % 60, 0))),
         public.slot_status(p_date, make_time(sl.sm / 60, sl.sm % 60, 0))
  from slots sl
  order by sl.sm;
end $$;

-- Public plans: the price is hidden until the owner has confirmed prices.
create function public.get_public_plans()
returns table (id uuid, category text, name_fr text, name_ar text, name_en text,
               detail_fr text, detail_ar text, detail_en text,
               price_da integer, is_featured boolean, sort_order integer)
language sql stable security definer set search_path = public as $$
  select p.id, p.category, p.name_fr, p.name_ar, p.name_en, p.detail_fr, p.detail_ar, p.detail_en,
         case when (select prices_confirmed from public.gym_settings where id = 1) then p.price_da end,
         p.is_featured, p.sort_order
  from public.membership_plans p where p.is_active order by p.sort_order, p.created_at
$$;

-- ---------- Booking creation -----------------------------------------
-- Shared implementation. Errors are raised as short codes the UI translates.
create function public._create_booking(
  p_full_name text, p_phone text, p_kind public.booking_kind,
  p_plan_id uuid, p_service_id uuid, p_date date, p_start time,
  p_message text, p_request_key text, p_by_staff boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_name text := btrim(coalesce(p_full_name, ''));
  v_phone text := public.normalize_phone(p_phone);
  v_msg text := nullif(btrim(coalesce(p_message, '')), '');
  s public.gym_settings;
  v_status text; v_cust uuid; v_end time; v_aud public.audience; v_id uuid;
  existing public.bookings;
begin
  if p_date is null or p_start is null or p_kind is null then raise exception 'invalid_input' using errcode='P0001'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 100 then raise exception 'invalid_name' using errcode='P0001'; end if;
  if v_phone is null then raise exception 'invalid_phone' using errcode='P0001'; end if;
  if v_msg is not null and char_length(v_msg) > 500 then raise exception 'message_too_long' using errcode='P0001'; end if;
  if p_request_key is not null and char_length(p_request_key) > 100 then raise exception 'invalid_input' using errcode='P0001'; end if;

  if p_kind = 'registration' then
    if p_plan_id is null or not exists (select 1 from public.membership_plans where id = p_plan_id and is_active)
      then raise exception 'invalid_plan' using errcode='P0001'; end if;
    p_service_id := null;
  else
    if p_service_id is null or not exists (select 1 from public.services where id = p_service_id and is_active)
      then raise exception 'invalid_service' using errcode='P0001'; end if;
    p_plan_id := null;
  end if;

  -- Serialise bookings per day so two people cannot take the last place at once.
  perform pg_advisory_xact_lock(hashtext('booking:' || p_date::text));

  -- Duplicate-submit protection (same idempotency key => same booking).
  if p_request_key is not null then
    select * into existing from public.bookings where request_key = p_request_key;
    if found then
      return jsonb_build_object('ref', upper(substr(existing.id::text, 1, 8)), 'status', existing.status,
        'date', existing.booking_date, 'start', existing.start_time, 'end', existing.end_time, 'duplicate', true);
    end if;
  end if;

  select * into s from public.gym_settings where id = 1;
  v_status := public.slot_status(p_date, p_start, p_by_staff);
  if v_status <> 'ok' then raise exception '%', v_status using errcode='P0001'; end if;

  v_end := make_time(((extract(epoch from p_start)::int) / 60 + s.slot_minutes) / 60,
                     ((extract(epoch from p_start)::int) / 60 + s.slot_minutes) % 60, 0);
  select o.audience into v_aud from public.opening_hours o
   where o.weekday = extract(isodow from p_date) and p_start >= o.opens_at and v_end <= o.closes_at limit 1;

  insert into public.customers (full_name, phone) values (v_name, v_phone)
    on conflict (phone) do update set phone = excluded.phone   -- keep the first registered name
    returning id into v_cust;

  if exists (select 1 from public.bookings
             where customer_id = v_cust and booking_date = p_date and status in ('pending','confirmed')
               and start_time < v_end and end_time > p_start)
    then raise exception 'duplicate' using errcode='P0001'; end if;

  if not p_by_staff and (select count(*) from public.bookings where customer_id = v_cust and status = 'pending') >= 3
    then raise exception 'too_many_pending' using errcode='P0001'; end if;

  insert into public.bookings (customer_id, full_name, kind, plan_id, service_id, booking_date, start_time, end_time,
                               audience, status, message, request_key, handled_by)
  values (v_cust, v_name, p_kind, p_plan_id, p_service_id, p_date, p_start, v_end, v_aud,
          (case when p_by_staff then 'confirmed' else 'pending' end)::public.booking_status,
          v_msg, p_request_key, case when p_by_staff then auth.uid() end)
  returning id into v_id;

  return jsonb_build_object('ref', upper(substr(v_id::text, 1, 8)),
    'status', case when p_by_staff then 'confirmed' else 'pending' end,
    'date', p_date, 'start', p_start, 'end', v_end, 'duplicate', false);
end $$;

create function public.create_booking(
  p_full_name text, p_phone text, p_kind public.booking_kind, p_plan_id uuid, p_service_id uuid,
  p_date date, p_start time, p_message text default null, p_request_key text default null
) returns jsonb language sql security definer set search_path = public as $$
  select public._create_booking(p_full_name, p_phone, p_kind, p_plan_id, p_service_id, p_date, p_start,
                                p_message, p_request_key, false)
$$;

-- Staff-only: phone / walk-in booking, created already confirmed.
create function public.staff_create_booking(
  p_full_name text, p_phone text, p_kind public.booking_kind, p_plan_id uuid, p_service_id uuid,
  p_date date, p_start time, p_message text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode='42501'; end if;
  return public._create_booking(p_full_name, p_phone, p_kind, p_plan_id, p_service_id, p_date, p_start, p_message, null, true);
end $$;

-- ---------- Booking status workflow (enforced in the database) --------
create function public.bookings_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare s public.gym_settings; v text; em int;
begin
  new.updated_at := now();
  if auth.uid() is not null then new.handled_by := auth.uid(); end if;

  if new.status is distinct from old.status then
    if not ((old.status = 'pending'   and new.status in ('confirmed','rejected','cancelled'))
         or (old.status = 'confirmed' and new.status in ('completed','cancelled','pending'))
         or (old.status in ('rejected','cancelled') and new.status = 'pending')) then
      raise exception 'invalid_transition' using errcode='P0001';
    end if;
  end if;

  -- Re-validate the slot when a booking becomes active again or is moved.
  if new.status in ('pending','confirmed')
     and (old.status not in ('pending','confirmed')
          or new.booking_date <> old.booking_date or new.start_time <> old.start_time) then
    perform pg_advisory_xact_lock(hashtext('booking:' || new.booking_date::text));
    select * into s from public.gym_settings where id = 1;
    em := (extract(epoch from new.start_time)::int) / 60 + s.slot_minutes;
    new.end_time := make_time(em / 60, em % 60, 0);
    v := public.slot_status(new.booking_date, new.start_time, true, new.id);
    if v <> 'ok' then raise exception '%', v using errcode='P0001'; end if;
  end if;
  return new;
end $$;
create trigger bookings_guard_trg before update on public.bookings
  for each row execute function public.bookings_guard();

-- ---------- Staff management (owner only) ----------------------------
-- First owner: run `select public.bootstrap_owner('you@example.com');` in the SQL editor
-- AFTER creating that user in Authentication → Users. Works only while `staff` is empty.
create function public.bootstrap_owner(p_email text, p_name text default 'Owner') returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if exists (select 1 from public.staff) then raise exception 'owner_already_exists'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then raise exception 'user_not_found: create the user in Authentication → Users first'; end if;
  insert into public.staff (user_id, display_name, role) values (uid, p_name, 'owner');
  return 'owner created for ' || p_email;
end $$;

create function public.add_staff(p_email text, p_name text, p_role text default 'employee') returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_owner() then raise exception 'owner_only' using errcode='42501'; end if;
  if p_role not in ('owner','employee') then raise exception 'invalid_input' using errcode='P0001'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then raise exception 'user_not_found' using errcode='P0001'; end if;
  insert into public.staff (user_id, display_name, role) values (uid, btrim(p_name), p_role)
    on conflict (user_id) do update set display_name = excluded.display_name, role = excluded.role;
end $$;

create function public.remove_staff(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'owner_only' using errcode='42501'; end if;
  if p_user = auth.uid() then raise exception 'cannot_remove_self' using errcode='P0001'; end if;
  delete from public.staff where user_id = p_user;
end $$;

create function public.list_staff() returns table (user_id uuid, email text, display_name text, role text)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode='42501'; end if;
  return query select s.user_id, u.email::text, s.display_name, s.role
               from public.staff s join auth.users u on u.id = s.user_id order by s.created_at;
end $$;

-- ---------- Dashboard statistics (staff only) --------------------------
create function public.dashboard_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare today date := public.local_now()::date; r jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden' using errcode='42501'; end if;
  select jsonb_build_object(
    'total_customers', (select count(*) from public.customers),
    'pending',         (select count(*) from public.bookings where status = 'pending'),
    'confirmed',       (select count(*) from public.bookings where status = 'confirmed'),
    'upcoming',        (select count(*) from public.bookings where status = 'confirmed' and booking_date >= today),
    'today',           (select count(*) from public.bookings where status in ('pending','confirmed') and booking_date = today),
    'completed',       (select count(*) from public.bookings where status = 'completed'),
    'by_plan', coalesce((select jsonb_agg(jsonb_build_object('plan_id', plan_id, 'total', total, 'active', active) order by total desc)
        from (select plan_id, count(*) total, count(*) filter (where status in ('pending','confirmed','completed')) active
              from public.bookings where kind = 'registration' and plan_id is not null group by plan_id) q), '[]'::jsonb)
  ) into r;
  return r;
end $$;

-- ---------- Row Level Security ---------------------------------------
alter table public.gym_settings     enable row level security;
alter table public.opening_hours    enable row level security;
alter table public.services         enable row level security;
alter table public.membership_plans enable row level security;
alter table public.customers        enable row level security;
alter table public.bookings         enable row level security;
alter table public.blocked_slots    enable row level security;
alter table public.staff            enable row level security;

-- Public (anon) may only READ non-sensitive configuration.
create policy settings_public_read on public.gym_settings  for select to anon, authenticated using (true);
create policy hours_public_read    on public.opening_hours for select to anon, authenticated using (true);
create policy services_public_read on public.services      for select to anon, authenticated using (is_active);
-- (membership_plans has NO public policy: the public reads it through get_public_plans().)

-- Staff: full access to operational data.
create policy settings_staff_update on public.gym_settings     for update to authenticated using (is_staff()) with check (is_staff());
create policy hours_staff_all       on public.opening_hours    for all    to authenticated using (is_staff()) with check (is_staff());
create policy services_staff_all    on public.services         for all    to authenticated using (is_staff()) with check (is_staff());
create policy plans_staff_all       on public.membership_plans for all    to authenticated using (is_staff()) with check (is_staff());
create policy customers_staff_all   on public.customers        for all    to authenticated using (is_staff()) with check (is_staff());
create policy bookings_staff_select on public.bookings         for select to authenticated using (is_staff());
create policy bookings_staff_update on public.bookings         for update to authenticated using (is_staff()) with check (is_staff());
create policy bookings_owner_delete on public.bookings         for delete to authenticated using (is_owner());
create policy blocked_staff_all     on public.blocked_slots    for all    to authenticated using (is_staff()) with check (is_staff());
create policy staff_staff_select    on public.staff            for select to authenticated using (is_staff());
-- No insert/update/delete policy on staff: it is changed only via add_staff()/remove_staff()/bootstrap_owner().
-- Bookings have no INSERT policy: they are created only through create_booking()/staff_create_booking().

-- ---------- Privileges (defence in depth on top of RLS) ----------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.gym_settings, public.opening_hours, public.services to anon;
grant select on public.gym_settings, public.opening_hours, public.services to authenticated;
grant update on public.gym_settings to authenticated;
grant select, insert, update, delete on public.opening_hours, public.services, public.membership_plans,
      public.customers, public.blocked_slots to authenticated;
grant select, update on public.bookings to authenticated;
grant delete on public.bookings to authenticated;          -- RLS limits this to owners
grant select on public.staff to authenticated;

grant execute on function public.get_available_slots(date)  to anon, authenticated;
grant execute on function public.get_public_plans()         to anon, authenticated;
grant execute on function public.create_booking(text,text,public.booking_kind,uuid,uuid,date,time,text,text) to anon, authenticated;
grant execute on function public.is_staff(), public.is_owner(), public.local_now() to anon, authenticated;
grant execute on function public.staff_create_booking(text,text,public.booking_kind,uuid,uuid,date,time,text) to authenticated;
grant execute on function public.add_staff(text,text,text), public.remove_staff(uuid),
      public.list_staff(), public.dashboard_stats() to authenticated;
-- bootstrap_owner(), slot_status(), _create_booking(), normalize_phone() are NOT callable by API roles.

-- ---------- Realtime: dashboard refreshes instantly on new bookings ----
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;
