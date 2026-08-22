# PathMate staging migrations

The repository’s historical `supabase/schema.sql` is a manual baseline, not an
ordered migration set. It declares some policies before the later
`notifications`, `payments`, `recurring_rides`, and `wallets` tables, so it must
be reordered or replaced with a reviewed baseline migration before a fresh
staging project can apply the Bucket A patch.

`20260822120000_initial_schema.sql` is the ordered baseline derived from the
repository schema. `20260822130000_bucket_a_security_hardening.sql` is the local equivalent of the
referenced `security-patch-v1` through `v1.4` series. It is intentionally
fail-closed: it stops if the baseline tables are missing. It has not been
applied to Supabase.

Safe staging order:

1. Review and apply `20260822120000_initial_schema.sql` to `pathmate-staging` only.
2. Apply `20260822130000_bucket_a_security_hardening.sql`.
3. Run RLS/policy regression tests and confirm the app’s required server paths.
4. Configure the backend secret and allowed frontend origin only after the code
   is deployed and the staging URL is confirmed.
