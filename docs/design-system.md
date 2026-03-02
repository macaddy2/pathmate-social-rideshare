# PathMate — Design System & Figma Workflow

> Version 1.0 | Last updated: March 2026

## 1. Current Design Tokens

Design tokens extracted from the existing codebase. These will be formalized in `tailwind.config.ts` and synced to Figma.

### 1.1 Colors

#### Brand Colors

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `--primary` | `indigo-600` | `#4F46E5` | Primary actions, header, active nav, buttons |
| `--primary-hover` | `indigo-500` | `#6366F1` | Interactive hover states |
| `--primary-light` | `indigo-50` | `#EEF2FF` | Active tab background, selected states |
| `--primary-dark` | `indigo-700` | `#4338CA` | Pressed/focus states |

#### Accent / Gradient

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `--accent-purple` | `purple-600` | `#9333EA` | Gradient midpoint, driver-arriving notification |
| `--accent-pink` | `pink-500` | `#EC4899` | Gradient endpoint |
| `--gradient-brand` | `from-indigo-600 via-purple-600 to-pink-500` | — | Splash screen, auth background, hero |
| `--gradient-light` | `from-indigo-500 via-purple-500 to-pink-500` | — | Loading spinner background |

#### Semantic Colors

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `--success` | `green-500` / `green-600` | `#22C55E` | Completed status, verified badges |
| `--success-bg` | `green-100` | `#DCFCE7` | Success notification background |
| `--warning` | `amber-500` / `yellow-500` | `#F59E0B` | Pending status, caution |
| `--warning-bg` | `yellow-100` | `#FEF9C3` | Warning notification background |
| `--error` | `red-500` | `#EF4444` | Errors, cancelled, failed |
| `--error-bg` | `red-100` | `#FEE2E2` | Error notification background |
| `--info` | `blue-500` / `blue-600` | `#3B82F6` | Informational, ride match |
| `--info-bg` | `blue-100` | `#DBEAFE` | Info notification background |

#### Neutral Colors

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `--bg-primary` | `white` | `#FFFFFF` | Card backgrounds, main content |
| `--bg-secondary` | `gray-50` | `#F9FAFB` | Page background, app shell |
| `--bg-page` | `gray-50` | `#F8FAFC` | Body background (via CSS) |
| `--border` | `gray-200` | `#E5E7EB` | Card borders, dividers, nav border |
| `--text-primary` | `gray-800` / `gray-900` | `#1F2937` | Headings, primary text |
| `--text-secondary` | `gray-500` / `gray-600` | `#6B7280` | Secondary text, labels |
| `--text-muted` | `gray-400` | `#9CA3AF` | Inactive nav items, placeholders |

### 1.2 Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family` | `'Inter', sans-serif` | All text (loaded from Google Fonts, weights 300-700) |
| `--font-size-xs` | `text-[9px]` / `text-[10px]` | Nav labels, badge counts |
| `--font-size-sm` | `text-xs` / `text-sm` | Secondary text, metadata |
| `--font-size-base` | `text-base` | Body text |
| `--font-size-lg` | `text-lg` / `text-xl` | Section headings |
| `--font-size-xl` | `text-2xl` / `text-3xl` | Page titles, hero numbers |
| `--font-weight-light` | `font-light` (300) | Subtle labels |
| `--font-weight-normal` | `font-normal` (400) | Body text |
| `--font-weight-medium` | `font-medium` (500) | Labels, nav items |
| `--font-weight-semibold` | `font-semibold` (600) | Section headings |
| `--font-weight-bold` | `font-bold` (700) | Page titles, hero elements |

### 1.3 Spacing

Uses Tailwind's default spacing scale throughout:

| Pattern | Usage |
|---------|-------|
| `p-1`, `p-2` | Icon buttons, compact elements |
| `p-3`, `p-4` | Card content, form sections |
| `p-6` | Spacious sections, modals |
| `gap-0.5`, `gap-1` | Icon + label combos |
| `gap-2`, `gap-3` | List items, form fields |
| `gap-4`, `gap-6` | Section spacing |
| `pb-24` | Main content bottom padding (for fixed bottom nav) |

