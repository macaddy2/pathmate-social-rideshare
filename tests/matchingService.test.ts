import { describe, it, expect } from 'vitest';
import {
  findMatchingRides,
  quickMatchCheck,
  generateMatchExplanation,
  batchMatch,
} from '../services/matchingService';
import { encodePolyline, createGeoRoute } from '../services/geoService';
import type { GeoPoint, DriverRide, RideRequest, RouteMatch } from '../types';
import { RideStatus } from '../types';

// ============================================
// TEST HELPERS
// ============================================

// London (51.5074° N, 0.1278° W)
const london: GeoPoint = { lat: 51.5074, lng: -0.1278 };
// Paris (48.8566° N, 2.3522° E)
const paris: GeoPoint = { lat: 48.8566, lng: 2.3522 };

// Lagos → Ibadan route points
const routePoints: GeoPoint[] = [
  { lat: 6.5244, lng: 3.3792 },
  { lat: 6.65, lng: 3.5 },
  { lat: 6.85, lng: 3.65 },
  { lat: 7.0, lng: 3.75 },
  { lat: 7.2, lng: 3.85 },
  { lat: 7.3775, lng: 3.947 },
];

function createMockDriverRide(overrides: Partial<DriverRide> = {}): DriverRide {
  const now = new Date();
  const route = createGeoRoute(
    'route-1',
    routePoints[0],
    'Lagos',
    routePoints[routePoints.length - 1],
    'Ibadan',
    routePoints.slice(1, -1),
    encodePolyline(routePoints)
  );

  return {
    id: 'ride-1',
    driverId: 'driver-1',
    driver: {
      id: 'driver-1',
      email: 'driver@test.com',
      displayName: 'Test Driver',
      createdAt: now,
      emailVerified: true,
      phoneVerified: true,
      idVerified: true,
      defaultRole: 'DRIVER' as any,
      driverRating: 4.5,
      driverRatingCount: 20,
    },
    route,
    departureTime: now,
    flexibleMinutes: 15,
    seatsAvailable: 3,
    seatsTotal: 4,
    pricePerSeat: 2000,
    currency: 'NGN',
    maxDetourMeters: 3000,
    maxDetourMinutes: 15,
    status: RideStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createMockRideRequest(overrides: Partial<RideRequest> = {}): RideRequest {
  const now = new Date();
  return {
    id: 'request-1',
    riderId: 'rider-1',
    pickup: { lat: 6.65, lng: 3.5 }, // Near start of route
    pickupAddress: 'Somewhere near Lagos',
    dropoff: { lat: 7.2, lng: 3.85 }, // Near end of route
    dropoffAddress: 'Somewhere near Ibadan',
    requestedTime: now,
    flexibleMinutes: 15,
    currency: 'NGN',
    status: 'searching',
    createdAt: now,
    ...overrides,
  };
}

// ============================================
// MAIN MATCHING
// ============================================

describe('findMatchingRides', () => {
  it('should find matches for a valid request along the route', async () => {
    const ride = createMockDriverRide();
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride]);
    expect(matches.length).toBe(1);
    expect(matches[0].matchScore).toBeGreaterThan(0);
    expect(matches[0].driverRideId).toBe('ride-1');
    expect(matches[0].rideRequestId).toBe('request-1');
  });

  it('should return empty for no available rides', async () => {
    const request = createMockRideRequest();
    const matches = await findMatchingRides(request, []);
    expect(matches).toEqual([]);
  });

  // Filter 1: Time Window
  it('should reject rides outside time window', async () => {
    const now = new Date();
    const ride = createMockDriverRide({
      departureTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      flexibleMinutes: 0,
    });
    const request = createMockRideRequest({
      requestedTime: now,
      flexibleMinutes: 0,
    });

    const matches = await findMatchingRides(request, [ride], {
      timeWindowMinutes: 30,
    });
    expect(matches).toEqual([]);
  });

  it('should accept rides within flexible time window', async () => {
    const now = new Date();
    const ride = createMockDriverRide({
      departureTime: new Date(now.getTime() + 20 * 60 * 1000), // 20 mins later
      flexibleMinutes: 10,
    });
    const request = createMockRideRequest({
      requestedTime: now,
    });

    const matches = await findMatchingRides(request, [ride], {
      timeWindowMinutes: 30,
    });
    expect(matches.length).toBe(1);
  });

  // Filter 2: Seats
  it('should reject rides with no seats available', async () => {
    const ride = createMockDriverRide({ seatsAvailable: 0 });
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride]);
    expect(matches).toEqual([]);
  });

  // Filter 3 & 4: Bounding box + point-to-route distance
  it('should reject pickup far from route', async () => {
    const request = createMockRideRequest({
      pickup: { lat: 9.0579, lng: 7.4951 }, // Abuja - far from Lagos-Ibadan route
    });
    const ride = createMockDriverRide();

    const matches = await findMatchingRides(request, [ride]);
    expect(matches).toEqual([]);
  });

  it('should reject dropoff far from route', async () => {
    const request = createMockRideRequest({
      dropoff: { lat: 9.0579, lng: 7.4951 }, // Abuja
    });
    const ride = createMockDriverRide();

    const matches = await findMatchingRides(request, [ride]);
    expect(matches).toEqual([]);
  });

  // Filter 5: Direction validation
  it('should reject opposite direction (dropoff before pickup on route)', async () => {
    const request = createMockRideRequest({
      pickup: { lat: 7.2, lng: 3.85 }, // Near end of route
      dropoff: { lat: 6.65, lng: 3.5 }, // Near start of route
    });
    const ride = createMockDriverRide();

    const matches = await findMatchingRides(request, [ride]);
    expect(matches).toEqual([]);
  });

  // Sorting
  it('should sort by score (default)', async () => {
    const now = new Date();
    const ride1 = createMockDriverRide({ id: 'ride-1', pricePerSeat: 2000 });
    const ride2 = createMockDriverRide({
      id: 'ride-2',
      pricePerSeat: 1500,
      departureTime: new Date(now.getTime() + 5 * 60 * 1000),
    });
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride1, ride2], {
      sortBy: 'score',
    });

    if (matches.length === 2) {
      expect(matches[0].matchScore).toBeGreaterThanOrEqual(matches[1].matchScore);
    }
  });

  it('should sort by price when requested', async () => {
    const ride1 = createMockDriverRide({ id: 'ride-1', pricePerSeat: 3000 });
    const ride2 = createMockDriverRide({ id: 'ride-2', pricePerSeat: 1500 });
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride1, ride2], {
      sortBy: 'price',
    });

    if (matches.length === 2) {
      expect(matches[0].price).toBeLessThanOrEqual(matches[1].price);
    }
  });

  // Min score filter
  it('should filter out matches below minimum score', async () => {
    const ride = createMockDriverRide();
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride], {
      minMatchScore: 99, // Very high threshold
    });

    for (const match of matches) {
      expect(match.matchScore).toBeGreaterThanOrEqual(99);
    }
  });

  // Max results
  it('should limit results to maxResults', async () => {
    const rides = Array.from({ length: 5 }, (_, i) =>
      createMockDriverRide({ id: `ride-${i}` })
    );
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, rides, {
      maxResults: 2,
    });
    expect(matches.length).toBeLessThanOrEqual(2);
  });
});

