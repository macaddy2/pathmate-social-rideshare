# Contributing to PathMate

## Development Setup

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Supabase account** (free tier at [supabase.com](https://supabase.com))
- **Google Cloud** API keys (Maps JavaScript API, Places API, Gemini API)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/macaddy2/pathmate-social-rideshare.git
   cd pathmate-social-rideshare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and fill in your keys (see [Environment Variables](#environment-variables) below).

4. **Set up Supabase database:**
   - Create a new Supabase project
   - Go to SQL Editor and run the contents of `supabase/schema.sql`
   - Enable Realtime for `bookings` and `messages` tables (Database → Replication)

5. **Start the dev server:**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`

---

## Environment Variables

| Variable | Where to get it | Required |
|----------|----------------|----------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → Project API keys → anon/public | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs → Maps JavaScript API | Yes |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard → Settings → API Keys | For payments |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe Dashboard → Developers → API Keys → Publishable key | For payments |
| `GEMINI_API_KEY` | Google AI Studio → Get API Key | For AI features |

---

## Git Workflow

### Branch Naming

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/recurring-rides` |
| `fix/` | Bug fix | `fix/auth-redirect-loop` |
| `docs/` | Documentation | `docs/add-api-spec` |
| `refactor/` | Code refactoring | `refactor/extract-ride-store` |
| `test/` | Adding tests | `test/matching-service` |
| `chore/` | Build, deps, config | `chore/upgrade-vite` |

### Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature main
   ```
2. Make your changes with clear, atomic commits
3. Push and open a PR:
   ```bash
   git push -u origin feat/your-feature
   ```
4. Fill out the PR template (see below)
5. Request review

### Commit Messages

Follow conventional commits:
```
feat: add recurring ride day selector
fix: prevent double booking on same ride
docs: add PostGIS ADR
refactor: extract notification store to Zustand
test: add matching service edge cases
```

---

## Code Style

### TypeScript

- Strict mode enabled (`tsconfig.json`)
- Use `import type { ... }` for type-only imports
- Prefer interfaces over type aliases for object shapes
- Use enums for fixed sets of values (see `types.ts`)

### Components

- One component per file, file name matches component name (PascalCase)
- Functional components with `React.FC<Props>`
- Props interface defined in the same file
- Use `// ============================================` section headers

### Services

- Business logic lives in `services/`, not in components
- Singletons use class pattern (`export const serviceName = new ServiceClass()`)
- Pure utility functions use module export pattern
- Mock data is clearly marked and separated from logic

### Styling

- Tailwind CSS utility classes (mobile-first)
- `max-w-md mx-auto` for app container (480px target)
- Inline SVG icons (Heroicons patterns)
- No CSS files (except `index.css` for base styles)

---

## Testing

### Running Tests

```bash
npx vitest           # Run tests in watch mode
npx vitest run       # Run tests once
npx vitest --coverage # Run with coverage report
```

### Test Location

Tests live in `tests/` directory:
```
tests/
├── setup.ts                      # Test setup (jsdom env)
├── notificationService.test.ts   # Notification service tests
└── paymentService.test.ts        # Payment service tests
```

### Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ServiceName', () => {
  beforeEach(() => {
    // Reset state
  });

  it('should do something specific', () => {
    // Arrange → Act → Assert
  });
});
```

### What to Test

- **Services**: All public methods, edge cases, error handling
- **Hooks**: State transitions, cleanup, error states
- **Utils**: Pure functions in `geoService`, `matchingService`
- **Components**: Critical user flows (auth, booking, payment) — use React Testing Library

---

## Pull Request Template

```markdown
## What

Brief description of what changed.

## Why

Context for why this change is needed.

## How

Key implementation details.

## Testing

- [ ] Existing tests pass (`npx vitest run`)
- [ ] New tests added for new functionality
- [ ] Manual testing performed (describe scenarios)
- [ ] Build succeeds (`npm run build`)

## Screenshots

(If UI changes, include before/after screenshots)
```

---

## Design Workflow

PathMate uses a **design-first workflow** with Figma (see `docs/design-system.md`).

### For Developers

When implementing a new feature:

1. Check if a Figma design exists for the feature
2. If yes: Use Claude + Figma MCP to pull specs → `get_design_context(fileKey, nodeId)`
3. If no: Implement using existing design tokens and Shadcn/ui components
4. After implementation: Update Code Connect mappings if new components were created

### For Designers

When creating or updating designs:

1. Use the PathMate Figma component library
2. Follow the design token page (colors, typography, spacing)
3. Annotate interactions and edge cases
4. Share the Figma URL with the developer

---

## Architecture Decisions

Major architectural decisions are documented as ADRs in `docs/adr/`. Before proposing a significant change, check existing ADRs and consider writing a new one.

See the [ADR index](adr/README.md) for all decisions.
