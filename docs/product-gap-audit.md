# PathMate Product Gap Audit

Date: 2026-07-27

## Audit scope

This audit compares:

- the canonical product requirements in `docs/prd.md`
- the supporting specification, design system, and ADRs
- the four saved PathMate design directions
- every routed screen, major component, store, service, and relevant database table in the repository

The review covers both presence and product completeness. A screen is not counted as complete when it is hidden, disconnected, uses the wrong lifecycle, or only exposes a visual/demo action.

## Product definition recovered from the sources

PathMate is not a generic taxi-booking product. It is an Africa-first, same-direction carpooling product:

- Drivers publish trips they already intend to make.
- Riders are ranked against those routes by overlap, detour, time, price, and trust.
- Both sides can operate from one account with a default role and an easy role switch.
- The core value is a trusted commute match, not merely entering two addresses.
- Payments, communication, live trip coordination, safety, and ratings complete the transaction.
- Recurring commutes are central to habit and retention, even though they are scheduled as P2 in the PRD.

## Design-file findings

The four design directions agree on the strongest product structure:

1. A commute-first home surface with the next trip, route, time, and repeated schedule.
2. A visible Find/Offer or Rider/Driver switch.
3. Route overlap as the main visual evidence behind a match.
4. A compact recommended-match card with price, detour, rating, vehicle, and trust signals.
5. Lagos-specific places, naira pricing, and commute language.

The designs are inconsistent in two areas:

- Branding alternates between a looped `P`, a text-only wordmark, and the repository's generic map-pin mark.
- Three directions use photorealistic portraits while the planner direction uses initials. The initials treatment is more scalable, more coherent with a trust-and-route product, and avoids making generated portraits the dominant emotional cue.

### Recommended visual correction

- Remove all photorealistic people.
- Use initials avatars, verified identity chips, vehicle descriptors, shared-group signals, completed-trip counts, and route overlap as the trust system.
- Replace the current `P`/map-pin family with a new route-merge symbol paired with a text-first PathMate wordmark. The symbol should communicate two compatible paths becoming one journey, not location alone.
- Keep the selected route-first layout, but let maps, route geometry, and status carry the visual weight.

## Current information architecture

Routed:

- Home
- Find a ride
- Offer a ride
- AI planner
- Ride history
- Profile
- Recurring rides
- Wallet

Visible in primary navigation:

- Home
- Search
- Post
- History
- Profile

Hidden or effectively undiscoverable:

- Wallet
- Recurring rides
- AI planner
- Chat inbox
- Live trip

The primary navigation is organized around implementation labels (`Search`, `Post`, `History`) instead of the user's lifecycle. A clearer product structure is:

- Home
- Find / Offer
- Trips
- Messages
- Account

Wallet, recurring commutes, safety, and verification can live under Home, Trips, and Account with direct contextual entry points.

## Journey and screen gap matrix

| Priority | Journey | Current state | Missing or incorrect screen/state | Recommendation |
| --- | --- | --- | --- | --- |
| P0 | Sign up | Email and Google entry exist | No post-signup onboarding | Add a short onboarding sequence for name, phone, default role, commute intent, and driver vehicle details when relevant |
| P0 | Default role | Data model supports it | No user-facing choice or quick persistent switch | Add role selection to onboarding and a Rider/Driver switch in the app shell |
| P0 | Find a ride | Route form and match list exist | No filters, match detail, selected route evidence, or booking lifecycle | Split into search, results, match detail, and booking request states |
| P0 | Match evaluation | A result card can show a score | No explanation of overlap, detour, time fit, trust, pickup, or dropoff | Add a match-detail screen with shared route map and "Why this matches" |
| P0 | Book a seat | Join action exists visually | `Join` opens a rating modal and creates no booking | Add seat selection, fare summary, payment choice, confirmation, and pending/accepted states |
| P0 | Payment | Wallet top-up service exists | No payment in booking; no payment confirmation/failure; no receipt | Add booking checkout, payment status, retry, receipt, and explicit escrow state |
| P0 | Offer a ride | Detailed form exists | No final review, publish success, or clear edit-after-publish state | Add route review, pricing/seat summary, publish confirmation, and manage-listing screen |
| P0 | Driver requests | Matched rider rows exist | No dedicated request detail or complete accept/reject lifecycle | Add rider request detail with route impact, trust, fare, and accept/reject confirmation |
| P0 | Wallet | Screen and mock data exist | Hidden route; Withdraw opens no UI; History and See All do nothing | Add discoverable wallet entry, withdrawal flow, transaction history, and status details |
| P1 | Upcoming trips | No dedicated hub | History mixes only past/completed data | Add Trips hub with Upcoming, Active, Past, and Cancelled states |
| P1 | Booking management | Partial mock statuses exist | No cancel/reschedule policies, participant details, payment state, or trip actions | Add booking detail for both rider and driver |
| P1 | Live trip | `LiveTracker` is coded | Component is orphaned and unreachable | Connect accepted bookings to arriving, pickup, in-progress, and completed states |
| P1 | Driver trip controls | Some tracker actions exist | No reachable Start trip, Arrived, Picked up, or Complete journey | Add driver-specific active-trip controls and confirmations |
| P1 | Arrival and ETA | Service/model support exists | No end-to-end rider state or arrival notification action | Add live ETA, pickup instructions, and arrival state |
| P1 | Messaging | Chat overlay exists | No inbox, conversation history entry, or booking-scoped navigation | Add Messages list and deep-link each chat to its booking |
| P1 | Notifications | Drawer, read, and delete exist | Notification rows do not navigate to the related booking, trip, payment, or rating | Add typed deep links and useful row actions |
| P1 | Ratings | Basic stars/comment modal exists | Launched before a ride; missing punctuality, communication, safety, vehicle condition, and tags | Trigger after completion and add role-specific multi-criteria rating |
| P1 | Emergency contacts | Database table exists | No interface anywhere | Add Safety Center, emergency contacts, trip sharing, and contact-access states |
| P1 | Identity/phone verification | Simulated status exists | No OTP flow, recovery, or verification center | Add verification flow and clear trust-status explanations |
| P1 | Driver verification | Vehicle fields exist | No document/photo upload, review, failure, or resubmission states | Add vehicle and driver verification center |
| P1 | Profile | Multiple settings exist | Default role, payment access, safety, and trust profile are absent | Restructure Account into profile, verification, vehicle, payments, safety, and preferences |
| P1 | Ride history | History and filters exist | Rate action is not wired; no ride detail or receipt | Add ride detail, receipt/payment, issue reporting, and post-ride rating |
| P1 | Empty/error states | Some empty states exist | Limited network, payment, map, search, and authorization recovery states | Add actionable empty, error, retry, offline, and permission-denied states |
| P2 | Recurring commutes | CRUD screen exists | Hidden; profile CTA is disconnected; not integrated with home/search/post | Add recurring commute setup and surface the next occurrence on Home |
| P2 | AI trip assistant | A routed AI screen exists | It is an internal startup strategy tool, not a rider/driver planner | Replace with a commute assistant for route options, match explanations, pickup guidance, and safety information |
| P2 | Escrow | Model and explanatory card exist | No hold, dual confirmation, release, refund, or dispute journey | Add payment timeline and dispute/refund states |
| P2 | Route insight | Matching service exists | The UI does not explain trade-offs or safer/more practical pickup points | Add transparent match reasoning and pickup suggestions |
| P3 | Trusted circles | One design mentions common groups | No product model or screens | Add trusted communities only after the transaction and safety foundation is stable |
| P3 | Referrals/rewards | PRD future item | No screens | Defer |
| P3 | Corporate/fleet | PRD future item | No screens | Defer |
| P3 | Languages/accessibility | PRD future item | No localization or completed accessibility audit | Plan after core lifecycle, while fixing touch targets and semantic controls now |

