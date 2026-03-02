# PathMate — Technical Specification

> Version 1.0 | Last updated: March 2026

## 1. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (SPA)                          │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐  │
│  │Components│  │ Services  │  │ Contexts │  │   Hooks   │  │
│  │  (16)    │  │   (5)     │  │  (Auth)  │  │(Realtime) │  │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │             │               │         │
│  React 19 + TypeScript 5.8 + Vite 6.2 + Tailwind CSS        │
└───────┬──────────────┬─────────────┬───────────────┬─────────┘
        │              │             │               │
   ┌────▼────┐    ┌────▼────┐  ┌────▼─────┐   ┌────▼──────┐
   │ Google  │    │ Google  │  │ Supabase │   │ Supabase  │
   │  Maps   │    │ Gemini  │  │   Auth   │   │ Realtime  │
   │  API    │    │   AI    │  │  (JWT)   │   │   (WS)    │
   └─────────┘    └─────────┘  └────┬─────┘   └─────┬─────┘
                                    │               │
                               ┌────▼───────────────▼──────┐
                               │   Supabase Backend        │
                               │                           │
                               │  PostgreSQL + PostGIS     │
                               │  Row Level Security       │
                               │  Triggers & Functions     │
                               │  Realtime Publications    │
                               └───────────────────────────┘
```

### External Service Dependencies

| Service | Purpose | Integration |
|---------|---------|------------|
| **Supabase** | Auth, DB, Realtime, Storage | `@supabase/supabase-js` client SDK |
| **Google Maps** | Maps, Directions, Places autocomplete | `@react-google-maps/api` + Places script |
| **Google Gemini** | AI trip planning, route insights, match explanations | `@google/genai` SDK |
| **Paystack** | Payments for NGN, GHS, KES, ZAR currencies | Client-side popup SDK |
| **Stripe** | Payments for USD, EUR, GBP and other international currencies | Client-side Checkout redirect |

---

## 2. Component Architecture

### Component Hierarchy

```
App
└── AuthProvider (context)
    └── AppContent
        ├── AuthScreen (if !user)
        └── Layout (if user)
            ├── Header (logo, notifications, role badge, avatar)
            ├── NotificationCenter (drawer overlay)
            ├── [Active Tab Content]:
            │   ├── Home (dashboard, quick actions)
            │   ├── SearchRide → RouteMap, PlacesAutocomplete, RatingModal
            │   ├── PostRide → RouteMap, PlacesAutocomplete
            │   ├── AIPlanner (Gemini chat)
            │   ├── RideHistory (stats, past rides)
            │   ├── ProfileSettings (profile, vehicle, verification)
            │   ├── RecurringRides (schedules)
            │   └── WalletScreen (balance, transactions)
            ├── ChatWindow (overlay, appears on any tab)
            └── BottomNav (5 tabs: home, search, post, history, profile)
```

### Component Size & Complexity

| Component | Lines | Responsibility |
|-----------|-------|---------------|
| PostRide.tsx | 752 | Multi-step ride posting with route preview, pricing, schedule |
| SearchRide.tsx | 597 | Search form, matching results, booking flow, live tracking |
| ProfileSettings.tsx | 527 | Profile editing, vehicle info, verification status |
| RecurringRides.tsx | 449 | Recurring ride CRUD, day/time selection |
| LiveTracker.tsx | 388 | Real-time map with driver location, ETA, booking controls |
| RouteMap.tsx | 374 | Google Maps with polylines, markers, directions |
| RideHistory.tsx | 322 | Ride list, stats dashboard, CO2 savings |
| WalletScreen.tsx | 393 | Balance, transaction list, payment, withdrawal |
| PlacesAutocomplete.tsx | 289 | Google Places input with debounced search |
| AuthScreen.tsx | 255 | Login/signup tabs with Google OAuth |
| NotificationCenter.tsx | 211 | Notification list with type icons, mark-as-read |
| ChatWindow.tsx | 175 | Message list with input, Supabase realtime |
| Home.tsx | 125 | Role-based dashboard cards |
| Layout.tsx | 125 | App shell with header, content, bottom nav |
| AIPlanner.tsx | 104 | Gemini AI chat interface |
| RatingModal.tsx | 77 | Star rating submission |

### Data Flow

**Prop drilling** is the primary state-passing mechanism. Key data flows:

```
App.tsx (state owner)
  │
  ├─ activeTab, setActiveTab ──→ Layout ──→ Bottom Nav buttons
  ├─ role, setRole ────────────→ Layout ──→ Role badge
  ├─ userLocation ─────────────→ SearchRide ──→ RouteMap
  ├─ ratings, addRating ───────→ SearchRide, PostRide
  └─ activeChat, setActiveChat → ChatWindow (overlay)