### 1.4 Border Radius

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--radius-sm` | `rounded` | Badges, tags |
| `--radius-md` | `rounded-lg` | Cards, inputs, buttons |
| `--radius-lg` | `rounded-xl` | Modal containers |
| `--radius-xl` | `rounded-2xl` | Hero cards |
| `--radius-full` | `rounded-full` | Avatars, badges, nav buttons, spinners |

### 1.5 Shadows

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `--shadow-sm` | `shadow-md` | Cards, header |
| `--shadow-md` | `shadow-lg` | Elevated cards, modals |
| `--shadow-lg` | `shadow-xl` | Floating elements |
| `--shadow-app` | `shadow-2xl` | App container shell |

### 1.6 Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `--app-max-width` | `max-w-md` (448px) | App container, bottom nav |
| `--header-height` | ~56px | Header bar |
| `--nav-height` | ~64px | Bottom navigation |
| `--mobile-viewport` | 480px | Target viewport (via CSS `.mobile-view`) |

### 1.7 Animation

| Pattern | Usage |
|---------|-------|
| `animate-spin` | Loading spinners (border-t-transparent technique) |
| `transition-colors` | Button hover states, nav items |
| `transition-all` | Multi-property transitions |

---

## 2. Shadcn/ui Component Mapping

Planned migration from custom Tailwind components to Shadcn/ui primitives.

### Component Mapping Table

| Current Component | Current Pattern | Shadcn/ui Replacement |
|-------------------|----------------|----------------------|
| Login/signup form inputs | `<input className="border rounded-lg p-3 ...">` | `<Input>` |
| Action buttons | `<button className="bg-indigo-600 text-white rounded-lg px-4 py-2 ...">` | `<Button variant="default">` |
| Secondary buttons | `<button className="border border-gray-200 ...">` | `<Button variant="outline">` |
| Card containers | `<div className="bg-white rounded-xl p-4 shadow-md ...">` | `<Card>`, `<CardContent>` |
| Modal overlays | Custom `fixed inset-0 bg-black/50` divs | `<Dialog>` |
| Tab navigation | `activeTab` state + button array | `<Tabs>`, `<TabsList>`, `<TabsTrigger>` |
| Notification toasts | Custom notification service | `<Toast>`, `useToast()` |
| Star rating | Custom SVG stars with onClick | Custom `<Rating>` on Radix primitives |
| Dropdown/select | `<select className="...">` | `<Select>` |
| Text area | `<textarea className="...">` | `<Textarea>` |
| Toggle/switch | Custom checkbox styling | `<Switch>` |
| Badge (role, status) | `<span className="text-xs bg-indigo-500 px-2 py-1 rounded-full">` | `<Badge>` |
| Separator | `<div className="border-t border-gray-200">` | `<Separator>` |
| Skeleton loading | Custom spinner divs | `<Skeleton>` |
| Avatar | `<div className="w-8 h-8 rounded-full bg-indigo-400 ...">JD</div>` | `<Avatar>`, `<AvatarFallback>` |
| Tooltip | None (title attribute) | `<Tooltip>` |
| Scroll area | Native overflow-y-auto | `<ScrollArea>` |

### Components That Stay Custom

| Component | Reason |
|-----------|--------|
| `RouteMap` | Google Maps API integration, no Shadcn equivalent |
| `PlacesAutocomplete` | Google Places API, specialized input behavior |
| `LiveTracker` | Real-time map + geolocation, domain-specific |
| `ChatWindow` | Custom messaging UI with Supabase realtime |

### Migration Priority

1. **Phase 1 (Quick wins):** Button, Input, Card, Badge, Separator, Avatar
2. **Phase 2 (Forms):** Select, Textarea, Switch, Dialog (modals)
3. **Phase 3 (Navigation):** Tabs (integrated with React Router), Toast
4. **Phase 4 (Polish):** Tooltip, Skeleton, ScrollArea, custom Rating

---

## 3. Figma Design-First Workflow

PathMate adopts a **design-first** workflow where designs are created in Figma before implementation.

### 3.1 Workflow Overview

```
┌──────────────────────────────────────────────────────────┐
│                    DESIGN PHASE                          │
│                                                          │
│  1. Designer creates/updates screens in Figma            │
│  2. Uses component library matching Shadcn/ui primitives │
│  3. Applies design tokens (colors, typography, spacing)  │
│  4. Adds annotations for interactions & edge cases       │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  HANDOFF PHASE                           │
│                                                          │
│  1. Developer opens Claude with Figma MCP                │
│  2. Shares Figma URL: figma.com/design/:fileKey/...      │
│  3. Claude calls get_design_context(fileKey, nodeId)     │
│  4. Claude receives: screenshot + code + context hints   │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                IMPLEMENTATION PHASE                      │
│                                                          │
│  1. Claude adapts Figma output to project conventions    │
│  2. Uses existing Shadcn/ui components from components/  │
│  3. Maps Figma tokens to tailwind.config.ts variables    │
│  4. Generates component code following project patterns  │
│                                                          │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  SYNC PHASE                              │
│                                                          │
│  1. add_code_connect_map links Figma ↔ code components   │
│  2. Future Figma changes auto-surface via Code Connect   │
│  3. Design tokens stay in sync via shared config         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Figma MCP Tools Reference

