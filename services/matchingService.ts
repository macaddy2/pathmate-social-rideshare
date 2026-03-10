/**
 * Matching Service
 * Core algorithm for matching riders with drivers going in the same direction
 */

import type {
  GeoPoint,
  DriverRide,
  RideRequest,
  RouteMatch,
} from '../types';

import {
  calculateDistance,
  decodePolyline,
  findNearestPointOnRoute,
  validatePickupDropoffOrder,
  estimateDetour,
  isPointInBoundingBox,
} from './geoService';

// ============================================
// MATCHING CONFIGURATION
// ============================================

export interface MatchingOptions {
  maxDetourMeters?: number;      // Override driver's max detour preference
  maxDetourMinutes?: number;     // Override driver's max time detour
  timeWindowMinutes?: number;    // How far from requested time to search
  minMatchScore?: number;        // Minimum match score (0-100) to include
  maxResults?: number;           // Maximum number of matches to return
  sortBy?: 'score' | 'price' | 'departure' | 'detour';
}

const DEFAULT_OPTIONS: Required<MatchingOptions> = {
  maxDetourMeters: 3000,         // 3km default max detour
  maxDetourMinutes: 15,          // 15 min default max time detour
  timeWindowMinutes: 60,         // Search 1 hour before/after
  minMatchScore: 30,             // Minimum 30% match quality
  maxResults: 20,                // Return top 20 matches
  sortBy: 'score',
};

// ============================================
// MATCH SCORING WEIGHTS
// ============================================

const SCORE_WEIGHTS = {
  detourEfficiency: 0.30,    // How little extra effort for driver
  timeAlignment: 0.25,       // How well departure times match
  routeOverlap: 0.20,        // How much of rider's journey is covered
  driverRating: 0.15,        // Driver's reputation
  priceCompetitiveness: 0.10, // Value for money
};

// ============================================
// MAIN MATCHING FUNCTION
// ============================================

/**
 * Find matching rides for a rider's request
 * This is the core matching algorithm that ensures "same direction" matching
 */
export async function findMatchingRides(
  request: RideRequest,
  activeRides: DriverRide[],
  options: MatchingOptions = {}
): Promise<RouteMatch[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const matches: RouteMatch[] = [];

  for (const ride of activeRides) {
    const match = evaluateMatch(request, ride, opts);
    if (match) {
      matches.push(match);
    }
  }

  // Sort matches
  const sortedMatches = sortMatches(matches, opts.sortBy);

  // Apply minimum score filter and limit results
  return sortedMatches
    .filter(m => m.matchScore >= opts.minMatchScore)
    .slice(0, opts.maxResults);
}

/**
 * Evaluate if a single ride matches a request
 * Returns null if not a valid match
 */
