# ADR-008: Design-First Workflow with Figma MCP

**Status:** Proposed
**Date:** March 2026

## Context

PathMate currently has no design system documentation, no Figma file, and no formal design-to-code workflow. UI is built ad-hoc with inline Tailwind classes, leading to:

1. **Inconsistency** — Same UI patterns (buttons, cards, inputs) styled differently across components
2. **No design review** — Developers make design decisions during implementation
3. **No design artifacts** — No mockups, wireframes, or prototypes for stakeholder review
4. **Hard onboarding** — New developers must read component source to understand the UI

With the adoption of Shadcn/ui (ADR-004), there's an opportunity to establish a proper design system and workflow.

## Decision

Adopt a **design-first workflow** using Figma as the source of truth, with Claude's Figma MCP integration for automated design-to-code handoff.

### Workflow

1. **Design in Figma** — Designers create screens using a component library that mirrors Shadcn/ui
2. **Pull specs with Claude** — Developers share Figma URLs; Claude uses `get_design_context()` to extract specs, screenshots, and code hints
3. **Generate code** — Claude adapts Figma output to project conventions (Shadcn/ui components, project tokens)
4. **Map with Code Connect** — `add_code_connect_map()` creates persistent mappings between Figma components and codebase files
5. **Keep in sync** — Design token changes in Figma are reflected in `tailwind.config.ts`

### Figma MCP Tools Used

| Tool | Purpose |
|------|---------|
| `get_design_context` | Primary tool — returns code, screenshot, and hints for a Figma node |
| `get_screenshot` | Visual reference capture for specific frames |
| `get_metadata` | Extract component structure and design tokens |
| `add_code_connect_map` | Persistent Figma ↔ code component mapping |
| `get_code_connect_suggestions` | Discover unmapped components |

## Consequences

**Positive:**
- Single source of truth for design decisions (Figma)
- Automated, consistent design-to-code translation via Claude
- Code Connect ensures Figma components stay linked to actual code
- Designers and developers work from shared artifacts
- Design tokens in Figma sync to `tailwind.config.ts`
- Stakeholders can review designs before development starts

**Negative:**
- Requires Figma account and file creation (upfront work)
- Design-first is slower for rapid prototyping (code-first is faster for exploration)
- Claude's Figma MCP integration is a dependency — workflow breaks without it
- Code Connect mappings need maintenance as components evolve

**Prerequisites:**
- Shadcn/ui migration (ADR-004) — Figma component library should mirror Shadcn
- Figma file structure created (see `docs/design-system.md` §3.3)
- Code Connect initial setup (see `docs/design-system.md` §3.4)