| Tool | When to Use | Input |
|------|-------------|-------|
| `get_design_context` | Pull specs, code, and screenshot from a Figma node | `fileKey`, `nodeId` |
| `get_screenshot` | Capture visual reference of a specific frame | `fileKey`, `nodeId` |
| `get_metadata` | Extract design tokens, component structure | `fileKey`, `nodeId` |
| `add_code_connect_map` | Create persistent Figma → code component mapping | `fileKey`, component → code map |
| `get_code_connect_suggestions` | Get suggestions for unmapped components | `fileKey` |

### 3.3 Recommended Figma File Structure

```
PathMate Figma File
├── Cover Page
│   └── App name, version, links to docs
├── Design Tokens
│   ├── Colors (brand, semantic, neutral)
│   ├── Typography Scale
│   ├── Spacing & Layout
│   ├── Shadows & Effects
│   └── Icons
├── Component Library
│   ├── Buttons (default, outline, ghost, destructive)
│   ├── Inputs (text, select, textarea, switch)
│   ├── Cards (ride card, stat card, transaction card)
│   ├── Navigation (header, bottom nav, tabs)
│   ├── Modals (dialog, drawer, notification center)
│   ├── Badges & Tags (status, role, rating)
│   └── Maps (map container, markers, route overlay)
├── Auth Flow
│   ├── Login Screen
│   ├── Signup Screen
│   └── Google OAuth Screen
├── Rider Journey
│   ├── Home (Dashboard)
│   ├── Search Ride
│   ├── Match Results
│   ├── Booking Confirmation
│   ├── Live Tracking
│   └── Rating Modal
├── Driver Journey
│   ├── Home (Dashboard)
│   ├── Post Ride (multi-step)
│   ├── Manage Bookings
│   ├── Live Tracking (driver view)
│   └── Earnings / Wallet
├── Shared Screens
│   ├── Profile Settings
│   ├── Chat Window
│   ├── Notification Center
│   ├── Ride History
│   ├── Recurring Rides
│   ├── AI Planner
│   └── Wallet & Transactions
└── Prototype Flows
    ├── Rider: Search → Match → Book → Track → Rate
    └── Driver: Post → Accept → Navigate → Complete → Earn
```

### 3.4 Code Connect Setup

After creating the Figma file, set up Code Connect mappings:

```
# In Claude with Figma MCP, after creating the Figma component library:

1. Use get_code_connect_suggestions(fileKey) to see unmapped components
2. For each component, call add_code_connect_map with:
   - Figma component key → project file path
   - Example: "Button/Primary" → "components/ui/button.tsx"
   - Example: "Card/RideCard" → "components/SearchRide.tsx#RideCard"
3. Future get_design_context calls will return Code Connect snippets
```

### 3.5 Design Token Sync

When migrating to installed Tailwind, create `tailwind.config.ts` with PathMate tokens:

```typescript
// tailwind.config.ts (planned)
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F46E5', // indigo-600
          hover: '#6366F1',   // indigo-500
          light: '#EEF2FF',   // indigo-50
          dark: '#4338CA',    // indigo-700
        },
        // Map semantic colors to CSS variables for Shadcn/ui
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        app: '448px', // max-w-md equivalent
      },
    },
  },
}
```

These values should match the Figma design token page 1:1.

---

## 4. Iconography

### Current Approach
All icons are inline SVG elements using Heroicons patterns (stroke-based, 24x24 viewBox).

### Planned Approach
Adopt `lucide-react` (Shadcn/ui default icon library):

| Current (inline SVG) | Lucide Equivalent |
|----------------------|-------------------|
| Location pin (header) | `<MapPin>` |
| Home | `<Home>` |
| Search | `<Search>` |
| Plus circle (post) | `<PlusCircle>` |
| Clock (history) | `<Clock>` |
| User (profile) | `<User>` |
| Bell (notifications) | `<Bell>` |
| Send (chat) | `<Send>` |
| Star (ratings) | `<Star>` |
| Wallet | `<Wallet>` |
| Car | `<Car>` |
| Navigation | `<Navigation>` |

---

## 5. Responsive Design

### Current Breakpoints

The app is designed as a **mobile-first SPA** targeting a single breakpoint:

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile (primary) | ≤ 480px | All UI designed for this |
| Desktop wrapper | > 480px | Centered container with shadow (`max-w-md mx-auto shadow-2xl`) |

### Planned (with Shadcn/ui)

No additional breakpoints needed — PathMate is a mobile app. Desktop users see the mobile layout centered with a decorative shadow container.