function evaluateMatch(
  request: RideRequest,
  ride: DriverRide,
  options: Required<MatchingOptions>
): RouteMatch | null {
  // ============================================
  // FILTER 1: Time Window Check
  // ============================================
  const timeDiffMinutes = getTimeDifferenceMinutes(
    request.requestedTime,
    ride.departureTime
  );
  const maxTimeDiff = options.timeWindowMinutes + ride.flexibleMinutes;

  if (Math.abs(timeDiffMinutes) > maxTimeDiff) {
    return null; // Outside time window
  }

  // ============================================
  // FILTER 2: Seats Available
  // ============================================
  if (ride.seatsAvailable <= 0) {
    return null; // No seats available
  }

  // ============================================
  // FILTER 3: Bounding Box Pre-Filter
  // ============================================
  const maxDetour = Math.min(ride.maxDetourMeters, options.maxDetourMeters);

  if (!isPointInBoundingBox(request.pickup, ride.route.boundingBox, maxDetour)) {
    return null; // Pickup too far from route
  }

  if (!isPointInBoundingBox(request.dropoff, ride.route.boundingBox, maxDetour)) {
    return null; // Dropoff too far from route
  }

  // ============================================
  // FILTER 4: Point-to-Route Distance
  // ============================================
  const routePoints = decodePolyline(ride.route.polyline);

  const pickupResult = findNearestPointOnRoute(request.pickup, routePoints);
  const dropoffResult = findNearestPointOnRoute(request.dropoff, routePoints);

  if (pickupResult.distance > maxDetour) {
    return null; // Pickup too far from route
  }

  if (dropoffResult.distance > maxDetour) {
    return null; // Dropoff too far from route
  }

  // ============================================
  // FILTER 5: Direction Validation (CRITICAL)
  // This ensures "same direction" - pickup must come BEFORE dropoff
  // Reuses pre-computed pickupResult/dropoffResult from Filter 4
  // ============================================
  const directionValidation = validatePickupDropoffOrder(
    request.pickup,
    request.dropoff,
    routePoints,
    pickupResult,
    dropoffResult,
  );

  if (!directionValidation.valid) {
    return null; // Rider going in opposite direction!
  }

  // ============================================
  // FILTER 6: Detour Tolerance
  // Reuses pre-computed pickupResult/dropoffResult from Filter 4
  // ============================================
  const maxDetourMinutes = Math.min(ride.maxDetourMinutes, options.maxDetourMinutes);

  const detourEstimate = estimateDetour(
    request.pickup,
    request.dropoff,
    routePoints,
    maxDetour,
    maxDetourMinutes,
    30,
    pickupResult,
    dropoffResult,
  );

  if (!detourEstimate.isAcceptable) {
    return null; // Detour exceeds tolerance
  }

  // ============================================
  // All filters passed - Calculate match score
  // ============================================
  const matchScore = calculateMatchScore({
    detourMeters: detourEstimate.extraMeters,
    maxDetourMeters: maxDetour,
    detourMinutes: detourEstimate.extraMinutes,
    maxDetourMinutes: maxDetourMinutes,
    timeDifferenceMinutes: Math.abs(timeDiffMinutes),
    timeWindowMinutes: options.timeWindowMinutes,
    overlapPercentage: directionValidation.overlapPercentage,
    driverRating: ride.driver?.driverRating ?? 4.0,
    pricePerSeat: ride.pricePerSeat,
    avgMarketPrice: ride.pricePerSeat, // TODO: Calculate market average
  });

  // ============================================
  // Build match result
  // ============================================
  const estimatedPickupTime = calculateEstimatedTime(
    ride.departureTime,
    pickupResult.progressAlongRoute,
    ride.route.durationMinutes
  );

  const estimatedDropoffTime = calculateEstimatedTime(
    ride.departureTime,
    dropoffResult.progressAlongRoute,
    ride.route.durationMinutes
  );

  return {
    driverRideId: ride.id,
    driverRide: ride,
    rideRequestId: request.id,
    rideRequest: request,
    pickupPoint: pickupResult.nearestPoint,
    pickupAddress: request.pickupAddress,
    dropoffPoint: dropoffResult.nearestPoint,
    dropoffAddress: request.dropoffAddress,
    detourMeters: Math.round(detourEstimate.extraMeters),
    detourMinutes: Math.round(detourEstimate.extraMinutes),
    overlapPercentage: Math.round(directionValidation.overlapPercentage),
    estimatedPickupTime,
    estimatedDropoffTime,
    price: ride.pricePerSeat,
    currency: ride.currency,
    matchScore: Math.round(matchScore),
  };
}

// ============================================
// MATCH SCORING
// ============================================

interface ScoreParams {
  detourMeters: number;
  maxDetourMeters: number;
  detourMinutes: number;
  maxDetourMinutes: number;
  timeDifferenceMinutes: number;
  timeWindowMinutes: number;
  overlapPercentage: number;
  driverRating: number;
  pricePerSeat: number;
  avgMarketPrice: number;
}

/**
 * Calculate composite match score (0-100)
 */
function calculateMatchScore(params: ScoreParams): number {
  // Detour efficiency: 100% if no detour, 0% if at max detour
  const detourDistanceScore = 100 * (1 - params.detourMeters / params.maxDetourMeters);
  const detourTimeScore = 100 * (1 - params.detourMinutes / params.maxDetourMinutes);
  const detourScore = (detourDistanceScore + detourTimeScore) / 2;

  // Time alignment: 100% if exact match, 0% if at edge of window
  const timeScore = 100 * (1 - params.timeDifferenceMinutes / params.timeWindowMinutes);

  // Route overlap: Direct mapping (already 0-100)
  const overlapScore = params.overlapPercentage;

  // Driver rating: Scale 1-5 to 0-100
  const ratingScore = ((params.driverRating - 1) / 4) * 100;

  // Price competitiveness: 100% if at or below market, decreases above
  const priceRatio = params.pricePerSeat / params.avgMarketPrice;
  const priceScore = priceRatio <= 1 ? 100 : Math.max(0, 100 * (2 - priceRatio));

  // Weighted sum
  const weightedScore =
    SCORE_WEIGHTS.detourEfficiency * Math.max(0, detourScore) +
    SCORE_WEIGHTS.timeAlignment * Math.max(0, timeScore) +
    SCORE_WEIGHTS.routeOverlap * Math.max(0, overlapScore) +
    SCORE_WEIGHTS.driverRating * ratingScore +
    SCORE_WEIGHTS.priceCompetitiveness * priceScore;

  return Math.min(100, Math.max(0, weightedScore));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get time difference in minutes between two dates
 */
function getTimeDifferenceMinutes(time1: Date, time2: Date): number {
  const diff = time2.getTime() - time1.getTime();
  return diff / (1000 * 60);
}

/**
 * Calculate estimated arrival time at a point along the route
 */
function calculateEstimatedTime(
  departureTime: Date,
  progressAlongRoute: number,
  totalDurationMinutes: number
): Date {
  const minutesFromDeparture = progressAlongRoute * totalDurationMinutes;
  const estimated = new Date(departureTime);
  estimated.setMinutes(estimated.getMinutes() + minutesFromDeparture);
  return estimated;
}

/**
 * Sort matches by specified criteria
 */
function sortMatches(
  matches: RouteMatch[],
  sortBy: 'score' | 'price' | 'departure' | 'detour'
): RouteMatch[] {
  return [...matches].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.matchScore - a.matchScore; // Higher is better
      case 'price':
        return a.price - b.price; // Lower is better
      case 'departure':
        return a.estimatedPickupTime.getTime() - b.estimatedPickupTime.getTime();
      case 'detour':
        return a.detourMinutes - b.detourMinutes; // Lower is better
      default:
        return b.matchScore - a.matchScore;
    }
  });
}