## High-severity functional mismatches

### 1. Search ends in the wrong event

`SearchRide.handleJoin()` explicitly says a real app would create a booking, but it opens `RatingModal` instead. This collapses booking, payment, acceptance, live travel, and completion into a pre-trip rating. It is the largest product-flow break.

### 2. The AI feature serves the product team, not the customer

The AI screen asks Gemini for market feasibility, growth strategy, technical depth, and regulatory analysis. The PRD requires a user-facing trip planner, match explanations, and contextual route/safety guidance.

### 3. Live tracking exists but is unreachable

`LiveTracker` contains meaningful trip states and controls, but no routed screen imports it and no booking action opens it. This creates the appearance of feature coverage in the repository without user coverage.

### 4. Wallet actions are incomplete

The wallet route is hidden. `Withdraw` updates local state but there is no withdrawal modal. `History` and `See All` have no behavior. Payment is not part of the booking journey.

### 5. Safety is present in the database but absent in the product

The schema defines emergency contacts and permissions, while the UI exposes no emergency contact management, trip sharing, safety center, or contact tracking.

### 6. Ratings are too shallow and occur at the wrong time

The schema anticipates richer rating criteria, but the UI only collects an overall score and comment. The rider search flow invokes it before booking, while the history `Rate Ride` affordance is not connected to a handler.

### 7. Existing features are hidden by navigation

Recurring rides, wallet, and the AI screen have routes but no durable primary or contextual entry points. Chat is only an overlay, not an inbox. A user cannot infer the full product from the shell.

## Required screen set for a credible product prototype

### Rider

1. Welcome / sign in
2. Onboarding and default role
3. Commute home
4. Search route and time
5. Filtered results
6. Match detail with shared route
7. Seat and fare confirmation
8. Payment
9. Booking requested
10. Booking accepted / upcoming trip
11. Message driver
12. Driver arriving
13. Live trip
14. Trip complete
15. Rate and receipt

### Driver

1. Driver onboarding and verification
2. Offer route
3. Route review and publish
4. Published trip management
5. Rider request detail
6. Accept / reject result
7. Upcoming trip
8. Arrival and pickup
9. Active trip
10. Complete trip
11. Earnings and withdrawal
12. Rate rider

### Shared account and safety

1. Trips hub
2. Messages inbox
3. Notifications with deep links
4. Wallet and transaction detail
5. Recurring commute setup
6. Safety center
7. Emergency contacts
8. Verification center
9. Profile, vehicle, role, and notification preferences
10. Offline, location-denied, map failure, payment failure, no-match, and empty states

## Proposed redesign sequence

1. Define the new logo and non-photographic identity system.
2. Rebuild the app shell around Home, Find/Offer, Trips, Messages, and Account.
3. Complete the rider booking path end to end.
4. Complete the driver request and trip-management path.
5. Connect live tracking, messages, notifications, and ratings to bookings.
6. Expose wallet, verification, and safety.
7. Integrate recurring commutes and replace the internal AI strategy screen.
8. Add secondary, error, accessibility, and offline states.

## Validation note

The repository passed its automated test suite and production build before this audit. The test suite primarily validates stores and services; it does not prove that the routed journeys are reachable or complete.

A current-run cloud-browser flow capture was attempted, but the preview environment blocked navigation even though the preview process reported healthy. Therefore, the findings above are source-, PRD-, schema-, and design-file-backed. They should not be mistaken for screenshot-based visual QA of every rendered state.
