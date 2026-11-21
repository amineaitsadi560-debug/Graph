#!/usr/bin/env bash
# Runs the SQL test-suite plus a concurrency test against the local mock stack.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export PGHOST=/tmp PGPORT=${PGPORT_LOCAL:-54329} PGUSER=pgtest
"$ROOT/tests/db/start_local_db.sh" >/dev/null 2>&1
OUT=$(psql -d milinium -v ON_ERROR_STOP=1 -f "$ROOT/tests/db/tests.sql" 2>&1); echo "$OUT" | grep -E "PASS|FAIL|passed|ERROR" 

# --- concurrency: 8 simultaneous requests for the LAST place of a slot (capacity 1) ---
psql -d milinium -q -c "update public.gym_settings set slot_capacity=1" \
  -c "delete from public.bookings where booking_date = current_date + 20" >/dev/null
PLAN=$(psql -d milinium -Atc "select id from public.membership_plans where name_en='Unlimited'")
for i in 1 2 3 4 5 6 7 8; do
  psql -d milinium -Atc "set role anon; select public.create_booking('Racer $i','066100000$i','registration','$PLAN',null,current_date+20,'09:00')" >/tmp/race_$i.out 2>&1 &
done; wait
OK=$(grep -l '"status"' /tmp/race_*.out | wc -l); FULL=$(grep -l 'full' /tmp/race_*.out | wc -l)
ROWS=$(psql -d milinium -Atc "select count(*) from public.bookings where booking_date=current_date+20 and start_time='09:00'")
if [ "$OK" = 1 ] && [ "$ROWS" = 1 ] && [ "$FULL" = 7 ]; then echo "PASS  concurrent booking race: 1 winner, 7 rejected (full), 1 row"; else echo "FAIL  concurrent race ok=$OK full=$FULL rows=$ROWS"; fi
rm -f /tmp/race_*.out
