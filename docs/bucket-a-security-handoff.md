# Bucket A Security Hardening Handoff

## Status

Bucket A is complete for source control and staging. The reviewed security-hardening change is merged into `main`; it has **not** been rolled out to production.

Production rollout is deliberately deferred. It needs its own read-only preflight and action-time approval before any production deployment, migration, secret configuration, or test-user creation.

## Completed and verified in staging

- Removed browser-side Gemini credential use. The frontend calls the backend `POST /api/gemini` route instead.
- Kept the Gemini credential server-side only; it is not part of Vite configuration or the browser bundle.
- Applied the ordered baseline and Bucket A hardening migrations to the separate Ireland staging project.
- Verified migration history, RLS policies, client privileges, hardened function grants/search paths, and profile isolation.
- Proved a generated test account can read only its own profile and cannot read another account's profile or notifications; all disposable test users and generated profiles were removed afterwards.
- Ran the staging database advisor scan.
- Confirmed the Railway staging application loads and the secure Gemini route returns a non-empty result for one harmless synthetic match-explanation request.
- Merged and published the reviewed change to `main`.

## Deferred production rollout

The initial migration is a full baseline schema. Do not run a blanket migration push in production until the preflight proves whether production is fresh or already records the baseline migration.

### Required read-only preflight

1. Confirm the intended Frankfurt production Supabase project, Railway service, frontend origin, and merged release revision.
2. Check production migration history and the presence of required public tables.
3. Compare production RLS policies, grants, function signatures/search paths, and triggers with the ordered migration sources.
4. Confirm a current restorable database backup and name the rollback owner.
5. Confirm every live booking, payment, wallet, and notification workflow has a trusted server-side write path before client write restrictions are introduced.
6. Confirm the production backend has its server-side Gemini credential and a precise frontend-origin allowlist. Never place a Gemini credential in browser build configuration.

### Production action order after separate approval

1. Deploy the merged application revision.
2. Verify the health endpoint.
3. Apply only migrations proven pending by the preflight.
4. Recheck migration history.
5. Run the post-rollout checks below.
6. Run the database advisor scan again, read-only.

Stop and investigate rather than applying manual SQL if migration history differs from preflight, an authorised workflow loses its server write path, a security check exposes cross-user data, or the Gemini path fails.

## Post-rollout acceptance checks

- Both ordered migrations are recorded once and in order.
- RLS is enabled and owner/participant policies are present on the protected application tables.
- Anonymous and authenticated roles cannot create server-owned profiles, notifications, payments, or wallet records, and cannot update or delete payments, wallets, ratings, or bookings outside their intended paths.
- Hardened helper functions are not broadly executable; matching-rides remains callable only by authenticated users with a safe search path.
- Two synthetic disposable accounts demonstrate own-profile access and deny cross-profile, cross-notification, and server-owned write attempts. Remove all test data immediately after verification.
- A harmless synthetic request from the deployed frontend origin receives a non-empty response from `POST /api/gemini`. Record only status and result presence, never a credential.

## Database advisor follow-up (separate work)

None of the staging advisor findings were caused by Bucket A. Keep this work in a separate, single-purpose remediation stream.

| Priority | Finding | Next safe step |
| --- | --- | --- |
| P1 | `rls_auto_enable()` is a publicly executable security-definer function attached to an event trigger. It is not defined in these repository migrations. | Capture its definition, owner, grants, search path, and trigger dependency in staging. Change it only in a reviewed migration that proves the trigger still works. |
| P1 assessment | PostGIS coordinate-reference metadata lacks RLS. | Confirm effective API-role access first. Restrict direct access only if unnecessary and regression-test geospatial queries. |
| P2 | PostGIS objects and a helper function have broad public-schema grants. | Inventory exact overloads, owners, and effective grants; restrict only objects that client geospatial features do not need. |
| P3 | Five foreign-key index suggestions. | Evaluate using representative workload and query plans; put approved indexes in a separate performance migration. |
| P3 | Twelve unused-index notices in empty staging. | Reassess after representative traffic; do not drop indexes based on staging alone. |

## Documentation maintenance

The migration README's statement that the migrations have not been applied is stale for staging. Update that wording in a later documentation-only change; it is not evidence of production state.

## Approval boundary

Moving on to Bucket B is safe. Before describing Bucket A as production-live, obtain specific approval for the production preflight and then for the exact deployment, migration, runtime-configuration, and verification actions that remain.
