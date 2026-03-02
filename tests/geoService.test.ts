import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  metersToKm,
  metersToMiles,
  decodePolyline,
  encodePolyline,
  calculatePolylineLength,
  calculateBoundingBox,
  expandBoundingBox,
  isPointInBoundingBox,
  findNearestPointOnRoute,
  validatePickupDropoffOrder,
  estimateDetour,
  estimateTravelTime,
  createGeoRoute,
  formatDistance,
  formatDuration,
} from '../services/geoService';
import type { GeoPoint } from '../types';

// ============================================
// TEST DATA
// ============================================

// Lagos, Nigeria (6.5244° N, 3.3792° E)
const lagos: GeoPoint = { lat: 6.5244, lng: 3.3792 };
// Ibadan, Nigeria (7.3775° N, 3.9470° E)
const ibadan: GeoPoint = { lat: 7.3775, lng: 3.947 };
// Abuja, Nigeria (9.0579° N, 7.4951° E)
const abuja: GeoPoint = { lat: 9.0579, lng: 7.4951 };
// London (51.5074° N, 0.1278° W)
const london: GeoPoint = { lat: 51.5074, lng: -0.1278 };
// Paris (48.8566° N, 2.3522° E)
const paris: GeoPoint = { lat: 48.8566, lng: 2.3522 };

// Simple route: Lagos → Ibadan (roughly north-east)
const lagosIbadanRoute: GeoPoint[] = [
  { lat: 6.5244, lng: 3.3792 },
  { lat: 6.65, lng: 3.5 },
  { lat: 6.85, lng: 3.65 },
  { lat: 7.0, lng: 3.75 },
  { lat: 7.2, lng: 3.85 },
  { lat: 7.3775, lng: 3.947 },
];

// ============================================
// DISTANCE CALCULATIONS
// ============================================

