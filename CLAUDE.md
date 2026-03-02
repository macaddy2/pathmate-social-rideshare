# PathMate — Social Rideshare

A decentralized peer-to-peer carpooling platform that matches riders with drivers already heading in their direction. Unlike ride-hailing apps that summon drivers, PathMate connects people traveling the same way.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.3 |
| Language | TypeScript | 5.8.2 |
| Build | Vite | 6.2.0 |
| Styling | Tailwind CSS (CDN) | Latest |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Realtime) | 2.90.1 |
| Maps | Google Maps API (`@react-google-maps/api`) | 2.20.8 |
| AI | Google Gemini (3 Pro, 3 Flash, 2.5 Flash) | 1.37.0 |
| Payments | Paystack (Africa) + Stripe (International) | Client-side SDK |
| Testing | Vitest + jsdom | — |

## Directory Structure

```
pathmate-social-rideshare/
├── App.tsx                    # Root component — tab-based routing via activeTab state
├── index.tsx                  # React DOM entry point
├── index.html                 # HTML shell (Tailwind CDN, Inter font, importmap)
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
├── lib/                       # Client libraries
│   └── supabase.ts             # Supabase client config + Database type definitions
├── supabase/                  # Database
│   └── schema.sql              # Full PostgreSQL schema (7 tables, PostGIS, RLS)
├── tests/                     # Unit tests (Vitest)
│   ├── setup.ts                # Test setup
│   ├── notificationService.test.ts
│   └── paymentService.test.ts
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
npx vitest           # Run tests
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
- **State**: `useState` + `useEffect` for local state, `useContext` for auth, `useCallback`/`useRef` for performance
- **Naming**: PascalCase for components/types, camelCase for functions/variables
- **DB field mapping**: camelCase in TypeScript, snake_case in PostgreSQL (mapped in `AuthContext.tsx` and `useRealTimeBooking.ts`)
- **Section headers**: `// ============================================` blocks to separate logical sections
- **Imports**: Type-only imports use `import type { ... }`
- **Path aliases**: `@/*` maps to project root (configured in `tsconfig.json`)
- **Mobile-first**: All UI targets 480px max-width with `max-w-md mx-auto`

## Architecture Patterns

### Current
- **Routing**: Tab-based via `activeTab` state in `App.tsx` (switch/case rendering)
- **Auth**: React Context (`AuthProvider` → `useAuth()`) wrapping the entire app
- **State**: Component-local state + prop drilling; Auth context for user/profile
- **Realtime**: Supabase channels — `postgres_changes` for booking updates, `broadcast` for driver location
- **Payments**: Currency-based provider selection (`NGN/GHS/KES/ZAR` → Paystack, others → Stripe)

### Planned Evolution
- **Shadcn/ui**: Replace CDN Tailwind with installed Tailwind + Shadcn/ui component library (see ADR-004)
- **React Router v7**: Replace tab navigation with URL routing, deep linking, route guards (see ADR-005)
- **Zustand**: Add lightweight global stores for rides, bookings, notifications, wallet, location (see ADR-006)
- **Figma workflow**: Design-first process using Claude's Figma MCP integration (see ADR-008)

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

- Framework: Vitest with jsdom environment
- Setup: `tests/setup.ts`
- Pattern: `tests/**/*.test.{ts,tsx}`
- Current coverage: 2 test files (notification + payment services)
- Run: `npx vitest` or `npx vitest --coverage`

## Figma Integration

This project uses a **design-first workflow** with Claude's Figma MCP:

1. Designers create screens in Figma
2. Developers use `get_design_context(fileKey, nodeId)` to pull specs and screenshots
3. Claude generates code using project components (Shadcn/ui once migrated)
4. `add_code_connect_map` creates persistent Figma ↔ code component mappings
5. Design tokens sync to `tailwind.config.ts` CSS variables

See `docs/design-system.md` for full workflow and `docs/adr/008-figma-design-first-workflow.md` for the decision record.
