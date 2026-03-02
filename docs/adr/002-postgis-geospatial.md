# ADR-002: PostGIS for Geospatial Ride Matching

**Status:** Accepted
**Date:** January 2025

## Context

PathMate's core feature is matching riders with drivers going in the **same direction**. This requires:
- Storing routes as geographic line geometries
- Finding rides where pickup/dropoff points are near the route
- Validating that pickup comes before dropoff (same direction check)
- Fast spatial queries across potentially thousands of active rides

## Decision

Use **PostGIS** (via Supabase's PostgreSQL) for server-side geospatial operations, complemented by a client-side matching algorithm using the Haversine formula and polyline analysis.

### Server-side (PostGIS)
- Store ride origins/destinations as `GEOGRAPHY(POINT, 4326)` columns
- Store route paths as `GEOGRAPHY(LINESTRING, 4326)` columns
- Use GIST indexes for fast spatial queries
- `find_matching_rides()` function uses `ST_DWithin()`, `ST_LineLocatePoint()`, `ST_Distance()`

### Client-side (geoService.ts + matchingService.ts)
- Haversine formula for distance calculations
- Google polyline codec for route decoding
- 6-stage filtering pipeline with composite scoring
- Used for real-time matching in the UI; PostGIS function available for batch/background processing

## Consequences

**Positive:**
- GIST indexes enable sub-millisecond spatial queries at scale
- `ST_LineLocatePoint` provides precise "position along route" for direction validation
- `ST_DWithin` handles Earth curvature correctly (GEOGRAPHY type)
- Server-side function offloads compute from client
- Client-side algorithm provides instant feedback during search

**Negative:**
- Dual implementation (client + server) creates maintenance overhead
- Client-side algorithm is an approximation (no actual route recalculation for detours)
- PostGIS adds complexity to database management
- `GEOGRAPHY(LINESTRING)` requires drivers to submit their route geometry (not just origin/destination)