```

**Auth data** flows via context:
```
AuthProvider (context)
  └── useAuth() → { user, profile, loading, error, signIn, signUp, signOut, ... }
      Used by: AuthScreen, Home, ProfileSettings, SearchRide, PostRide, ChatWindow
```

---

## 3. Service Layer

### 3.1 geoService.ts — Geospatial Calculations

Pure functions for client-side geospatial math.

| Function | Input | Output | Algorithm |
|----------|-------|--------|-----------|
| `calculateDistance` | 2 GeoPoints | meters | Haversine formula |
| `decodePolyline` | encoded string | GeoPoint[] | Google polyline codec |
| `findNearestPointOnRoute` | point + route | PointToRouteResult | Segment projection |
| `validatePickupDropoffOrder` | pickup, dropoff, route | DirectionValidation | Progress comparison |
| `estimateDetour` | pickup, dropoff, route, limits | DetourEstimate | Distance-based estimate |
| `calculateBoundingBox` | GeoPoint[] | BoundingBox | Min/max lat/lng |
| `isPointInBoundingBox` | point, bbox, margin | boolean | Coordinate range check |
| `estimateTravelTime` | 2 GeoPoints, speed | minutes | Distance / speed |
| `createGeoRoute` | origin, dest, waypoints | GeoRoute | Build route object |

### 3.2 matchingService.ts — Ride Matching Algorithm

The core matching engine. Client-side implementation (server-side via `find_matching_rides()` SQL function also available).

**6-Stage Filtering Pipeline:**

```
Active Rides
    │
    ▼ FILTER 1: Time Window
    │  └── |timeDiff| ≤ timeWindowMinutes + flexibleMinutes
    ▼ FILTER 2: Seat Availability
    │  └── seatsAvailable > 0
    ▼ FILTER 3: Bounding Box Pre-Filter (fast)
    │  └── pickup & dropoff within expanded route bbox
    ▼ FILTER 4: Point-to-Route Distance (precise)
    │  └── distance(point, route_polyline) ≤ maxDetourMeters
    ▼ FILTER 5: Direction Validation (critical)
    │  └── pickupProgress < dropoffProgress along route
    ▼ FILTER 6: Detour Tolerance
    │  └── estimatedDetour ≤ (maxDetourMeters, maxDetourMinutes)
    │
    ▼ SCORE & RANK
```

**Scoring Formula:**

```
score = 0.30 × detourEfficiency     // 100 × (1 - detour/maxDetour)
      + 0.25 × timeAlignment        // 100 × (1 - timeDiff/timeWindow)
      + 0.20 × routeOverlap         // Percentage of rider journey covered
      + 0.15 × driverRating         // Normalized 1-5 → 0-100
      + 0.10 × priceCompetitiveness // 100 if ≤ market, decreases above
```

**Configuration defaults:** maxDetour=3km, timeWindow=60min, minScore=30, maxResults=20.

### 3.3 paymentService.ts — Payment Processing

Class-based singleton handling dual payment providers.

**Currency → Provider Routing:**

| Currency | Provider | Region |
|----------|----------|--------|
| NGN, GHS, KES, ZAR | Paystack | Africa |
| USD, EUR, GBP, * | Stripe | International |

**Payment Flow:**
```
initializePayment(email, amount, currency, bookingId)
    │
    ▼ getProviderForCurrency(currency)
    │
    ├── Paystack: openPaystackPopup() → iframe → callback(reference)
    └── Stripe: openStripeCheckout() → redirect → success URL
    │
    ▼ verifyPayment(reference) → createTransaction() → update wallet
