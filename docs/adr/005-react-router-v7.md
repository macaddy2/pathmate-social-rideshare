# ADR-005: React Router v7 for Client-Side Routing

**Status:** Proposed
**Date:** March 2026

## Context

PathMate currently uses **tab-based navigation** via an `activeTab` state variable in `App.tsx`. A `renderContent()` function uses a switch statement to render the appropriate component:

```tsx
const [activeTab, setActiveTab] = useState('home');

const renderContent = () => {
  switch (activeTab) {
    case 'home': return <Home />;
    case 'search': return <SearchRide />;
    // ... 6 more cases
  }
};
```

Problems with this approach:
1. **No URLs** — Users can't bookmark, share, or deep-link to specific pages
2. **No browser history** — Back button doesn't work as expected
3. **No route guards** — Auth check is in AppContent, not at the route level
4. **Prop drilling for navigation** — `setActiveTab` must be passed through components
5. **No code splitting** — All components are loaded regardless of active tab
6. **SEO** — Single URL for all states (less relevant for mobile SPA, but still a gap)

Options considered:
1. **React Router v7** — Industry standard, URL-based routing, mature ecosystem
2. **TanStack Router** — Type-safe, modern, but smaller ecosystem
3. **Keep current approach** — Works but doesn't scale

## Decision

Adopt **React Router v7** for URL-based client-side routing.

## Consequences

**Positive:**
- URLs for every page — bookmarkable, shareable, deep-linkable
- Browser back/forward navigation works correctly
- Route-level guards via `<ProtectedRoute>` wrapper
- `useNavigate()` replaces `setActiveTab` prop drilling
- `<NavLink>` provides active styling without manual `activeTab` comparison
- Enables lazy loading via `React.lazy()` + `<Suspense>` for code splitting
- Foundation for future SSR if migrating to a framework

**Negative:**
- Adds `react-router` dependency (~15KB gzipped)
- Requires updating all `setActiveTab()` calls to `navigate()` across components
- Layout component needs refactoring from `onClick` to `<NavLink>`
- Chat overlay behavior needs consideration (should it persist across routes?)

**Route map:** See `docs/spec.md` §8.2 for the full route definition.

**Migration approach:**
1. Install `react-router`
2. Wrap app in `<BrowserRouter>`
3. Replace `renderContent()` switch with `<Routes>` + `<Route>` definitions
4. Replace `setActiveTab('x')` calls with `useNavigate()('/x')`
5. Update `Layout` bottom nav to use `<NavLink>`
6. Keep `ChatWindow` as a portal/overlay that persists across routes
