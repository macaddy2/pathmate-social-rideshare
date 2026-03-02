# PathMate — Product Requirements Document

> Version 1.0 | Last updated: March 2026

## 1. Vision & Mission

**Vision:** A world where every car seat is shared, reducing urban congestion, emissions, and travel costs.

**Mission:** Build a decentralized peer-to-peer carpooling platform that matches riders with drivers already heading in their direction — turning everyday commutes into shared journeys.

**Key differentiator:** Unlike ride-hailing apps (Uber, Bolt) that summon drivers to you, PathMate matches people already going the same way. The driver isn't working for you — you're sharing the ride.

---

## 2. Problem Statement

**For riders:** Transportation is expensive. Ride-hailing apps charge premium prices because they send drivers specifically to pick you up. Public transit is unreliable or unavailable in many areas.

**For drivers:** Fuel costs are high. Empty seats go to waste on daily commutes. Existing rideshare platforms are complex to join or don't exist in many markets.

**Market gap:** No platform effectively matches same-direction travelers with a mobile-first, Africa-ready experience that handles local payment methods (Paystack for NGN/GHS/KES/ZAR) alongside international ones.

---

## 3. Target Users & Personas

### Persona 1: Adaeze (Rider)

| Attribute | Detail |
|-----------|--------|
| **Age** | 24 |
| **Location** | Lagos, Nigeria |
| **Occupation** | Junior developer, works in Victoria Island |
| **Commute** | Lekki → Victoria Island, 45 min daily |
| **Pain point** | Spends 30% of salary on Bolt/Uber. BRT buses are overcrowded. |
| **Goal** | Find affordable, safe rides from neighbors going the same direction |
| **Device** | Android phone, mobile data |
| **Payment** | Bank transfer, Paystack (NGN) |

### Persona 2: Emmanuel (Driver)

| Attribute | Detail |
|-----------|--------|
| **Age** | 32 |
| **Location** | Abuja, Nigeria |
| **Occupation** | Marketing manager |
| **Commute** | Gwarinpa → CBD, 1 hour daily (alone in 5-seat car) |
| **Pain point** | Rising fuel costs eating into budget. 4 empty seats every day. |
| **Goal** | Offset fuel costs by sharing ride with people going his direction |
| **Device** | iPhone, reliable data |
| **Payment** | Receives NGN to wallet, withdraws to bank |

### Persona 3: Ngozi (Occasional User)

| Attribute | Detail |
|-----------|--------|
| **Age** | 28 |
| **Location** | Nairobi, Kenya |
| **Occupation** | Freelance designer |
| **Commute** | Irregular — switches between rider and driver |
| **Pain point** | Needs flexibility. Sometimes drives, sometimes rides. |
| **Goal** | One app for both roles. Easy switching. |

---

## 4. User Stories

### 4.1 Authentication & Onboarding

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a new user, I can sign up with email and password so I can create my account | P0 |
| US-02 | As a user, I can sign in with Google OAuth so I can skip manual registration | P0 |
| US-03 | As a user, I can set my default role (rider/driver) during onboarding | P0 |
| US-04 | As a driver, I can add my vehicle information to my profile | P1 |
| US-05 | As a user, I can verify my phone number for trust | P1 |

### 4.2 Ride Posting (Driver Flow)

