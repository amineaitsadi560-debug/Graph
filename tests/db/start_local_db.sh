#!/usr/bin/env bash
# Starts a throw-away local Postgres with a Supabase-like setup and applies the migrations.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN=/usr/lib/postgresql/16/bin
DATA=${PGDATA_DIR:-/tmp/milinium-pg}
PORT=${PGPORT_LOCAL:-54329}
id -u pgtest >/dev/null 2>&1 || useradd -m pgtest
if [ ! -d "$DATA" ]; then
  mkdir -p "$DATA"; chown pgtest "$DATA"
  su pgtest -c "$PGBIN/initdb -D $DATA -A trust >/dev/null"
fi
su pgtest -c "$PGBIN/pg_ctl -D $DATA status" >/dev/null 2>&1 || su pgtest -c "$PGBIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp' -l $DATA/log -w start" >/dev/null
export PGHOST=/tmp PGPORT=$PORT PGUSER=pgtest
psql -d postgres -qc "drop database if exists milinium" -c "create database milinium" \
  -c "do \$\$ begin if exists (select 1 from pg_roles where rolname='authenticator') then drop role authenticator; end if; end \$\$" \
  -c "do \$\$ begin if exists (select 1 from pg_roles where rolname='anon') then drop role anon; end if; end \$\$" \
  -c "do \$\$ begin if exists (select 1 from pg_roles where rolname='authenticated') then drop role authenticated; end if; end \$\$"
psql -d milinium -q -v ON_ERROR_STOP=1 -f "$ROOT/tests/db/mock_supabase.sql"
psql -d milinium -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/migrations/0001_schema.sql"
psql -d milinium -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/migrations/0002_seed.sql"
echo "local db ready on port $PORT"