```

**Escrow Flow:** Payment → `status: 'escrow'` → ride completes → `completeEscrow()` → `status: 'completed'` + wallet credit

### 3.4 notificationService.ts — Notification Management

Class-based singleton with pub/sub pattern.

**8 notification types:** `ride_match`, `booking_confirmed`, `driver_arriving`, `ride_started`, `ride_completed`, `new_message`, `payment_received`, `rating_received`

**Features:** In-app notifications with type-based icons/colors, browser Notification API integration, subscriber pattern for reactive UI updates.

### 3.5 geminiService.ts — AI Integration

Multi-model Gemini integration using different models for different tasks:

| Function | Model | Use Case | Config |
|----------|-------|----------|--------|
| `analyzeAppFeasibility` | gemini-3-pro-preview | Complex market/feasibility analysis | ThinkingBudget: 32768 |
| `getComplexCoordinationAdvice` | gemini-3-pro-preview | Logistics coordination (luggage, timing) | ThinkingBudget: 32768 |
| `getRouteInsights` | gemini-2.5-flash-latest | Route POIs, meetup points, safety | Google Maps tool enabled |
| `getMatchingExplanation` | gemini-3-flash-preview | Quick match quality explanations | Default config |

---

## 4. Database Schema

### Entity-Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │    rides     │     │ride_requests │
│──────────────│     │──────────────│     │──────────────│
│ id (PK/FK)   │◄───┐│ id (PK)      │     │ id (PK)      │
│ email        │    ││ driver_id(FK)│────►│ rider_id(FK) │
│ display_name │    ││ origin (GEO) │     │ pickup (GEO) │
│ default_role │    ││ destination  │     │ dropoff (GEO)│
│ vehicle_*    │    ││ route_geom   │     │ status       │
│ *_rating     │    ││ departure_at │     └──────────────┘
└──────┬───────┘    ││ seats_avail  │
       │            ││ price/seat   │
       │            ││ status       │
       │            │└──────┬───────┘
       │            │       │
       │   ┌────────┘  ┌───▼──────────┐
       │   │           │   bookings   │
       │   │           │──────────────│
       ├───┼──────────►│ ride_id (FK) │
       │   │           │ rider_id(FK) │
       │   └──────────►│ driver_id(FK)│
       │               │ pickup (GEO) │
       │               │ status       │
       │               │ payment_stat │
       │               └──────┬───────┘
       │                      │
       │        ┌─────────────┼─────────────┐
       │   ┌────▼─────┐  ┌───▼──────┐  ┌───▼───────────┐
       │   │  ratings  │  │ messages │  │emergency_     │
       │   │──────────│  │──────────│  │contacts       │
       │   │booking_id│  │booking_id│  │───────────────│
       └──►│from_user │  │sender_id │  │ user_id (FK)  │
           │to_user   │  │ content  │  │ name, phone   │
           │score 1-5 │  │msg_type  │  │ auto_share    │
           └──────────┘  └──────────┘  └───────────────┘
```

### Table Details

#### users
- **PK:** `id` (UUID, references `auth.users`)
- **Key columns:** `email`, `display_name`, `default_role`, `vehicle_*` (5 fields), `rider_rating`/`driver_rating` with counts
- **Triggers:** `update_updated_at` on UPDATE, `handle_new_user` on auth.users INSERT
- **RLS:** All can SELECT, own row UPDATE/INSERT

