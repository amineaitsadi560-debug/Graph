-- Run ONCE in Supabase → SQL Editor, AFTER creating the owner in Authentication → Users → Add user
-- (tick "Auto Confirm User"). Replace the e-mail and name. Fails safely if an owner already exists.
select public.bootstrap_owner('owner@example.com', 'Nom du propriétaire');
