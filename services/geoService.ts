/**
 * Geospatial Service
 * Handles distance calculations, route operations, and ETA computations
 */

import { decode, encode } from '@googlemaps/polyline-codec';
import type { GeoPoint, GeoRoute, BoundingBox } from '../types';

// Earth's radius in meters
const EARTH_RADIUS_METERS = 6371000;

// ============================================
// DISTANCE CALCULATIONS
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert meters to kilometers
 */
export function metersToKm(meters: number): number {
  return meters / 1000;
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

// ============================================
// POLYLINE OPERATIONS
// ============================================

/**
 * Decode an encoded polyline string to array of GeoPoints
 */
export function decodePolyline(encoded: string): GeoPoint[] {
  const decoded = decode(encoded);
  return decoded.map(([lat, lng]) => ({ lat, lng }));
}

/**
 * Encode an array of GeoPoints to polyline string
 */
export function encodePolyline(points: GeoPoint[]): string {
  const coords = points.map(p => [p.lat, p.lng] as [number, number]);
  return encode(coords);
}

/**
 * Calculate the total length of a polyline
 * @returns Length in meters
 */
export function calculatePolylineLength(points: GeoPoint[]): number {
  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(points[i], points[i + 1]);
  }
  return totalDistance;
}

// ============================================
// BOUNDING BOX OPERATIONS
// ============================================

/**
 * Calculate bounding box for a set of points
 */
export function calculateBoundingBox(points: GeoPoint[]): BoundingBox {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounding box for empty points array');
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  return {
    southWest: { lat: minLat, lng: minLng },
    northEast: { lat: maxLat, lng: maxLng },
  };
}

/**
 * Expand bounding box by a margin (in meters)
 */
export function expandBoundingBox(bbox: BoundingBox, marginMeters: number): BoundingBox {
  // Approximate degrees per meter (varies by latitude, using average)
  const avgLat = (bbox.southWest.lat + bbox.northEast.lat) / 2;
  const latDegPerMeter = 1 / 111320; // ~111.32 km per degree latitude
  const lngDegPerMeter = 1 / (111320 * Math.cos(toRadians(avgLat)));

  const latMargin = marginMeters * latDegPerMeter;
  const lngMargin = marginMeters * lngDegPerMeter;

  return {
    southWest: {
      lat: bbox.southWest.lat - latMargin,
      lng: bbox.southWest.lng - lngMargin,
    },
    northEast: {
      lat: bbox.northEast.lat + latMargin,
      lng: bbox.northEast.lng + lngMargin,
    },
  };
}

/**
 * Check if a point is within a bounding box (with optional margin)
 */
export function isPointInBoundingBox(
  point: GeoPoint,
  bbox: BoundingBox,
  marginMeters: number = 0
): boolean {
  const expandedBbox = marginMeters > 0 ? expandBoundingBox(bbox, marginMeters) : bbox;

  return (
    point.lat >= expandedBbox.southWest.lat &&
    point.lat <= expandedBbox.northEast.lat &&
    point.lng >= expandedBbox.southWest.lng &&
    point.lng <= expandedBbox.northEast.lng
  );
}

// ============================================
// POINT-TO-ROUTE OPERATIONS
// ============================================

export interface PointToRouteResult {
  distance: number;           // Distance in meters from point to nearest point on route
  nearestPoint: GeoPoint;     // Closest point on the route
  segmentIndex: number;       // Index of the route segment
  progressAlongRoute: number; // 0-1, how far along the route (normalized)
}

/**
 * Find the nearest point on a route to a given point
 */
export function findNearestPointOnRoute(
  point: GeoPoint,
  routePoints: GeoPoint[]
): PointToRouteResult {
  if (routePoints.length < 2) {
    throw new Error('Route must have at least 2 points');
  }

  let minDistance = Infinity;
  let nearestPoint: GeoPoint = routePoints[0];
  let nearestSegmentIndex = 0;
  let nearestProgressInSegment = 0;

  // Calculate total route length for progress calculation
  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < routePoints.length - 1; i++) {
    const length = calculateDistance(routePoints[i], routePoints[i + 1]);
    segmentLengths.push(length);
    totalLength += length;
  }

  // Find nearest point on each segment
  for (let i = 0; i < routePoints.length - 1; i++) {
    const segmentStart = routePoints[i];
    const segmentEnd = routePoints[i + 1];

    const result = nearestPointOnSegment(point, segmentStart, segmentEnd);

    if (result.distance < minDistance) {
      minDistance = result.distance;
      nearestPoint = result.point;
      nearestSegmentIndex = i;
      nearestProgressInSegment = result.progress;
    }
  }

  // Calculate overall progress along route
  let progressDistance = 0;
  for (let i = 0; i < nearestSegmentIndex; i++) {
    progressDistance += segmentLengths[i];
  }
  progressDistance += segmentLengths[nearestSegmentIndex] * nearestProgressInSegment;

  const progressAlongRoute = totalLength > 0 ? progressDistance / totalLength : 0;

  return {
    distance: minDistance,
    nearestPoint,
    segmentIndex: nearestSegmentIndex,
    progressAlongRoute,
  };
}

/**
 * Find the nearest point on a line segment to a given point
 */
function nearestPointOnSegment(
  point: GeoPoint,
  segmentStart: GeoPoint,
  segmentEnd: GeoPoint
): { point: GeoPoint; distance: number; progress: number } {
  const dx = segmentEnd.lng - segmentStart.lng;
  const dy = segmentEnd.lat - segmentStart.lat;

  if (dx === 0 && dy === 0) {
    // Segment is a point
    return {
      point: segmentStart,
      distance: calculateDistance(point, segmentStart),
      progress: 0,
    };
  }

  // Project point onto line segment
  const t = Math.max(0, Math.min(1,
    ((point.lng - segmentStart.lng) * dx + (point.lat - segmentStart.lat) * dy) /
    (dx * dx + dy * dy)
  ));

  const nearestPoint: GeoPoint = {
    lat: segmentStart.lat + t * dy,
    lng: segmentStart.lng + t * dx,
  };

  return {
    point: nearestPoint,
    distance: calculateDistance(point, nearestPoint),
    progress: t,
  };
}