#### rides
- **PK:** `id` (UUID, auto-generated)
- **Geospatial:** `origin` GEOGRAPHY(POINT), `destination` GEOGRAPHY(POINT), `route_geometry` GEOGRAPHY(LINESTRING)
- **Indexes:** GIST on origin, destination, route_geometry; B-tree on departure_time, status
- **RLS:** Active rides visible to all; own rides always visible; driver can INSERT/UPDATE

#### bookings
- **PK:** `id` (UUID, auto-generated)
- **FK:** `ride_id`, `rider_id`, `driver_id`
- **Status lifecycle:** `pending` → `accepted` → `driver_arrived` → `picked_up` → `completed` (or `cancelled`)
- **Payment lifecycle:** `pending` → `rider_confirmed` → `driver_confirmed` → `completed` (or `disputed`)
- **RLS:** Only ride/rider participants can SELECT/UPDATE; riders INSERT

#### ratings
- **Unique constraint:** `(booking_id, from_user_id)` — one rating per user per booking
- **Score range:** 1-5 with sub-criteria: punctuality, communication, safety, cleanliness
- **Trigger:** `update_user_rating` auto-recalculates user's aggregate rating on INSERT

#### messages
- **Types:** `text`, `location`, `image`, `system`
- **Index:** `(booking_id, created_at)` for chronological listing
- **RLS:** Only booking participants can read/send

### Server-Side Matching Function

`find_matching_rides()` uses PostGIS spatial functions:
- `ST_DWithin()` — proximity filter
- `ST_LineLocatePoint()` — position along route (for direction validation)
- `ST_Distance()` — exact distance calculation
- Orders by total detour distance (pickup_distance + dropoff_distance)

---

## 5. Authentication Flow

```
┌─────────┐          ┌────────────┐          ┌───────────┐
│  User   │          │ AuthScreen │          │ Supabase  │
│         │          │            │          │   Auth    │
└────┬────┘          └─────┬──────┘          └─────┬─────┘
     │  Email/Password      │                      │
     │──────────────────────►│  signUp()            │
     │                      │─────────────────────►│
     │                      │         user + session│
     │                      │◄─────────────────────│
     │                      │  createProfile()     │
     │                      │─────────────────────►│ INSERT users
     │                      │◄─────────────────────│
     │  ◄── Authenticated ──│                      │
     │                      │                      │
     │  Google OAuth         │                      │
     │──────────────────────►│  signInWithGoogle()  │
     │                      │─────────────────────►│
     │  ◄── Redirect ─────────────────────────────│
     │  ── OAuth callback ────────────────────────►│
     │                      │  onAuthStateChange() │
     │                      │◄─────────────────────│
     │                      │  fetchProfile()      │
     │                      │─────────────────────►│ SELECT users
     │  ◄── Authenticated ──│◄─────────────────────│
```

**Session management:** `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`

**Profile auto-creation:** Database trigger `handle_new_user()` creates a user row in `public.users` when `auth.users` gets an INSERT.

---

## 6. Real-Time Architecture

Two Supabase channel patterns power real-time features:

### Channel 1: Booking Updates (postgres_changes)

```
supabase.channel(`booking:${bookingId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bookings',
    filter: `id=eq.${bookingId}`
  }, handler)
```

Tracks: status changes, payment confirmations, timestamps

### Channel 2: Driver Location (broadcast)

```
supabase.channel(`location:${bookingId}`)
  .on('broadcast', { event: 'driver_location' }, handler)
