# PathMate — Social Rideshare

A decentralized peer-to-peer carpooling platform that matches riders with drivers already heading in their direction. Unlike ride-hailing apps that summon drivers, PathMate connects people traveling the same way.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.3 |
| Language | TypeScript | 5.8.2 |
| Build | Vite | 6.2.0 |
| Styling | Tailwind CSS v4 + Shadcn/ui | 4.x |
| Routing | React Router | 7.x |
| State | Zustand | 5.x |
| Icons | lucide-react | Latest |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime) | 2.90.1 |
| Maps | Google Maps API (`@react-google-maps/api`) | 2.20.8 |
| AI | Google Gemini (3 Pro, 3 Flash, 2.5 Flash) | 1.37.0 |
| Payments | Paystack (Africa) + Stripe (International) | Client-side SDK |
| Testing | Vitest + jsdom | — |

## Directory Structure

```
pathmate-social-rideshare/
├── App.tsx                    # Root component — React Router routes + Zustand stores
├── index.tsx                  # React DOM entry point (BrowserRouter wrapper)
├── index.html                 # HTML shell (minimal — Vite handles all bundling)
├── index.css                  # Tailwind v4 entry + custom animations + Shadcn/ui CSS vars
├── types.ts                   # All TypeScript interfaces and enums (~459 lines)
├── components/                # UI components (16 files)
│   ├── AIPlanner.tsx           # Gemini-powered trip planning assistant
│   ├── AuthScreen.tsx          # Login/signup with email + Google OAuth
│   ├── ChatWindow.tsx          # Real-time messaging between riders/drivers
│   ├── Home.tsx                # Dashboard with role-based quick actions
│   ├── Layout.tsx              # App shell: header + bottom nav + notifications
│   ├── LiveTracker.tsx         # Real-time map with driver location tracking
│   ├── NotificationCenter.tsx  # Notification drawer with type-based icons
│   ├── PlacesAutocomplete.tsx  # Google Places autocomplete input
│   ├── PostRide.tsx            # Multi-step ride posting form (driver flow)
│   ├── ProfileSettings.tsx     # User profile, vehicle info, verification
│   ├── RatingModal.tsx         # Multi-criteria rating submission
│   ├── RecurringRides.tsx      # Scheduled recurring ride management
│   ├── RideHistory.tsx         # Past rides with stats and CO2 savings
│   ├── RouteMap.tsx            # Google Maps route visualization
│   ├── SearchRide.tsx          # Ride search with matching algorithm results
│   └── WalletScreen.tsx        # Payment wallet, transactions, withdrawals
├── services/                  # Business logic layer (5 files)
│   ├── geoService.ts           # Haversine distance, polyline ops, bounding boxes, ETA
│   ├── matchingService.ts      # 6-stage ride matching algorithm with scoring
│   ├── paymentService.ts       # Paystack/Stripe provider, wallet, escrow
│   ├── notificationService.ts  # In-app + browser notifications, pub/sub
│   └── geminiService.ts        # Multi-model Gemini AI (Pro for analysis, Flash for speed)
├── contexts/                  # React Context providers
│   └── AuthContext.tsx         # Auth state, sign-in/up/out, profile CRUD, ProtectedRoute
├── hooks/                     # Custom React hooks
│   └── useRealTimeBooking.ts   # Supabase realtime: booking status + driver location
├── stores/                    # Zustand global state stores (8 stores)
│   ├── useActiveRidesStore.ts  # Driver's active posted rides + matched riders
│   ├── useChatStore.ts         # Active chat state (targetName, targetId)
│   ├── useLocationStore.ts     # Geolocation state + init action
│   ├── useNotificationStore.ts # Notification state wrapping notificationService
│   ├── useRecurringRidesStore.ts # Recurring ride schedules + toggle
│   ├── useRideStore.ts         # Role + ratings state (mock data)
│   ├── useSearchStore.ts       # Search form state (pickup/dropoff persistence)
│   └── useWalletStore.ts       # Wallet balance + transactions
├── lib/                       # Client libraries
│   ├── supabase.ts             # Supabase client config + Database type definitions
│   └── utils.ts                # Shadcn cn() utility (clsx + tailwind-merge)
├── components/ui/             # Shadcn/ui base components (10 components)
│   ├── avatar.tsx              # Avatar with image + fallback
│   ├── badge.tsx               # Badge with variants (default, success, warning, etc.)
│   ├── button.tsx              # Button with variants (default, outline, ghost, etc.)
│   ├── card.tsx                # Card, CardHeader, CardContent, CardFooter
│   ├── dialog.tsx              # Modal dialog (Radix Dialog)
│   ├── input.tsx               # Styled input with focus ring
│   ├── select.tsx              # Styled dropdown (Radix Select)
│   ├── separator.tsx           # Horizontal/vertical separator
│   ├── switch.tsx              # Toggle switch (Radix Switch)
│   └── textarea.tsx            # Multi-line text input
├── supabase/                  # Database
│   └── schema.sql              # Full PostgreSQL schema (7 tables, PostGIS, RLS)
├── tests/                     # Unit tests (Vitest) — 121 tests across 5 files
│   ├── setup.ts                # Test setup (@testing-library/jest-dom)
│   ├── geoService.test.ts      # 41 tests: distance, polyline, bbox, direction, ETA
│   ├── matchingService.test.ts # 21 tests: 6-stage pipeline, scoring, batch matching
│   ├── notificationService.test.ts # 11 tests: CRUD, subscribe, icons, colors
│   ├── paymentService.test.ts  # 20 tests: wallet, transactions, escrow, currency
│   └── stores.test.ts          # 28 tests: all 8 Zustand store actions
├── docs/                      # Project documentation
│   ├── prd.md                  # Product Requirements Document
│   ├── spec.md                 # Technical Specification
│   ├── design-system.md        # Design tokens, Shadcn/ui plan, Figma workflow
│   ├── contributing.md         # Contributing guide
│   └── adr/                    # Architecture Decision Records
└── pathmate---social-rideshare/ # Legacy duplicate (ignore)
```

