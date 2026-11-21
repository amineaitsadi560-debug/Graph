-- Database / RLS / booking-rule tests. Run via tests/db/run_tests.sh against the local mock stack.
\set ON_ERROR_STOP on
create schema if not exists t;
create table if not exists t.results (name text, ok boolean, detail text);
truncate t.results;
grant usage on schema t to anon, authenticated; grant all on t.results to anon, authenticated;

create or replace function t.rec(p_name text, p_ok boolean, p_detail text default '') returns void
language sql security definer as $$ insert into t.results values (p_name, p_ok, p_detail) $$;
grant execute on function t.rec(text,boolean,text) to anon, authenticated;

-- run a statement as a role/user; returns 'OK' or the error message (SQLSTATE: message)
create or replace function t.try(p_role text, p_uid uuid, p_sql text) returns text language plpgsql as $$
declare res text := 'OK';
begin
  begin
    perform set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
    execute 'set local role ' || p_role;
    execute p_sql;
  exception when others then res := sqlstate || ': ' || sqlerrm;
  end;
  execute 'reset role';
  return res;
end $$;
-- same, but returns a scalar query result as text
create or replace function t.q(p_role text, p_uid uuid, p_sql text) returns text language plpgsql as $$
declare res text;
begin
  begin
    perform set_config('request.jwt.claims', case when p_uid is null then '' else json_build_object('sub', p_uid)::text end, true);
    execute 'set local role ' || p_role;
    execute p_sql into res;
  exception when others then res := 'ERR ' || sqlstate || ': ' || sqlerrm;
  end;
  execute 'reset role';
  return res;
end $$;

-- ---------- fixtures --------------------------------------------------
delete from public.bookings; delete from public.customers; delete from public.blocked_slots; delete from public.staff;
delete from public.opening_hours; delete from auth.users;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1','owner@test.dz'),
  ('00000000-0000-0000-0000-0000000000a2','emp@test.dz'),
  ('00000000-0000-0000-0000-0000000000a3','stranger@test.dz'),
  ('00000000-0000-0000-0000-0000000000a4','emp2@test.dz');
update public.gym_settings set slot_capacity = 2, prices_confirmed = false, slot_minutes = 60, min_notice_minutes = 60, max_advance_days = 30;

do $$
declare
  owner_ uuid := '00000000-0000-0000-0000-0000000000a1';
  emp uuid := '00000000-0000-0000-0000-0000000000a2';
  stranger uuid := '00000000-0000-0000-0000-0000000000a3';
  emp2 uuid := '00000000-0000-0000-0000-0000000000a4';
  r text; plan uuid; plan_cardio uuid; svc uuid; d date := public.local_now()::date + 5; j jsonb; bid uuid; w int;
  cnt int;