// ============================================
// MATCH RESULT PROPERTIES
// ============================================

describe('match result properties', () => {
  it('should contain all required fields', async () => {
    const ride = createMockDriverRide();
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride]);
    expect(matches.length).toBe(1);

    const match = matches[0];
    expect(match.driverRideId).toBe('ride-1');
    expect(match.rideRequestId).toBe('request-1');
    expect(match.pickupPoint).toBeDefined();
    expect(match.pickupPoint.lat).toBeDefined();
    expect(match.pickupPoint.lng).toBeDefined();
    expect(match.dropoffPoint).toBeDefined();
    expect(match.detourMeters).toBeGreaterThanOrEqual(0);
    expect(match.detourMinutes).toBeGreaterThanOrEqual(0);
    expect(match.overlapPercentage).toBeGreaterThanOrEqual(0);
    expect(match.overlapPercentage).toBeLessThanOrEqual(100);
    expect(match.estimatedPickupTime).toBeInstanceOf(Date);
    expect(match.estimatedDropoffTime).toBeInstanceOf(Date);
    expect(match.price).toBe(2000);
    expect(match.currency).toBe('NGN');
    expect(match.matchScore).toBeGreaterThanOrEqual(0);
    expect(match.matchScore).toBeLessThanOrEqual(100);
  });

  it('should have pickup time before dropoff time', async () => {
    const ride = createMockDriverRide();
    const request = createMockRideRequest();

    const matches = await findMatchingRides(request, [ride]);
    if (matches.length > 0) {
      const match = matches[0];
      expect(match.estimatedPickupTime.getTime()).toBeLessThanOrEqual(
        match.estimatedDropoffTime.getTime()
      );
    }
  });
});