## Key Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000, host 0.0.0.0)
npm run build        # Production build via Vite
npm run preview      # Preview production build
npm test             # Run tests (vitest run)
npm run test:watch   # Run tests in watch mode
npx vitest --coverage # Run tests with coverage
```

## Environment Variables

Create a `.env.local` file (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JavaScript API key |
| `VITE_PAYSTACK_PUBLIC_KEY` | For payments | Paystack public key (Africa) |
| `VITE_STRIPE_PUBLIC_KEY` | For payments | Stripe publishable key (International) |
| `GEMINI_API_KEY` | For AI | Google Gemini API key (exposed as `process.env.API_KEY` via Vite define) |

## Coding Conventions

- **Components**: Functional components with `React.FC<Props>`, one component per file
- **Services**: Class-based singletons (`paymentService`, `notificationService`) or pure function modules (`geoService`, `matchingService`)
- **State**: Zustand stores for global state, `useState`/`useEffect` for component-local state, `useContext` for auth, `useCallback`/`useRef` for performance
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **DB field mapping**: camelCase in TypeScript, snake_case in PostgreSQL (mapped in `AuthContext.tsx` and `useRealTimeBooking.ts`)
- **Section headers**: `// ============================================` blocks to separate logical sections
- **Imports**: Type-only imports use `import type { ... }`
- **Path aliases**: `@/*` maps to project root (configured in `tsconfig.json`)
- **Mobile-first**: All UI targets 480px max-width with `max-w-md mx-auto`

## Architecture Patterns

