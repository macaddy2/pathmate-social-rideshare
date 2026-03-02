# ADR-003: Paystack + Stripe Dual Payment Strategy

**Status:** Accepted
**Date:** February 2025

## Context

PathMate targets users in Africa (primarily Nigeria) and internationally. Payment infrastructure in Africa differs significantly from Western markets:
- Nigerian users expect NGN payments via bank transfer, USSD, and local card networks
- International users expect USD/EUR/GBP via credit card
- No single payment provider covers both markets well

## Decision

Use a **dual payment provider strategy** with automatic routing based on currency:

| Currency | Provider | Region |
|----------|----------|--------|
| NGN (Naira) | Paystack | Nigeria |
| GHS (Cedi) | Paystack | Ghana |
| KES (Shilling) | Paystack | Kenya |
| ZAR (Rand) | Paystack | South Africa |
| USD, EUR, GBP, others | Stripe | International |

Selection is automatic via `getProviderForCurrency()` — the user never chooses a provider.

## Consequences

**Positive:**
- Best-in-class payment experience for both African and international users
- Paystack supports local payment methods (bank transfer, USSD, mobile money)
- Stripe provides mature international card processing
- Currency-based routing is transparent to the user
- Both providers offer client-side SDKs (no server needed for basic payments)

**Negative:**
- Two SDKs to maintain, two dashboards to monitor, two sets of webhook handlers
- Escrow implementation must work across both providers
- Exchange rate handling for cross-currency rides is not yet implemented
- Client-side integration relies on `window.PaystackPop` / `window.Stripe` being loaded
- Currently using fallback simulation when SDKs aren't loaded (demo mode)

**Future considerations:**
- Add Flutterwave as a third provider for broader African coverage
- Implement server-side payment verification (currently mock)
- Build proper escrow with Paystack Managed Accounts / Stripe Connect
