# ADR-001: Supabase as Backend-as-a-Service

**Status:** Accepted
**Date:** January 2025

## Context

PathMate needs a backend providing authentication, a relational database with geospatial capabilities, real-time communication, and file storage. The team is small and needs to ship quickly without managing infrastructure.

Options considered:
1. **Custom backend** (Node.js + Express + PostgreSQL) — Full control but high maintenance
2. **Firebase** — Fast to start but NoSQL (poor for relational rideshare data), no geospatial
3. **Supabase** — PostgreSQL with PostGIS, built-in auth, realtime, and REST/GraphQL APIs
4. **AWS Amplify** — Feature-rich but vendor lock-in and complex pricing

## Decision

Use **Supabase** as the primary backend-as-a-service platform.

## Consequences

**Positive:**
- PostgreSQL provides relational data modeling ideal for users→rides→bookings→ratings relationships
- PostGIS extension enables server-side geospatial queries (see ADR-002)
- Built-in auth handles email/password, OAuth, and JWT session management
- Realtime subscriptions (postgres_changes + broadcast) power live tracking and chat
- Row Level Security (RLS) provides fine-grained data access control at the database level
- Open-source — no vendor lock-in, can self-host if needed
- Generous free tier suitable for MVP

**Negative:**
- Client-side SDK exposes anon key (acceptable — RLS protects data)
- Limited server-side logic without Edge Functions (currently all logic is client-side)
- Realtime has connection limits on free tier
- Schema managed via SQL file, not migration framework (no rollback support)

**Risks:**
- If Supabase service degrades, entire app is affected (auth, data, realtime)
- No offline support — app requires active connection