### Current
- **Routing**: React Router v7 — URL-based routes (`/`, `/search`, `/post`, `/planner`, `/history`, `/profile`, `/recurring`, `/wallet`), `NavLink` for bottom nav, `useNavigate` for programmatic navigation
- **Auth**: React Context (`AuthProvider` → `useAuth()`) wrapping the entire app
- **State**: Zustand stores for global state (8 stores: `useRideStore`, `useLocationStore`, `useChatStore`, `useNotificationStore`, `useSearchStore`, `useActiveRidesStore`, `useRecurringRidesStore`, `useWalletStore`); `useState`/`useEffect` for component-local state; no prop drilling
- **Styling**: Tailwind CSS v4 (installed via `@tailwindcss/vite`) + Shadcn/ui base components in `components/ui/`
- **Icons**: lucide-react across all components (3 brand/marker SVGs remain intentionally)
- **Realtime**: Supabase channels — `postgres_changes` for booking updates, `broadcast` for driver location
- **Payments**: Currency-based provider selection (`NGN/GHS/KES/ZAR` → Paystack, others → Stripe)

### Planned Evolution
- **Shadcn/ui expansion**: Add Skeleton component; consider Dialog migration for slide-over panels (see ADR-004)
- **Figma workflow**: Design-first process using Claude's Figma MCP integration (see ADR-008)
- **Supabase integration**: Replace mock data with real Supabase queries (deferred)

## Database Schema

7 tables in PostgreSQL with PostGIS extension:

| Table | Purpose | Key Features |
|-------|---------|-------------|
| `users` | User profiles | Vehicle info, ratings, verification status, RLS |
| `rides` | Driver-posted rides | PostGIS GEOGRAPHY columns, route polyline, detour limits |
| `ride_requests` | Rider search requests | Pickup/dropoff as GEOGRAPHY points |
| `bookings` | Confirmed ride matches | Status lifecycle (pending→accepted→picked_up→completed) |
| `ratings` | Post-ride ratings | Multi-criteria (punctuality, communication, safety, vehicle) |
| `messages` | Chat messages | Booking-scoped, AI-generated flag |
| `emergency_contacts` | Safety contacts | Trip sharing for trusted contacts |

All tables use RLS policies. Schema in `supabase/schema.sql`.

## Matching Algorithm

The ride matching service (`services/matchingService.ts`) uses a 6-stage filtering pipeline:

1. **Time window** — departure within `timeWindowMinutes + flexibleMinutes`
2. **Seat availability** — `seatsAvailable > 0`
3. **Bounding box** — pickup/dropoff within expanded route bbox
4. **Point-to-route distance** — pickup/dropoff within `maxDetourMeters` of route polyline
5. **Direction validation** — pickup must come BEFORE dropoff along route (same direction)
6. **Detour tolerance** — estimated detour within driver's limits

Scoring uses 5 weighted factors: detour efficiency (30%), time alignment (25%), route overlap (20%), driver rating (15%), price competitiveness (10%).

## Testing

- Framework: Vitest with jsdom environment + @testing-library/react
- Setup: `tests/setup.ts` (imports `@testing-library/jest-dom`)
- Config: `vitest.config.ts` (globals enabled, jsdom environment)
- Pattern: `tests/**/*.test.{ts,tsx}`
- Coverage: 5 test files, 121 tests (geoService, matchingService, paymentService, notificationService, stores)
- Run: `npm test` (single run) or `npm run test:watch` (watch mode) or `npx vitest --coverage`

## Figma Integration

This project uses a **design-first workflow** with Claude's Figma MCP:

1. Designers create screens in Figma
2. Developers use `get_design_context(fileKey, nodeId)` to pull specs and screenshots
3. Claude generates code using project components (Shadcn/ui base components in `components/ui/`)
4. `add_code_connect_map` creates persistent Figma ↔ code component mappings
5. Design tokens sync to `index.css` CSS variables (Tailwind v4 `@theme` block)

See `docs/design-system.md` for full workflow and `docs/adr/008-figma-design-first-workflow.md` for the decision record.