describe('calculateDistance', () => {
  it('should return 0 for the same point', () => {
    const distance = calculateDistance(lagos, lagos);
    expect(distance).toBe(0);
  });

  it('should calculate distance between Lagos and Ibadan (~120-130 km)', () => {
    const distance = calculateDistance(lagos, ibadan);
    const km = distance / 1000;
    expect(km).toBeGreaterThan(100);
    expect(km).toBeLessThan(150);
  });

  it('should calculate distance between London and Paris (~340-350 km)', () => {
    const distance = calculateDistance(london, paris);
    const km = distance / 1000;
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(360);
  });

  it('should be symmetric (A→B === B→A)', () => {
    const ab = calculateDistance(lagos, ibadan);
    const ba = calculateDistance(ibadan, lagos);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it('should satisfy triangle inequality', () => {
    const ab = calculateDistance(lagos, ibadan);
    const bc = calculateDistance(ibadan, abuja);
    const ac = calculateDistance(lagos, abuja);
    expect(ac).toBeLessThanOrEqual(ab + bc + 1); // +1 for floating point tolerance
  });
});

describe('metersToKm', () => {
  it('should convert 1000 meters to 1 km', () => {
    expect(metersToKm(1000)).toBe(1);
  });

  it('should convert 500 meters to 0.5 km', () => {
    expect(metersToKm(500)).toBe(0.5);
  });

  it('should handle 0', () => {
    expect(metersToKm(0)).toBe(0);
  });
});

describe('metersToMiles', () => {
  it('should convert 1609.344 meters to 1 mile', () => {
    expect(metersToMiles(1609.344)).toBeCloseTo(1, 5);
  });

  it('should handle 0', () => {
    expect(metersToMiles(0)).toBe(0);
  });
});

// ============================================
// POLYLINE OPERATIONS
// ============================================

describe('encodePolyline / decodePolyline', () => {
  it('should round-trip encode and decode', () => {
    const points: GeoPoint[] = [
      { lat: 6.5244, lng: 3.3792 },
      { lat: 7.3775, lng: 3.947 },
    ];

    const encoded = encodePolyline(points);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodePolyline(encoded);
    expect(decoded.length).toBe(2);
    expect(decoded[0].lat).toBeCloseTo(points[0].lat, 4);
    expect(decoded[0].lng).toBeCloseTo(points[0].lng, 4);
    expect(decoded[1].lat).toBeCloseTo(points[1].lat, 4);
    expect(decoded[1].lng).toBeCloseTo(points[1].lng, 4);
  });

  it('should handle multiple points', () => {
    const encoded = encodePolyline(lagosIbadanRoute);
    const decoded = decodePolyline(encoded);
    expect(decoded.length).toBe(lagosIbadanRoute.length);
  });
});

describe('calculatePolylineLength', () => {
  it('should return 0 for a single point', () => {
    const length = calculatePolylineLength([lagos]);
    expect(length).toBe(0);
  });

  it('should equal direct distance for two points', () => {
    const length = calculatePolylineLength([lagos, ibadan]);
    const directDistance = calculateDistance(lagos, ibadan);
    expect(length).toBeCloseTo(directDistance, 5);
  });

  it('should be >= direct distance for multi-point route', () => {
    const routeLength = calculatePolylineLength(lagosIbadanRoute);
    const directDistance = calculateDistance(lagosIbadanRoute[0], lagosIbadanRoute[lagosIbadanRoute.length - 1]);
    expect(routeLength).toBeGreaterThanOrEqual(directDistance - 1);
  });
});

// ============================================
// BOUNDING BOX OPERATIONS
// ============================================

describe('calculateBoundingBox', () => {
  it('should throw for empty array', () => {
    expect(() => calculateBoundingBox([])).toThrow('Cannot calculate bounding box for empty points array');
  });

  it('should return same point for single point', () => {
    const bbox = calculateBoundingBox([lagos]);
    expect(bbox.southWest).toEqual(lagos);
    expect(bbox.northEast).toEqual(lagos);
  });

  it('should contain all points', () => {
    const bbox = calculateBoundingBox(lagosIbadanRoute);
    for (const point of lagosIbadanRoute) {
      expect(point.lat).toBeGreaterThanOrEqual(bbox.southWest.lat);
      expect(point.lat).toBeLessThanOrEqual(bbox.northEast.lat);
      expect(point.lng).toBeGreaterThanOrEqual(bbox.southWest.lng);
      expect(point.lng).toBeLessThanOrEqual(bbox.northEast.lng);
    }
  });
});

describe('expandBoundingBox', () => {
  it('should expand in all directions', () => {
    const bbox = calculateBoundingBox([lagos, ibadan]);
    const expanded = expandBoundingBox(bbox, 1000);
    expect(expanded.southWest.lat).toBeLessThan(bbox.southWest.lat);
    expect(expanded.southWest.lng).toBeLessThan(bbox.southWest.lng);
    expect(expanded.northEast.lat).toBeGreaterThan(bbox.northEast.lat);
    expect(expanded.northEast.lng).toBeGreaterThan(bbox.northEast.lng);
  });

  it('should not change with 0 margin', () => {
    const bbox = calculateBoundingBox([lagos, ibadan]);
    const expanded = expandBoundingBox(bbox, 0);
    expect(expanded.southWest.lat).toBeCloseTo(bbox.southWest.lat, 10);
    expect(expanded.northEast.lat).toBeCloseTo(bbox.northEast.lat, 10);
  });
});

describe('isPointInBoundingBox', () => {
  it('should detect point inside bbox', () => {
    const bbox = calculateBoundingBox(lagosIbadanRoute);
    const midpoint: GeoPoint = { lat: 6.9, lng: 3.65 };
    expect(isPointInBoundingBox(midpoint, bbox)).toBe(true);
  });

  it('should detect point outside bbox', () => {
    const bbox = calculateBoundingBox(lagosIbadanRoute);
    expect(isPointInBoundingBox(london, bbox)).toBe(false);
  });

  it('should detect point with margin', () => {
    const bbox = calculateBoundingBox([lagos]);
    // A point slightly outside the bbox of a single point
    const nearby: GeoPoint = { lat: lagos.lat + 0.001, lng: lagos.lng + 0.001 };
    expect(isPointInBoundingBox(nearby, bbox, 0)).toBe(false);
    expect(isPointInBoundingBox(nearby, bbox, 500)).toBe(true);
  });
});

// ============================================
// POINT-TO-ROUTE OPERATIONS
// ============================================

describe('findNearestPointOnRoute', () => {
  it('should throw for route with fewer than 2 points', () => {
    expect(() => findNearestPointOnRoute(lagos, [lagos])).toThrow('Route must have at least 2 points');
  });

  it('should find nearest point on route', () => {
    const pointNearRoute: GeoPoint = { lat: 6.85, lng: 3.7 };
    const result = findNearestPointOnRoute(pointNearRoute, lagosIbadanRoute);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.distance).toBeLessThan(10000); // Should be within 10km of route
    expect(result.segmentIndex).toBeGreaterThanOrEqual(0);
    expect(result.progressAlongRoute).toBeGreaterThan(0);
    expect(result.progressAlongRoute).toBeLessThan(1);
  });

  it('should return 0 progress for route start', () => {
    const result = findNearestPointOnRoute(lagosIbadanRoute[0], lagosIbadanRoute);
    expect(result.distance).toBeLessThan(1); // Should be ~0
    expect(result.progressAlongRoute).toBeCloseTo(0, 1);
  });

  it('should return ~1 progress for route end', () => {
    const lastPoint = lagosIbadanRoute[lagosIbadanRoute.length - 1];
    const result = findNearestPointOnRoute(lastPoint, lagosIbadanRoute);
    expect(result.distance).toBeLessThan(1);
    expect(result.progressAlongRoute).toBeCloseTo(1, 1);
  });
});

// ============================================
// DIRECTION VALIDATION
// ============================================

describe('validatePickupDropoffOrder', () => {
  it('should validate same-direction pickup before dropoff', () => {
    const pickup: GeoPoint = { lat: 6.65, lng: 3.5 }; // Near start
    const dropoff: GeoPoint = { lat: 7.2, lng: 3.85 }; // Near end
    const result = validatePickupDropoffOrder(pickup, dropoff, lagosIbadanRoute);
    expect(result.valid).toBe(true);
    expect(result.pickupProgress).toBeLessThan(result.dropoffProgress);
    expect(result.overlapPercentage).toBeGreaterThan(0);
  });

  it('should reject opposite-direction (dropoff before pickup)', () => {
    const pickup: GeoPoint = { lat: 7.2, lng: 3.85 }; // Near end
    const dropoff: GeoPoint = { lat: 6.65, lng: 3.5 }; // Near start
    const result = validatePickupDropoffOrder(pickup, dropoff, lagosIbadanRoute);
    expect(result.valid).toBe(false);
  });

  it('should return overlap percentage', () => {
    const pickup = lagosIbadanRoute[1]; // Second point
    const dropoff = lagosIbadanRoute[4]; // Fifth point
    const result = validatePickupDropoffOrder(pickup, dropoff, lagosIbadanRoute);
    expect(result.overlapPercentage).toBeGreaterThan(0);
    expect(result.overlapPercentage).toBeLessThanOrEqual(100);
  });
});

// ============================================
// DETOUR ESTIMATION
// ============================================

describe('estimateDetour', () => {
  it('should estimate acceptable detour for nearby points', () => {
    const pickup: GeoPoint = { lat: 6.66, lng: 3.51 }; // Very close to route
    const dropoff: GeoPoint = { lat: 7.19, lng: 3.84 };
    const result = estimateDetour(pickup, dropoff, lagosIbadanRoute, 5000, 30);
    expect(result.extraMeters).toBeGreaterThan(0);
    expect(result.extraMinutes).toBeGreaterThan(0);
    expect(result.isAcceptable).toBe(true);
  });

  it('should reject excessive detour', () => {
    const pickup: GeoPoint = { lat: 6.5, lng: 4.5 }; // Far from route
    const dropoff: GeoPoint = { lat: 7.5, lng: 4.5 };
    const result = estimateDetour(pickup, dropoff, lagosIbadanRoute, 1000, 5);
    expect(result.isAcceptable).toBe(false);
  });
});

// ============================================
// ETA CALCULATIONS
// ============================================

describe('estimateTravelTime', () => {
  it('should return 0 for same point', () => {
    const time = estimateTravelTime(lagos, lagos);
    expect(time).toBe(0);
  });

  it('should increase with distance', () => {
    const timeLagosIbadan = estimateTravelTime(lagos, ibadan, 60);
    const timeLagosAbuja = estimateTravelTime(lagos, abuja, 60);
    expect(timeLagosAbuja).toBeGreaterThan(timeLagosIbadan);
  });

  it('should decrease with higher speed', () => {
    const timeSlow = estimateTravelTime(lagos, ibadan, 30);
    const timeFast = estimateTravelTime(lagos, ibadan, 60);
    expect(timeFast).toBeCloseTo(timeSlow / 2, 5);
  });
});

// ============================================
// ROUTE BUILDING
// ============================================

describe('createGeoRoute', () => {
  it('should create a valid GeoRoute', () => {
    const route = createGeoRoute(
      'route-1',
      lagos,
      'Lagos',
      ibadan,
      'Ibadan'
    );
    expect(route.id).toBe('route-1');
    expect(route.origin).toEqual(lagos);
    expect(route.destination).toEqual(ibadan);
    expect(route.originAddress).toBe('Lagos');
    expect(route.destinationAddress).toBe('Ibadan');
    expect(route.polyline.length).toBeGreaterThan(0);
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationMinutes).toBeGreaterThan(0);
    expect(route.boundingBox).toBeDefined();
  });

  it('should include waypoints in route', () => {
    const waypoint: GeoPoint = { lat: 6.9, lng: 3.65 };
    const route = createGeoRoute(
      'route-2',
      lagos,
      'Lagos',
      ibadan,
      'Ibadan',
      [waypoint]
    );
    expect(route.waypoints).toHaveLength(1);
    expect(route.waypoints[0]).toEqual(waypoint);
  });
});

// ============================================
// FORMATTING UTILITIES
// ============================================

describe('formatDistance', () => {
  it('should format meters for < 1000m', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(999)).toBe('999 m');
  });

  it('should format km for >= 1000m', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(2500)).toBe('2.5 km');
    expect(formatDistance(10000)).toBe('10.0 km');
  });
});

describe('formatDuration', () => {
  it('should format minutes for < 60 min', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(59)).toBe('59 min');
  });

  it('should format hours for >= 60 min', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(120)).toBe('2h');
  });
});