| ID | Story | Priority |
|----|-------|----------|
| US-10 | As a driver, I can post a ride with origin, destination, departure time, and price | P0 |
| US-11 | As a driver, I can set my detour tolerance (how far off-route I'll go for a pickup) | P0 |
| US-12 | As a driver, I can set available seats and flexible departure window | P0 |
| US-13 | As a driver, I can see my route previewed on a map before posting | P1 |
| US-14 | As a driver, I can create recurring rides for daily commutes | P2 |

### 4.3 Ride Searching & Matching (Rider Flow)

| ID | Story | Priority |
|----|-------|----------|
| US-20 | As a rider, I can search for rides by entering my pickup and dropoff locations | P0 |
| US-21 | As a rider, I see matches ranked by quality score showing detour, price, and driver rating | P0 |
| US-22 | As a rider, I can book a seat on a matching ride | P0 |
| US-23 | As a rider, I can see the driver's route on a map with my pickup/dropoff points | P1 |
| US-24 | As a rider, I can filter results by price, departure time, or rating | P1 |

### 4.4 Live Tracking

| ID | Story | Priority |
|----|-------|----------|
| US-30 | As a rider, I can see the driver's real-time location on a map after booking | P1 |
| US-31 | As a rider, I can see the ETA to my pickup point | P1 |
| US-32 | As a driver, my location is automatically shared with the rider during the ride | P1 |
| US-33 | As a rider, I get notified when the driver is within 100m of my pickup | P1 |

### 4.5 Chat & Communication

| ID | Story | Priority |
|----|-------|----------|
| US-40 | As a booking participant, I can send text messages to the other party | P1 |
| US-41 | As a user, I see real-time message delivery without refreshing | P1 |
| US-42 | As a user, I get a notification when I receive a new message | P1 |

### 4.6 Payments

| ID | Story | Priority |
|----|-------|----------|
| US-50 | As a rider, I can pay for my ride using Paystack (NGN) or Stripe (international) | P0 |
| US-51 | As a driver, I see incoming payments in my wallet | P0 |
| US-52 | As a driver, I can withdraw earnings to my bank account | P1 |
| US-53 | As a user, I can view my transaction history | P1 |
| US-54 | As a user, payments are held in escrow until the ride is completed | P2 |

### 4.7 Ratings & Trust

| ID | Story | Priority |
|----|-------|----------|
| US-60 | As a user, I can rate my ride partner (1-5 stars) after a completed ride | P1 |
| US-61 | As a user, I can see the other party's rating before booking | P1 |
| US-62 | As a user, I can rate on specific criteria (punctuality, communication, safety) | P2 |
| US-63 | As a user, my aggregate rating updates automatically when new ratings come in | P1 |

### 4.8 AI Features

| ID | Story | Priority |
|----|-------|----------|
| US-70 | As a user, I can chat with the AI planner to get trip suggestions and route insights | P2 |
| US-71 | As a user, I can get AI-generated explanations of why a match is good for me | P2 |
| US-72 | As a user, I can get AI-powered route insights with POIs and safety info | P2 |

### 4.9 Safety

| ID | Story | Priority |
|----|-------|----------|
| US-80 | As a user, I can add emergency contacts who get notified about my rides | P1 |
| US-81 | As a user, emergency contacts can track my live location during rides | P2 |

---

## 5. Feature Priority Matrix

### P0 — Core (Must ship)

- Email/password authentication
- Google OAuth sign-in
- Ride posting with route, timing, pricing, detour limits
- Ride searching with direction-aware matching algorithm
- Booking creation and management
- Dual-currency payments (Paystack + Stripe)
- Wallet with balance and transaction history

### P1 — Essential (Ship soon after core)

- Real-time driver location tracking
- ETA calculations and arrival notifications
- In-app chat between booking participants
- Notifications (in-app + browser)
- Multi-criteria ratings with auto-aggregation
- Ride history with stats
- Profile management and vehicle info
- Emergency contacts

### P2 — Growth (Next iteration)

- AI trip planner (Gemini integration)
- Recurring rides for daily commuters
- Escrow payment flow
- Design system migration (Shadcn/ui) — ADR-004
- URL-based routing (React Router v7) — ADR-005
- Global state management (Zustand) — ADR-006
- Design-first Figma workflow — ADR-008

### P3 — Future (Roadmap)

- Social features (ride groups, friends, regular partners)
- Carbon footprint tracking and gamification
- Native mobile apps (React Native or Capacitor)
- Insurance integration
- Corporate accounts and fleet management
- Multi-language support (Yoruba, Igbo, Hausa, Swahili, French)
- Referral and rewards program
- Accessibility audit (WCAG 2.1 AA compliance)

---

## 6. Success Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Match Rate** | % of ride searches that return ≥1 match | > 40% |
| **Booking Conversion** | % of matches that convert to bookings | > 25% |
| **Completion Rate** | % of bookings that complete (not cancelled) | > 80% |
| **Average Rating** | Mean rating across all completed rides | > 4.2 |
| **Repeat Usage** | % of users who ride again within 7 days | > 30% |
| **Driver Retention** | % of drivers who post ≥ 4 rides/month | > 50% |
| **CO2 Savings** | Estimated kg CO2 saved per completed ride | Track & report |
| **Payment Success** | % of payment transactions that complete without error | > 95% |

---

## 7. Non-Functional Requirements

### Performance
- Page load time < 3 seconds on 3G connection
- Map renders < 2 seconds
- Matching algorithm returns results < 500ms (client-side)
- Real-time location updates delivered < 1 second latency

### Security
- All data in transit encrypted (HTTPS/WSS)
- Row-level security on all database tables
- No payment card data stored on platform (handled by Paystack/Stripe)
- JWT-based auth with auto-refresh

### Accessibility
- Mobile-first design (480px primary viewport)
- Touch-friendly targets (minimum 44x44px)
- Color contrast ratios meeting WCAG 2.1 AA (target for P3)
- Screen reader support (target for P3)

### Scalability
- Supabase handles horizontal scaling for auth, realtime, and database
- PostGIS spatial indexes for efficient geographic queries
- Client-side matching for demo; server-side `find_matching_rides()` for production scale

### Reliability
- Graceful degradation when external services fail (Gemini, Maps, Payments)
- Offline-aware: Show cached data when network unavailable
- Payment escrow protects both parties

---

## 8. Competitive Landscape

| Feature | PathMate | BlaBlaCar | Uber | Bolt |
|---------|----------|-----------|------|------|
| Same-direction matching | Yes | Partial | No | No |
| Africa payment support | Yes (Paystack) | No | Yes | Yes |
| Driver already going there | Yes | Yes | No | No |
| Real-time tracking | Yes | Limited | Yes | Yes |
| AI trip planning | Yes (Gemini) | No | No | No |
| Multi-criteria ratings | Yes | Yes | Yes | Yes |
| Recurring rides | Yes | No | No | No |
| Escrow payments | Yes | No | N/A | N/A |
| Open-source | Yes | No | No | No |
