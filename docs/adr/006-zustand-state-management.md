# ADR-006: Zustand for Global State Management

**Status:** Proposed
**Date:** March 2026

## Context

PathMate currently manages state through three mechanisms:

1. **React Context** (`AuthContext`) — User authentication, profile, session
2. **Component-local state** (`useState`) — Form data, UI toggles, active selections
3. **Service singletons** (`notificationService`, `paymentService`) — In-memory state in class instances

Problems:
- `App.tsx` holds state that should be global (`ratings`, `userLocation`, `activeChat`)
- State is passed via prop drilling (e.g., `addRating`, `setActiveTab`, `onOpenChat`)
- Service singletons hold state outside React's rendering cycle (manual subscriber pattern)
- No centralized place for ride/booking state that multiple components need

Options considered:
1. **Redux Toolkit** — Powerful but heavy boilerplate for a small app
2. **Zustand** — Minimal API, no providers needed, works alongside Context
3. **Jotai** — Atomic state, good for independent state atoms
4. **More Context providers** — More of the same, adds provider nesting

## Decision

Adopt **Zustand** for global client state management. Auth state remains in React Context.

## Consequences

**Positive:**
- Minimal boilerplate — stores are simple objects with actions
- No Provider wrapping — stores are consumed directly via hooks
- Works alongside existing AuthContext (no need to migrate auth)
- Replaces service singleton state (`notificationService.notifications` → `useNotificationStore`)
- Eliminates prop drilling for shared state (`userLocation`, `ratings`, `activeChat`)
- Built-in middleware: `persist` (localStorage), `devtools`, `immer`
- Small bundle (~1KB gzipped)

**Negative:**
- Another dependency to maintain
- Team needs to learn Zustand patterns (minimal learning curve)
- Deciding what goes in Zustand vs. local state vs. Context requires judgment

**Proposed stores:**

| Store | Replaces | Key State |
|-------|----------|-----------|
| `useRideStore` | `ratings` in App.tsx, PostRide local state | `rides[]`, `draftRide`, CRUD actions |
| `useBookingStore` | SearchRide booking state | `activeBooking`, `bookings[]`, status updates |
| `useNotificationStore` | `NotificationService` singleton | `notifications[]`, `unreadCount`, `markRead()` |
| `useWalletStore` | `PaymentService` singleton state | `wallet`, `transactions[]`, payment actions |
| `useLocationStore` | `userLocation` in App.tsx | `userLocation`, `driverLocation`, geolocation |

**Auth stays in Context** because:
- Supabase auth has its own lifecycle (session refresh, auth state changes)
- Context's provider pattern is natural for "this wraps the whole app"
- `useAuth()` is well-established in the codebase
