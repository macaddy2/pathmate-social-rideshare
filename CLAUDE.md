# PathMate — Claude Development Guide

> This file is the primary reference for AI-assisted development on PathMate.
> **Always read [`docs/prd.md`](docs/prd.md) and [`docs/spec.md`](docs/spec.md) before making any architectural or product decisions.**

---

## Project Overview

PathMate is a peer-to-peer carpooling platform that matches riders with drivers *already heading in the same direction*. Unlike ride-hailing (Uber/Bolt), drivers aren't dispatched — they share an existing journey.

**Key differentiator:** Direction-aware matching algorithm + Africa-first payments (Paystack for NGN/GHS/KES/ZAR).

---

## Canonical Documents

| Document | Purpose | Path |
|----------|---------|------|
| **PRD** | Product vision, user stories, priorities (P0→P3), success metrics | [`docs/prd.md`](docs/prd.md) |
| **Technical Spec** | Architecture, component hierarchy, services, DB schema, auth flow, real-time | [`docs/spec.md`](docs/spec.md) |
| **Design System** | Tokens, Shadcn/ui usage, Figma workflow | [`docs/design-system.md`](docs/design-system.md) |
| **Contributing** | Git conventions, PR process, coding standards | [`docs/contributing.md`](docs/contributing.md) |
| **ADRs** | Architecture Decision Records | [`docs/adr/`](docs/adr/) |
| **Schema** | PostgreSQL schema with PostGIS, RLS, triggers | [`supabase/schema.sql`](supabase/schema.sql) |

> **Before implementing any feature:** check the PRD for priority level (P0/P1/P2/P3) and the spec for the technical pattern.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript | 19.x / 5.8 |
| Build | Vite | 6.x |
| Styling | Tailwind CSS v4 + Shadcn/ui | 4.x |
| Routing | React Router | 7.x |
| State | Zustand | 5.x |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime) | latest |
| Maps | Google Maps API + Places + Directions | — |
| Payments | Paystack (Africa) + Stripe (International) | — |
| AI | Google Gemini (3 Pro, 3 Flash, 2.5 Flash) | — |
| Testing | Vitest + jsdom | — |

---

## Directory Structure

```
pathmate-social-rideshare/
├── App.tsx               # Root component, tab routing, auth gate
├── index.tsx             # React entry, BrowserRouter wrapper
├── index.html            # HTML shell
├── index.css             # Global styles + Tailwind
├── vite.config.ts        # Vite config (loadEnv uses __dirname)
│
├── components/           # UI components (16 total)
│   ├── ui/               # Shadcn/ui primitives
│   ├── AuthScreen.tsx    # Login/signup + Google OAuth
│   ├── Home.tsx          # Role-based dashboard
│   ├── SearchRide.tsx    # Ride search, matching results, booking
│   ├── PostRide.tsx      # Multi-step ride posting
│   ├── AIPlanner.tsx     # Gemini AI chat interface
│   ├── LiveTracker.tsx   # Real-time map + driver location
│   ├── ChatWindow.tsx    # Supabase Realtime messaging
│   ├── WalletScreen.tsx  # Payments + transaction history
│   ├── NotificationCenter.tsx
│   ├── RouteMap.tsx      # Google Maps + polylines
│   ├── PlacesAutocomplete.tsx
│   ├── RatingModal.tsx
│   ├── RideHistory.tsx
│   ├── RecurringRides.tsx
│   ├── ProfileSettings.tsx
│   └── Layout.tsx        # App shell (header, bottom nav)
│
├── services/             # Business logic (no UI)
│   ├── dataService.ts    # Centralized Supabase access + mock fallback
│   ├── matchingService.ts # 6-stage ride matching algorithm
│   ├── geoService.ts     # Haversine, polyline decode, detour calc
│   ├── paymentService.ts # Paystack + Stripe dual provider
│   ├── notificationService.ts
│   └── geminiService.ts  # Multi-model Gemini integration
│
├── stores/               # Zustand global state
│   ├── useRideStore.ts
│   ├── useBookingStore.ts
│   ├── useNotificationStore.ts
│   ├── useWalletStore.ts
│   └── useLocationStore.ts
│
├── contexts/
│   └── AuthContext.tsx   # Auth state, signIn/signUp/signOut, profile
│
├── hooks/                # Custom React hooks
│   └── useRealtimeBooking.ts
│
├── lib/
│   └── supabase.ts       # Supabase client + TypeScript types
│
├── supabase/
│   └── schema.sql        # Full DB schema (run in Supabase SQL Editor)
│
├── docs/                 # Product + technical documentation
│   ├── prd.md            # ← PRIMARY PRODUCT REFERENCE
│   ├── spec.md           # ← PRIMARY TECHNICAL REFERENCE
│   ├── design-system.md
│   ├── contributing.md
│   └── adr/
│
└── tests/                # Vitest unit tests
```

---

## Key Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Testing
npm test             # Run all tests (Vitest)
npm run test:watch   # Watch mode
npm run test:coverage