```

Payload: `{ location: GeoPoint, heading, speed, timestamp }`
- Sent by `useDriverLocationTracker` (5-second throttle via `watchPosition`)
- Consumed by rider to update map, calculate ETA, trigger arrival alert (< 100m)

---

## 7. Error Handling Patterns

| Layer | Pattern |
|-------|---------|
| **Auth** | `setError` with 5-second auto-clear; errors surfaced in AuthContext state |
| **Supabase queries** | try/catch with `console.error`; error state in hooks |
| **Services** | Return fallback values on error (Gemini returns error message strings) |
| **Realtime** | Channel status check (`CHANNEL_ERROR` → set error state) |
| **Geolocation** | Graceful degradation (`console.warn` if denied) |
| **Payments** | Fallback simulation when SDK scripts not loaded (dev/demo mode) |

---

## 8. Migration Plans

### 8.1 Shadcn/ui Migration (ADR-004)

**Steps:**
1. Replace CDN Tailwind (`<script src="cdn.tailwindcss.com">`) with installed `tailwindcss`
2. Initialize Shadcn/ui: `npx shadcn@latest init`
3. Create `components/ui/` directory for Shadcn primitives
4. Migrate components incrementally:

| Current Pattern | Shadcn Replacement |
|----------------|--------------------|
| Custom `<input>` with Tailwind | `<Input>` from `components/ui/input` |
| Custom `<button>` styling | `<Button variant="...">` |
| Inline modal overlays | `<Dialog>` |
| Custom form sections | `<Card>`, `<CardContent>`, `<CardHeader>` |
| Tab navigation in Layout | `<Tabs>`, `<TabsList>`, `<TabsTrigger>` |
| Notification toasts | `<Toast>`, `useToast()` |
| Dropdown menus | `<DropdownMenu>` |
| Star rating inputs | Custom `<Rating>` built on Radix primitives |

### 8.2 React Router v7 Migration (ADR-005)

**Route Map:**

| Path | Component | Guard |
|------|-----------|-------|
| `/` | Home | Auth |
| `/search` | SearchRide | Auth |
| `/post` | PostRide | Auth |
| `/planner` | AIPlanner | Auth |
| `/history` | RideHistory | Auth |
| `/profile` | ProfileSettings | Auth |
| `/recurring` | RecurringRides | Auth |
| `/wallet` | WalletScreen | Auth |
| `/login` | AuthScreen | Guest only |

**Changes to `App.tsx`:**
- Remove `activeTab` state and `renderContent()` switch
- Add `<BrowserRouter>`, `<Routes>`, `<Route>` from `react-router`
- Replace `setActiveTab('search')` with `navigate('/search')`
- Replace Layout's `onClick` handlers with `<NavLink to="...">`
- Wrap authenticated routes in `<ProtectedRoute>`

### 8.3 Zustand State Migration (ADR-006)

**Proposed Stores:**

| Store | Replaces | State |
|-------|----------|-------|
| `useRideStore` | PostRide local state, ratings in App.tsx | `rides[]`, `draftRide`, `addRide()`, `updateRide()` |
| `useBookingStore` | SearchRide booking state | `activeBooking`, `bookings[]`, `createBooking()` |
| `useNotificationStore` | notificationService singleton | `notifications[]`, `unreadCount`, `markRead()` |
| `useWalletStore` | paymentService singleton state | `wallet`, `transactions[]`, `initPayment()` |
| `useLocationStore` | userLocation in App.tsx | `userLocation`, `driverLocation`, `watchPosition()` |

**Auth remains in Context** — Zustand is for client state that doesn't need React tree propagation.

---

## 9. Performance Considerations

| Area | Current | Planned |
|------|---------|---------|
| **Bundle** | CDN Tailwind (no tree-shaking), ESM importmap | Installed deps with Vite tree-shaking |
| **Maps** | Full Google Maps SDK loaded per page | Lazy-load `@react-google-maps/api` only on map pages |
| **Matching** | Client-side polyline iteration | Server-side `find_matching_rides()` PostGIS function |
| **Location** | 5s broadcast interval | Adaptive interval based on speed |
| **Rendering** | No memoization | `React.memo` on list items, `useMemo` for computed values |

---

## 10. Security Model

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | Supabase Auth (JWT), session in localStorage |
| **Authorization** | Row Level Security (RLS) on all 7 tables |
| **API keys** | Client-side only (anon key); server secrets never exposed |
| **Payment** | Provider-handled (Paystack/Stripe); no card data touches our servers |
| **Data isolation** | Users can only access their own bookings/messages/contacts via RLS |
| **Input** | TypeScript type checking; database CHECK constraints |
