# PathMate Design QA

Date: 2026-07-27

## Visual target

- Selected direction: `PathMate Lagos Route Match.png`
- Product correction: remove the disliked looped-P/map-pin logo and all photorealistic portraits.
- Replacement system: text-first PathMate wordmark, route-merge icon, initials avatars, identity verification, vehicle details, ratings, trip counts, and route-overlap evidence.

## Implementation surfaces

- Authentication brand
- Shared application shell and role switch
- Commute-first home
- Search results and sorting
- Match detail
- Seat and payment confirmation
- Booking-request success
- Upcoming, active, and past trips
- Messages inbox
- Safety centre and emergency contacts
- Wallet withdrawal
- Post-trip rating
- User-facing commute assistant
- Account links to hidden product capabilities
- Notification deep links

## Source-level fidelity ledger

| Comparison point | Target evidence | Implementation decision |
| --- | --- | --- |
| Brand | Compact blue PathMate identity in the selected route-match direction | Replaced the disliked mark with a route-merge icon and text-first wordmark |
| Portrait treatment | Match identity is prominent but the user rejected photorealism | Replaced portraits with consistent initials avatars and verification marks |
| Product hierarchy | Route and commute details dominate the selected design | Home now leads with Find/Offer, usual commute, next commute, and best route match |
| Navigation | Product needs durable access to the journey lifecycle | Reorganized around Home, Find/Offer, Trips, Messages, and Account |
| Match evidence | Selected design exposes route, price, rating, and detour | Added overlap, detour, pickup/drop-off, identity, vehicle, rating, and completed trips |
| Transaction path | PRD requires book and payment | Added seat count, Paystack/wallet choice, fare total, escrow explanation, and requested state |
| Trip lifecycle | PRD requires live tracking and completion | Added upcoming, arriving, pickup-ready, in-progress, completed, receipt, and rating states |
| Safety | PRD requires emergency contacts and live sharing | Added Safety Centre, contact management, and trip-sharing state |
| AI | PRD requires commute planning and match explanation | Replaced internal startup analysis with a customer-facing commute assistant |

## Automated validation

- Test suite: passed, 121 tests.
- Production build: passed.
- Build warning: the existing application bundle remains larger than the recommended 500 kB threshold.
- Supabase credential warnings are expected because the repository is configured for mock mode.

## Visual verification

The local preview service reports healthy at the prescribed address. The selected cloud browser repeatedly returns `ERR_BLOCKED_BY_CLIENT` for that preview address, so the required rendered screenshot, interaction walkthrough, viewport comparison, and side-by-side `view_image` inspection could not be completed.

Final result: blocked

The implementation must not be described as screenshot-verified until the preview environment allows the local app to open.
