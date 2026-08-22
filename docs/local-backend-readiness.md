# Local backend and payment readiness

This is a local development and code-review guide. It authorises no deployment,
database change, secret creation, provider setup, or external configuration.

## Non-negotiable secret policy

- Never put provider secret keys, webhook secrets, database service keys, or
  Gemini keys in browser code, Vite variables, committed files, test fixtures,
  logs, issues, or chat.
- Browser code may use only deliberately public configuration. A server runtime
  receives private values through its host's secret manager at deployment time.
- Do not request or paste a secret into this repository. Use descriptive
  variable names in documentation and deployment checklists only.

## Server-function boundary

Server functions own all trusted writes and provider calls: booking transitions,
payment creation and verification, refunds, payouts, disputes, wallet/ledger
updates, and notification fan-out. Browser code should submit an authenticated
request and render the resulting server-authoritative status; it must not mark a
payment paid, credit a wallet, release funds, or invoke a provider directly.

| Record or field | Write authority |
| --- | --- |
| Booking status and payment status | Authenticated server function |
| Payment, wallet, and ledger records | Server function or verified webhook |
| Notifications caused by trusted events | Server function |

Each boundary must derive the caller, participants, amount, and currency on the
server; accept an idempotency key; and use a least-privilege database role.

Before implementing or deploying a server function, document its caller,
authentication rule, input validation, idempotency key, database transaction
boundary, audit event, expected error response, and tests. Privileged database
functions must be narrowly callable and explicitly granted; do not rely on
default public execution.

## Payment readiness checklist

Before a real provider is enabled, approve the product policy for platform fee,
escrow release, refunds, cancellations, disputes, payout timing, limits, and
support ownership. Then implement the provider integration as a server-owned
flow with signed webhook verification, replay protection, amount/currency
checks, immutable provider references, an append-only ledger, and alerting for
failed or mismatched webhooks.

Local work can use fakes that fail clearly outside development. It must never
pretend that money moved or a provider verification succeeded.

## Verification before release

Use staging to test duplicate requests, invalid caller/booking combinations,
amount or currency mismatches, webhook replay, failed verification, refund and
dispute paths, and RLS denial of direct client writes. A production change needs
a separate read-only preflight, approved rollback plan, and action-time approval.

## Database source of truth

Use timestamped files in `supabase/migrations/` for all schema changes. The
legacy `supabase/schema.sql` is retained only for historical reference and must
not be applied or edited as a second schema definition.
