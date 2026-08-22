# PathMate database migrations

`supabase/migrations/` is the single canonical source for database state. Apply
these files only in timestamp order. The historical `supabase/schema.sql` is a
deprecated reference, never an apply target.

`20260822120000_initial_schema.sql` is the ordered baseline derived from the
repository schema. `20260822130000_bucket_a_security_hardening.sql` is the
local equivalent of the referenced `security-patch-v1` through `v1.4` series.
It is intentionally fail-closed: it stops if the baseline tables are missing.

Safe staging order:

1. Review the pending set with the Supabase CLI against the explicitly linked
   target project.
2. Apply only reviewed migrations, in filename order, to the intended
   environment.
3. Run RLS/policy regression checks and confirm the app’s required server paths.
4. Follow `docs/local-backend-readiness.md` before any payment or server-function
   deployment. That document deliberately contains no secret values.
