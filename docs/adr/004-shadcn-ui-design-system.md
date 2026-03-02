# ADR-004: Adopt Shadcn/ui for Design System

**Status:** Proposed
**Date:** March 2026

## Context

PathMate currently uses Tailwind CSS via CDN (`<script src="cdn.tailwindcss.com">`) with inline utility classes for all styling. This approach has several problems:

1. **No design system** — Colors, spacing, and component patterns are hardcoded across 16 components
2. **CDN dependency** — Tailwind is loaded from CDN at runtime (no tree-shaking, no custom config)
3. **Inconsistent components** — Each component implements its own button, input, card, and modal patterns
4. **No accessibility** — Custom components lack ARIA attributes, keyboard navigation, focus management
5. **Hard to theme** — Changing the brand color requires find-and-replace across all files

Options considered:
1. **Chakra UI** — Full component library, but heavier bundle and opinionated styling
2. **Material UI (MUI)** — Mature but heavy, Google Material design may not fit brand
3. **Shadcn/ui** — Radix primitives + Tailwind, copies source into project, full control
4. **Headless UI** — Radix alone without pre-styled components

## Decision

Adopt **Shadcn/ui** as the component library and design system foundation.

Shadcn/ui is not a traditional library — it copies accessible, unstyled Radix UI primitives into your project as source code, then styles them with Tailwind CSS. This gives full control over component behavior and appearance.

## Consequences

**Positive:**
- Accessible by default (Radix primitives handle ARIA, keyboard nav, focus trapping)
- Full source control — components live in `components/ui/`, can be customized freely
- Tailwind-native — builds on existing team knowledge, no new styling paradigm
- Design tokens via `tailwind.config.ts` CSS variables enable consistent theming
- Figma-compatible — Shadcn/ui has official Figma kits for design-first workflow (ADR-008)
- Tree-shakeable — only import what you use
- Large community with well-documented patterns

**Negative:**
- Requires migrating from CDN Tailwind to installed Tailwind + PostCSS pipeline
- 16 components need incremental refactoring (not a drop-in replacement)
- Bundle size increases slightly (Radix runtime for accessibility)
- Learning curve for Radix composition patterns (compound components)

**Migration plan:** See `docs/spec.md` §8.1 for detailed migration steps.