// ============================================
// DIRECTION VALIDATION
// ============================================

export interface DirectionValidation {
  valid: boolean;              // True if pickup comes before dropoff
  pickupProgress: number;      // 0-1, position of pickup along route
  dropoffProgress: number;     // 0-1, position of dropoff along route
  overlapDistance: number;     // Distance between pickup and dropoff along route
  overlapPercentage: number;   // Percentage of route covered by rider
}

/**
 * Validate that pickup comes BEFORE dropoff along the route
 * This is the key check for "same direction" matching.
 * Accepts optional pre-computed PointToRouteResult to avoid redundant computation.
 */
export function validatePickupDropoffOrder(
  pickup: GeoPoint,
  dropoff: GeoPoint,
  routePoints: GeoPoint[],
  precomputedPickup?: PointToRouteResult,
  precomputedDropoff?: PointToRouteResult,
): DirectionValidation {
  const pickupResult = precomputedPickup ?? findNearestPointOnRoute(pickup, routePoints);
  const dropoffResult = precomputedDropoff ?? findNearestPointOnRoute(dropoff, routePoints);

  const totalRouteLength = calculatePolylineLength(routePoints);
  const overlapDistance = (dropoffResult.progressAlongRoute - pickupResult.progressAlongRoute) * totalRouteLength;

  return {
    valid: pickupResult.progressAlongRoute < dropoffResult.progressAlongRoute,
    pickupProgress: pickupResult.progressAlongRoute,
    dropoffProgress: dropoffResult.progressAlongRoute,
    overlapDistance: Math.max(0, overlapDistance),
    overlapPercentage: Math.max(0, (dropoffResult.progressAlongRoute - pickupResult.progressAlongRoute) * 100),
  };
}

// ============================================
// DETOUR ESTIMATION
// ============================================

export interface DetourEstimate {
  extraMeters: number;    // Additional distance for pickup/dropoff
  extraMinutes: number;   // Estimated additional time
  isAcceptable: boolean;  // Within tolerance
}

/**
 * Estimate detour for picking up and dropping off a rider
 * This is a simple geometric estimate - for accurate results use Google Directions API.
 * Accepts optional pre-computed PointToRouteResult to avoid redundant computation.
 */
export function estimateDetour(
  pickup: GeoPoint,
  dropoff: GeoPoint,
  routePoints: GeoPoint[],
  maxDetourMeters: number,
  maxDetourMinutes: number,
  avgSpeedKmh: number = 30, // Default average speed in city
  precomputedPickup?: PointToRouteResult,
  precomputedDropoff?: PointToRouteResult,
): DetourEstimate {
  const pickupResult = precomputedPickup ?? findNearestPointOnRoute(pickup, routePoints);
  const dropoffResult = precomputedDropoff ?? findNearestPointOnRoute(dropoff, routePoints);

  // Extra distance = distance from route to pickup + distance from route to dropoff
  // This is a simplified estimate (actual detour requires recalculating the route)
  const extraMeters = (pickupResult.distance + dropoffResult.distance) * 2; // *2 for there and back

  // Estimate time based on average speed
  const avgSpeedMps = (avgSpeedKmh * 1000) / 3600; // Convert km/h to m/s
  const extraSeconds = extraMeters / avgSpeedMps;
  const extraMinutes = extraSeconds / 60;

  return {
    extraMeters,
    extraMinutes,
    isAcceptable: extraMeters <= maxDetourMeters && extraMinutes <= maxDetourMinutes,
  };
}

// ============================================
// ETA CALCULATIONS
// ============================================

/**
 * Estimate travel time between two points
 * @param avgSpeedKmh Average speed in km/h
 * @returns Estimated time in minutes
 */
export function estimateTravelTime(
  from: GeoPoint,
  to: GeoPoint,
  avgSpeedKmh: number = 30
): number {
  const distanceMeters = calculateDistance(from, to);
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / avgSpeedKmh;
  return timeHours * 60; // Convert to minutes
}

/**
 * Calculate ETA given current position and destination
 */
export function calculateETA(
  currentPosition: GeoPoint,
  destination: GeoPoint,
  avgSpeedKmh: number = 30
): Date {
  const travelMinutes = estimateTravelTime(currentPosition, destination, avgSpeedKmh);
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + travelMinutes);
  return eta;
}

// ============================================
// ROUTE BUILDING
// ============================================

/**
 * Create a GeoRoute object from origin, destination, and waypoints
 */
export function createGeoRoute(
  id: string,
  origin: GeoPoint,
  originAddress: string,
  destination: GeoPoint,
  destinationAddress: string,
  waypoints: GeoPoint[] = [],
  polyline?: string
): GeoRoute {
  const allPoints = [origin, ...waypoints, destination];
  const routePolyline = polyline || encodePolyline(allPoints);
  const boundingBox = calculateBoundingBox(allPoints);
  const distanceMeters = calculatePolylineLength(allPoints);
  const durationMinutes = Math.ceil(estimateTravelTime(origin, destination, 35)); // Assume 35 km/h avg

  return {
    id,
    origin,
    destination,
    originAddress,
    destinationAddress,
    waypoints,
    polyline: routePolyline,
    boundingBox,
    distanceMeters,
    durationMinutes,
  };
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format ETA for display
 */
export function formatETA(eta: Date): string {
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