// ============================================
// QUICK MATCH CHECK
// ============================================

/**
 * Quick check if two points could potentially match
 * Use this for fast filtering before full match evaluation
 */
export function quickMatchCheck(
  pickup: GeoPoint,
  dropoff: GeoPoint,
  routeOrigin: GeoPoint,
  routeDestination: GeoPoint,
  maxDetourMeters: number
): boolean {
  // Simple check: are pickup and dropoff reasonably close to origin-destination line?
  const pickupToOrigin = calculateDistance(pickup, routeOrigin);
  const pickupToDestination = calculateDistance(pickup, routeDestination);
  const dropoffToOrigin = calculateDistance(dropoff, routeOrigin);
  const dropoffToDestination = calculateDistance(dropoff, routeDestination);
  const routeLength = calculateDistance(routeOrigin, routeDestination);

  // Pickup should be closer to origin than to destination (or within buffer)
  // Dropoff should be closer to destination than to origin (or within buffer)
  const pickupNearerToOrigin = pickupToOrigin < pickupToDestination + maxDetourMeters;
  const dropoffNearerToDestination = dropoffToDestination < dropoffToOrigin + maxDetourMeters;

  // Both points should be within reasonable distance of the route
  const pickupClose = Math.min(pickupToOrigin, pickupToDestination) < routeLength + maxDetourMeters;
  const dropoffClose = Math.min(dropoffToOrigin, dropoffToDestination) < routeLength + maxDetourMeters;

  return pickupNearerToOrigin && dropoffNearerToDestination && pickupClose && dropoffClose;
}

// ============================================
// MATCH EXPLANATION (AI-ENHANCED)
// ============================================

/**
 * Generate a human-readable explanation of why this is a good match
 */
export function generateMatchExplanation(match: RouteMatch): string {
  const parts: string[] = [];

  // Match quality
  if (match.matchScore >= 80) {
    parts.push('Excellent match!');
  } else if (match.matchScore >= 60) {
    parts.push('Good match');
  } else {
    parts.push('Potential match');
  }

  // Detour info
  if (match.detourMinutes <= 5) {
    parts.push('Almost no detour for driver.');
  } else {
    parts.push(`${match.detourMinutes} min detour for driver.`);
  }

  // Route coverage
  if (match.overlapPercentage >= 70) {
    parts.push(`Covers ${match.overlapPercentage}% of your journey!`);
  } else if (match.overlapPercentage >= 40) {
    parts.push(`Covers ${match.overlapPercentage}% of your route.`);
  }

  // Timing
  const pickupTime = match.estimatedPickupTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  parts.push(`Pickup around ${pickupTime}.`);

  return parts.join(' ');
}

// ============================================
// BATCH MATCHING (for background processing)
// ============================================

/**
 * Match multiple requests against multiple rides
 * Useful for batch processing or suggestions
 */
export async function batchMatch(
  requests: RideRequest[],
  rides: DriverRide[],
  options: MatchingOptions = {}
): Promise<Map<string, RouteMatch[]>> {
  const results = new Map<string, RouteMatch[]>();

  for (const request of requests) {
    const matches = await findMatchingRides(request, rides, options);
    results.set(request.id, matches);
  }

  return results;
}