begin
  -- bootstrap
  r := t.try('anon', null, $q$select public.bootstrap_owner('owner@test.dz')$q$);
  perform t.rec('anon cannot call bootstrap_owner', r like '42501%', r);
  select public.bootstrap_owner('owner@test.dz','Owner') into r;
  perform t.rec('bootstrap_owner creates first owner', exists(select 1 from public.staff where user_id = owner_ and role='owner'));
  begin perform public.bootstrap_owner('emp@test.dz'); r := 'OK'; exception when others then r := sqlerrm; end;
  perform t.rec('bootstrap_owner refuses second run', r like 'owner_already_exists%', r);
  insert into public.staff values (emp, 'Employee', 'employee');

  -- opening hours: every weekday 09-12 (all) and 14-18 (women)
  for w in 1..7 loop
    insert into public.opening_hours (weekday, opens_at, closes_at, audience) values (w,'09:00','12:00','all'),(w,'14:00','18:00','women');
  end loop;
  r := t.try('authenticated', emp, $q$insert into public.opening_hours (weekday,opens_at,closes_at) values (1,'10:00','11:00')$q$);
  perform t.rec('overlapping opening windows rejected', r like '%hours_overlap%', r);

  select id into plan from public.membership_plans where name_en='Unlimited';
  select id into plan_cardio from public.membership_plans where name_en='Cardio · Treadmill';
  select id into svc from public.services where name_en like 'Strength%';

  -- anonymous access to private tables
  for r in select unnest(array['customers','bookings','membership_plans','staff','blocked_slots']) loop
    perform t.rec('anon cannot read '||r, t.try('anon', null, 'select * from public.'||r) like '42501%', t.try('anon', null, 'select * from public.'||r));
  end loop;
  perform t.rec('anon can read opening_hours', t.try('anon', null, 'select * from public.opening_hours') = 'OK');
  perform t.rec('anon can read gym_settings', t.try('anon', null, 'select * from public.gym_settings') = 'OK');
  perform t.rec('anon can read services', t.try('anon', null, 'select * from public.services') = 'OK');
  perform t.rec('anon cannot update prices', t.try('anon', null, $q$update public.membership_plans set price_da = 1$q$) like '42501%');
  perform t.rec('anon cannot update settings', t.try('anon', null, $q$update public.gym_settings set phone='x'$q$) like '42501%');
  perform t.rec('anon cannot insert booking directly', t.try('anon', null,
     format($q$insert into public.bookings (customer_id,full_name,kind,plan_id,booking_date,start_time,end_time) values (gen_random_uuid(),'x','registration',%L,%L,'09:00','10:00')$q$, plan, d)) like '42501%');
  perform t.rec('anon cannot call dashboard_stats', t.try('anon', null, 'select public.dashboard_stats()') like '42501%');
  perform t.rec('anon cannot call slot_status directly', t.try('anon', null, $q$select public.slot_status(current_date,'09:00')$q$) like '42501%');
  perform t.rec('anon cannot call staff_create_booking', t.try('anon', null, format($q$select public.staff_create_booking('Test User','0542425669','registration',%L,null,%L,'09:00')$q$, plan, d)) like '42501%');
  perform t.rec('anon cannot call add_staff', t.try('anon', null, $q$select public.add_staff('emp2@test.dz','X')$q$) like '42501%');

  -- prices hidden until confirmed
  perform t.rec('public plans hide price before confirmation',
    (select count(*) from public.get_public_plans() where price_da is not null) = 0);
  -- non-staff authenticated user
  perform t.rec('non-staff cannot update plans (no rows)', t.q('authenticated', stranger, $q$with u as (update public.membership_plans set price_da = 1 returning 1) select count(*)::text from u$q$) = '0');
  perform t.rec('non-staff sees no bookings/customers', t.q('authenticated', stranger, $q$select (select count(*) from public.bookings)+(select count(*) from public.customers)$q$) = '0');
  perform t.rec('non-staff cannot read staff table', t.q('authenticated', stranger, $q$select count(*) from public.staff$q$) = '0');
  perform t.rec('non-staff cannot call dashboard_stats', t.try('authenticated', stranger, 'select public.dashboard_stats()') like '%forbidden%');
  -- employee edits price; only owner publishes
  r := t.try('authenticated', emp, format($q$update public.membership_plans set price_da = 2700 where id=%L$q$, plan));
  perform t.rec('employee can edit a price', r = 'OK' and (select price_da from public.membership_plans where id=plan)=2700, r);
  update public.membership_plans set price_da = 2600 where id = plan;
  r := t.try('authenticated', emp, $q$update public.gym_settings set prices_confirmed = true$q$);
  perform t.rec('employee cannot publish prices', r like '%owner_only%', r);
  r := t.try('authenticated', owner_, $q$update public.gym_settings set prices_confirmed = true$q$);
  perform t.rec('owner can publish prices', r = 'OK' and (select prices_confirmed from public.gym_settings));
  perform t.rec('public plans show price after confirmation', (select price_da from public.get_public_plans() where id = plan) = 2600);
  perform t.rec('unset cardio price stays NULL (not invented)', (select price_da from public.get_public_plans() where id = plan_cardio) is null);
  update public.gym_settings set prices_confirmed = false;

  -- slots listing
  select count(*) into cnt from public.get_available_slots(d);
  perform t.rec('slot list = 3 morning + 4 women-only slots', cnt = 7, cnt::text);
  perform t.rec('women-only slots are labelled', (select count(*) from public.get_available_slots(d) where audience='women') = 4);
  delete from public.opening_hours where weekday = extract(isodow from d + 7)::int;
  perform t.rec('closed weekday returns no slots', (select count(*) from public.get_available_slots(d + 7)) = 0);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'09:00')$q$, plan, d + 7));
  perform t.rec('booking on a closed weekday rejected', r like '%outside_hours%', r);
  insert into public.opening_hours (weekday, opens_at, closes_at, audience) values (extract(isodow from d + 7)::int,'09:00','12:00','all'),(extract(isodow from d + 7)::int,'14:00','18:00','women');

  -- booking: validation
  r := t.try('anon', null, format($q$select public.create_booking('A','0542425669','registration',%L,null,%L,'09:00')$q$, plan, d));
  perform t.rec('invalid name rejected', r like '%invalid_name%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','12345','registration',%L,null,%L,'09:00')$q$, plan, d));
  perform t.rec('invalid phone rejected', r like '%invalid_phone%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',null,null,%L,'09:00')$q$, d));
  perform t.rec('registration without plan rejected', r like '%invalid_plan%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','session',null,null,%L,'09:00')$q$, d));
  perform t.rec('session without service rejected', r like '%invalid_service%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'13:00')$q$, plan, d));
  perform t.rec('booking outside opening hours rejected (13:00)', r like '%outside_hours%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'09:30')$q$, plan, d));
  perform t.rec('booking on a non-slot boundary rejected (09:30)', r like '%outside_hours%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'11:00')$q$, plan, current_date - 1));
  perform t.rec('booking in the past rejected', r like '%too_soon%', r);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'09:00')$q$, plan, public.local_now()::date + 40));
  perform t.rec('booking beyond max advance rejected', r like '%too_far%', r);

  -- booking: success + idempotency
  r := t.q('anon', null, format($q$select public.create_booking('Amine Test','+213 542 42 56 69','registration',%L,null,%L,'09:00',' hello ','key-1')::text$q$, plan, d));
  perform t.rec('anon can create a booking (pending)', r like '%"status": "pending"%', r);
  r := t.q('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'09:00',null,'key-1')::text$q$, plan, d));
  perform t.rec('same idempotency key returns same booking, no duplicate row', r like '%"duplicate": true%' and (select count(*) from public.bookings)=1, r);
  perform t.rec('phone normalised and customer stored once', (select phone from public.customers) = '0542425669' and (select count(*) from public.customers)=1);
  r := t.try('anon', null, format($q$select public.create_booking('Amine Test','0542425669','registration',%L,null,%L,'09:00',null,'key-2')::text$q$, plan, d));
  perform t.rec('same customer double-booking same slot rejected', r like '%duplicate%', r);

  -- capacity
  r := t.try('anon', null, format($q$select public.create_booking('Second Person','0661000002','session',null,%L,%L,'09:00')$q$, svc, d));
  perform t.rec('2nd customer fits capacity 2', r = 'OK', r);
  r := t.try('anon', null, format($q$select public.create_booking('Third Person','0770000003','session',null,%L,%L,'09:00')$q$, svc, d));
  perform t.rec('3rd customer rejected: slot full', r like '%full%', r);
  perform t.rec('remaining places reported as 0', (select remaining from public.get_available_slots(d) where slot_start='09:00') = 0);
  perform t.rec('other slot still free', (select status from public.get_available_slots(d) where slot_start='10:00') = 'ok');

  -- blocked slots
  insert into public.blocked_slots (block_date, start_time, end_time, reason) values (d, '10:00','11:00','maintenance');
  r := t.try('anon', null, format($q$select public.create_booking('Fourth Person','0550000004','session',null,%L,%L,'10:00')$q$, svc, d));
  perform t.rec('blocked slot cannot be booked', r like '%blocked%', r);
  perform t.rec('blocked slot reported blocked', (select status from public.get_available_slots(d) where slot_start='10:00') = 'blocked');
  insert into public.blocked_slots (block_date, reason) values (d + 1, 'holiday');
  r := t.try('anon', null, format($q$select public.create_booking('Fourth Person','0550000004','session',null,%L,%L,'09:00')$q$, svc, d + 1));
  perform t.rec('whole-day block prevents booking', r like '%blocked%', r);

  -- pending cap per customer
  perform public.create_booking('Cap Person','0555000111','session',null,svc,d+2,'09:00');
  perform public.create_booking('Cap Person','0555000111','session',null,svc,d+3,'09:00');
  perform public.create_booking('Cap Person','0555000111','session',null,svc,d+4,'09:00');
  r := t.try('anon', null, format($q$select public.create_booking('Cap Person','0555000111','session',null,%L,%L,'09:00')$q$, svc, d+5));
  perform t.rec('max 3 pending requests per phone', r like '%too_many_pending%', r);

  -- staff visibility
  perform t.rec('employee sees customer names+phones', t.q('authenticated', emp, $q$select count(*)::text from public.bookings b join public.customers c on c.id=b.customer_id where c.phone is not null$q$)::int >= 4);
  select id into bid from public.bookings where full_name='Amine Test';

  -- status workflow
  r := t.try('authenticated', emp, format($q$update public.bookings set status='completed' where id=%L$q$, bid));
  perform t.rec('pending -> completed is invalid', r like '%invalid_transition%', r);
  r := t.try('authenticated', emp, format($q$update public.bookings set status='confirmed' where id=%L$q$, bid));
  perform t.rec('employee can confirm', r='OK' and (select status from public.bookings where id=bid)='confirmed', r);
  perform t.rec('handled_by recorded', (select handled_by from public.bookings where id=bid) = emp);
  r := t.try('authenticated', emp, format($q$update public.bookings set status='cancelled' where id=%L$q$, bid));
  perform t.rec('employee can cancel', r='OK', r);
  -- slot is now free: another customer can take it; re-opening the cancelled one must then fail (full)
  perform public.create_booking('Replacement','0770000009','session',null,svc,d,'09:00');
  r := t.try('authenticated', emp, format($q$update public.bookings set status='pending' where id=%L$q$, bid));
  perform t.rec('re-opening a cancelled booking into a full slot is rejected', r like '%full%', r);
  select id into bid from public.bookings where full_name='Second Person';
  perform t.try('authenticated', emp, format($q$update public.bookings set status='rejected' where id=%L$q$, bid));
  perform t.rec('employee can reject', (select status from public.bookings where id=bid)='rejected');
  select id into bid from public.bookings where full_name='Replacement';
  perform t.try('authenticated', emp, format($q$update public.bookings set status='confirmed' where id=%L$q$, bid));
  r := t.try('authenticated', emp, format($q$update public.bookings set status='completed' where id=%L$q$, bid));
  perform t.rec('employee can mark completed', r='OK' and (select status from public.bookings where id=bid)='completed', r);
  r := t.try('authenticated', emp, format($q$update public.bookings set status='pending' where id=%L$q$, bid));
  perform t.rec('completed is final', r like '%invalid_transition%', r);
  -- rescheduling into closed time rejected
  select id into bid from public.bookings where full_name='Cap Person' and booking_date = d+2;
  r := t.try('authenticated', emp, format($q$update public.bookings set start_time='13:00' where id=%L$q$, bid));
  perform t.rec('staff cannot reschedule outside opening hours', r like '%outside_hours%', r);
  r := t.try('authenticated', emp, format($q$update public.bookings set start_time='11:00' where id=%L$q$, bid));
  perform t.rec('staff can reschedule inside opening hours (end_time recomputed)', r='OK' and (select end_time from public.bookings where id=bid)='12:00', r);

  -- staff-created booking
  r := t.q('authenticated', emp, format($q$select public.staff_create_booking('Walk In','0699111222','session',null,%L,%L,'11:00')::text$q$, svc, d+6));
  perform t.rec('staff_create_booking creates confirmed booking', r like '%"status": "confirmed"%', r);
  perform t.rec('non-staff cannot staff_create_booking', t.try('authenticated', stranger, format($q$select public.staff_create_booking('Walk In','0699111222','session',null,%L,%L,'11:00')$q$, svc, d+6)) like '%forbidden%');

  -- stats
  j := t.q('authenticated', emp, 'select public.dashboard_stats()::text')::jsonb;
  perform t.rec('dashboard_stats returns counts', (j->>'total_customers')::int >= 4 and (j->>'pending')::int >= 1, j::text);

  -- staff admin
  perform t.rec('employee cannot add staff', t.try('authenticated', emp, $q$select public.add_staff('emp2@test.dz','Two')$q$) like '%owner_only%');
  r := t.try('authenticated', owner_, $q$select public.add_staff('emp2@test.dz','Two')$q$);
  perform t.rec('owner can add staff', r = 'OK' and exists(select 1 from public.staff where user_id=emp2), r);
  perform t.rec('add_staff unknown user rejected', t.try('authenticated', owner_, $q$select public.add_staff('nobody@test.dz','X')$q$) like '%user_not_found%');
  perform t.rec('owner cannot remove self', t.try('authenticated', owner_, format($q$select public.remove_staff(%L)$q$, owner_)) like '%cannot_remove_self%');
  perform t.rec('employee cannot remove staff', t.try('authenticated', emp, format($q$select public.remove_staff(%L)$q$, emp2)) like '%owner_only%');
  perform t.rec('staff cannot insert into staff table directly', t.try('authenticated', emp, format($q$insert into public.staff values (%L,'x','owner')$q$, stranger)) like '42501%');
  perform t.rec('employee cannot delete bookings (owner only)', t.q('authenticated', emp, $q$with d as (delete from public.bookings returning 1) select count(*)::text from d$q$) = '0');
  perform t.rec('list_staff works for staff, hidden from stranger', t.try('authenticated', emp, 'select * from public.list_staff()') = 'OK' and t.try('authenticated', stranger, 'select * from public.list_staff()') like '%forbidden%');
end $$;

select case when ok then 'PASS' else 'FAIL' end as res, name, case when ok then '' else detail end as detail from t.results order by ok, name;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from t.results;
