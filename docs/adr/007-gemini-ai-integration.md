# ADR-007: Google Gemini for AI-Powered Features

**Status:** Accepted
**Date:** March 2025

## Context

PathMate wants to provide AI-powered features to enhance the ridesharing experience:
- Trip planning assistance (route suggestions, timing optimization)
- Match quality explanations (why this ride is a good fit)
- Route insights (POIs, meetup points, safety information)
- Complex coordination advice (luggage logistics, timing, group rides)

Options considered:
1. **OpenAI GPT-4** — Most capable, but expensive and no built-in Google Maps integration
2. **Google Gemini** — Multiple model tiers, native Google Maps tool, competitive pricing
3. **Anthropic Claude** — Strong reasoning but no maps integration
4. **No AI** — Simpler but misses differentiation opportunity

## Decision

Use **Google Gemini** via the `@google/genai` SDK with a multi-model strategy:

| Model | Use Case | Why This Model |
|-------|----------|----------------|
| `gemini-3-pro-preview` | Complex analysis (feasibility, coordination) | Thinking mode with configurable budget |
| `gemini-2.5-flash-latest` | Route insights with Google Maps tool | Native Google Maps grounding |
| `gemini-3-flash-preview` | Quick match explanations | Fast, lightweight responses |

## Consequences

**Positive:**
- Multi-model approach optimizes cost/quality per task
- `gemini-2.5-flash` with Google Maps tool provides grounded location data (real POIs, live info)
- Thinking mode (`thinkingBudget: 32768`) produces higher quality analysis
- Single SDK (`@google/genai`) for all models
- Google ecosystem synergy (Maps API already used for routing)

**Negative:**
- Preview models may change behavior or availability
- API key exposed client-side (via Vite `define`) — should move to server-side proxy
- No streaming support implemented (responses are full-text)
- Gemini responses are unvalidated — could return inaccurate safety/location info
- Cost scales with usage (no caching implemented)

**Security concern:** The `GEMINI_API_KEY` is exposed to the client via Vite's `define` config. For production, this should be proxied through a Supabase Edge Function or similar server-side layer.

**Future improvements:**
- Stream responses for better UX in AI Planner
- Cache common queries (same route insights)
- Add structured output validation
- Move API calls server-side