// ============================================
// QUICK MATCH CHECK
// ============================================

describe('quickMatchCheck', () => {
  it('should return true for same-direction nearby points', () => {
    const result = quickMatchCheck(
      { lat: 6.55, lng: 3.4 }, // Near Lagos (origin)
      { lat: 7.3, lng: 3.9 }, // Near Ibadan (destination)
      routePoints[0],
      routePoints[routePoints.length - 1],
      3000
    );
    expect(result).toBe(true);
  });

  it('should return false for points far from route', () => {
    const result = quickMatchCheck(
      london, // Far from route
      paris,
      routePoints[0],
      routePoints[routePoints.length - 1],
      3000
    );
    expect(result).toBe(false);
  });
});

// ============================================
// MATCH EXPLANATION
// ============================================

describe('generateMatchExplanation', () => {
  it('should generate explanation for excellent match', () => {
    const match: RouteMatch = {
      driverRideId: 'ride-1',
      rideRequestId: 'req-1',
      pickupPoint: { lat: 6.65, lng: 3.5 },
      dropoffPoint: { lat: 7.2, lng: 3.85 },
      detourMeters: 500,
      detourMinutes: 3,
      overlapPercentage: 80,
      estimatedPickupTime: new Date(),
      estimatedDropoffTime: new Date(Date.now() + 60 * 60 * 1000),
      price: 2000,
      currency: 'NGN',
      matchScore: 85,
    };

    const explanation = generateMatchExplanation(match);
    expect(explanation).toContain('Excellent match');
    expect(explanation).toContain('80%');
  });

  it('should generate explanation for good match', () => {
    const match: RouteMatch = {
      driverRideId: 'ride-1',
      rideRequestId: 'req-1',
      pickupPoint: { lat: 6.65, lng: 3.5 },
      dropoffPoint: { lat: 7.2, lng: 3.85 },
      detourMeters: 1500,
      detourMinutes: 8,
      overlapPercentage: 50,
      estimatedPickupTime: new Date(),
      estimatedDropoffTime: new Date(Date.now() + 60 * 60 * 1000),
      price: 2000,
      currency: 'NGN',
      matchScore: 65,
    };

    const explanation = generateMatchExplanation(match);
    expect(explanation).toContain('Good match');
    expect(explanation).toContain('8 min detour');
    expect(explanation).toContain('50%');
  });

  it('should note low detour', () => {
    const match: RouteMatch = {
      driverRideId: 'ride-1',
      rideRequestId: 'req-1',
      pickupPoint: { lat: 6.65, lng: 3.5 },
      dropoffPoint: { lat: 7.2, lng: 3.85 },
      detourMeters: 200,
      detourMinutes: 2,
      overlapPercentage: 30,
      estimatedPickupTime: new Date(),
      estimatedDropoffTime: new Date(Date.now() + 60 * 60 * 1000),
      price: 2000,
      currency: 'NGN',
      matchScore: 45,
    };

    const explanation = generateMatchExplanation(match);
    expect(explanation).toContain('Almost no detour');
  });
});

// ============================================
// BATCH MATCHING
// ============================================

describe('batchMatch', () => {
  it('should match multiple requests against multiple rides', async () => {
    const ride = createMockDriverRide();
    const request1 = createMockRideRequest({ id: 'req-1' });
    const request2 = createMockRideRequest({ id: 'req-2' });

    const results = await batchMatch([request1, request2], [ride]);
    expect(results.size).toBe(2);
    expect(results.has('req-1')).toBe(true);
    expect(results.has('req-2')).toBe(true);
  });

  it('should return empty arrays for no matches', async () => {
    const request = createMockRideRequest({
      id: 'req-lonely',
      pickup: london,
      dropoff: paris,
    });
    const ride = createMockDriverRide();

    const results = await batchMatch([request], [ride]);
    expect(results.get('req-lonely')).toEqual([]);
  });
});