# Build
npm run build        # Production build (Vite)
npm run preview      # Preview production build locally
```

---

## Environment Variables

Create `.env.local` in the project root (never commit this file):

```env
# Required — Supabase
VITE_SUPABASE_URL=https://phqcltllpmoflhqdqzef.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Required for Maps features
VITE_GOOGLE_MAPS_API_KEY=<your-key>

# Required for payments
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Required for AI Planner
GEMINI_API_KEY=<your-key>
```

> **Note:** All env vars prefixed with `VITE_` are exposed to the client bundle. Never put secret keys in VITE_ vars.
> `vite.config.ts` uses `loadEnv(mode, __dirname, '')` — `.env.local` must be in the **project root**, not a parent directory.

---

## Architecture Patterns

### 1. Data Access — `dataService.ts`

All Supabase queries go through `dataService.ts`. It implements a **`withFallback()` pattern** — if Supabase isn't configured or a query fails, it returns mock data so the app runs in demo mode.

```typescript
// ✅ Correct — use dataService
const rides = await dataService.getRides();

// ❌ Wrong — don't query Supabase directly in components
const { data } = await supabase.from('rides').select('*');
```

### 2. Auth — `AuthContext`

Auth state flows via React context. All components use `useAuth()`:

```typescript
const { user, profile, loading, signIn, signOut } = useAuth();
```

### 3. Real-Time — Supabase Channels

Two channel patterns (see spec.md §6):
- `postgres_changes` for booking status updates
- `broadcast` for driver location streaming

Channels are managed in `useRealtimeBooking.ts`.

### 4. State — Zustand Stores

Global state lives in `stores/`. Auth state stays in Context. Use stores for:
- Ride data (`useRideStore`)
- Booking state (`useBookingStore`)
- Notifications (`useNotificationStore`)
- Wallet (`useWalletStore`)
- Location (`useLocationStore`)

### 5. Routing — React Router v7

URL-based routing. Tabs use `<NavLink>` + `navigate()`. Protected routes via `<ProtectedRoute>`.

| Path | Component |
|------|-----------|
| `/` | Home |
| `/search` | SearchRide |
| `/post` | PostRide |
| `/planner` | AIPlanner |
| `/history` | RideHistory |
| `/profile` | ProfileSettings |
| `/recurring` | RecurringRides |
| `/wallet` | WalletScreen |

---

## Feature Priority Guide

Per [`docs/prd.md`](docs/prd.md) §5:

| Priority | Meaning | Focus |
|----------|---------|-------|
| **P0** | Must ship — core product | Auth, ride post/search/book, payments, wallet |
| **P1** | Ship soon after | Live tracking, chat, notifications, ratings, profile |
| **P2** | Next iteration | AI planner, recurring rides, escrow, Shadcn/ui, React Router v7, Zustand |
| **P3** | Roadmap | Social features, carbon tracking, native mobile, multi-language |

**Always implement P0 → P1 → P2 in order. Do not start P2 features before P0/P1 are solid.**

---

## Database Schema (Summary)

11 tables. See [`supabase/schema.sql`](supabase/schema.sql) for full SQL.

| Table | Purpose |
|-------|---------|
| `users` | Extended profile (extends `auth.users`) |
| `rides` | Driver-posted rides with PostGIS geometry |
| `ride_requests` | Rider search requests |
| `bookings` | Confirmed matches between rider + driver |
| `messages` | In-ride chat (Realtime enabled) |
| `ratings` | Post-ride ratings with sub-criteria |
| `payments` | Transaction records (Paystack/Stripe) |
| `wallets` | Driver earnings balance |
| `notifications` | In-app notifications (Realtime enabled) |
| `emergency_contacts` | Safety contacts |
| `recurring_rides` | Scheduled commute templates |

**All tables have Row Level Security (RLS) enabled.**

---

## Matching Algorithm (Summary)

6-stage pipeline in `matchingService.ts`:
1. **Time window** — departure within tolerance
2. **Seat availability** — at least 1 seat free
3. **Bounding box** — cheap pre-filter
4. **Point-to-route distance** — pickup/dropoff within detour radius
5. **Direction validation** — pickup comes before dropoff along driver's route
6. **Detour tolerance** — extra time/distance within driver's stated limit

**Score weights:** detour efficiency (30%) + time alignment (25%) + route overlap (20%) + driver rating (15%) + price (10%).

---

## Coding Conventions

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without comment
- **Component files** — PascalCase (e.g., `SearchRide.tsx`)
- **Service files** — camelCase (e.g., `matchingService.ts`)
- **No direct Supabase calls in components** — use `dataService.ts`
- **Error handling** — try/catch with meaningful error messages; use fallback data
- **Mobile-first** — design for 480px viewport first
- **Touch targets** — minimum 44×44px per prd.md §7
- **Imports** — use `@/` alias for project-root-relative imports

---

## Supabase Project

- **Project URL:** `https://phqcltllpmoflhqdqzef.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/phqcltllpmoflhqdqzef
- **Schema deployed:** Yes (via SQL Editor, March 2026)
- **Realtime enabled on:** `bookings`, `messages`, `notifications`
- **Auth providers:** Email/password + Google OAuth
