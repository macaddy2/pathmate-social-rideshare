// ============================================
// ENUMS
// ============================================

export enum UserRole {
  RIDER = 'RIDER',
  DRIVER = 'DRIVER',
  GUEST = 'GUEST'
}

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PICKED_UP = 'picked_up',
  DROPPED_OFF = 'dropped_off',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum RideStatus {
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CASH = 'cash',
  IN_APP = 'in_app'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

// ============================================
// GEOSPATIAL TYPES
// ============================================

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  northEast: GeoPoint;
  southWest: GeoPoint;
}

export interface GeoRoute {
  id: string;
  origin: GeoPoint;
  destination: GeoPoint;
  originAddress: string;
  destinationAddress: string;
  waypoints: GeoPoint[];
  polyline: string; // Encoded polyline from Google Directions API
  boundingBox: BoundingBox;
  distanceMeters: number;
  durationMinutes: number;
}

// ============================================
// USER TYPES
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;

  // Verification status
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;

  // Default role preference
  defaultRole: UserRole;

  // Driver-specific info
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  licensePlate?: string;

  // Aggregated ratings
  riderRating?: number;
  riderRatingCount?: number;
  driverRating?: number;
  driverRatingCount?: number;
}

// ============================================
// RIDE & BOOKING TYPES
// ============================================

export interface DriverRide {
  id: string;
  driverId: string;
  driver?: UserProfile;

  // Route data
  route: GeoRoute;

  // Timing
  departureTime: Date;
  flexibleMinutes: number; // +/- minutes driver can adjust

  // Capacity & pricing
  seatsAvailable: number;
  seatsTotal: number;
  pricePerSeat: number;
  currency: string; // ISO 4217 (USD, NGN, EUR, etc.)

  // Detour tolerance
  maxDetourMeters: number;
  maxDetourMinutes: number;

  // Status
  status: RideStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface RideRequest {
  id: string;
  riderId: string;
  rider?: UserProfile;

  // Pickup/Dropoff
  pickup: GeoPoint;
  pickupAddress: string;
  dropoff: GeoPoint;
  dropoffAddress: string;

  // Timing
  requestedTime: Date;
  flexibleMinutes: number;

  // Preferences
  maxPrice?: number;
  currency: string;

  // Status
  status: 'searching' | 'matched' | 'cancelled';

  createdAt: Date;
}

export interface RouteMatch {
  driverRideId: string;
  driverRide?: DriverRide;
  rideRequestId: string;
  rideRequest?: RideRequest;

  // Calculated pickup/dropoff points on driver's route
  pickupPoint: GeoPoint;
  pickupAddress?: string;
  dropoffPoint: GeoPoint;
  dropoffAddress?: string;

  // Detour cost for driver
  detourMeters: number;
  detourMinutes: number;

  // How much of rider's journey is covered
  overlapPercentage: number;

  // Timing
  estimatedPickupTime: Date;
  estimatedDropoffTime: Date;

  // Pricing
  price: number;
  currency: string;

  // Composite match quality score (0-100)
  matchScore: number;
}

export interface Booking {
  id: string;
  rideId: string;
  ride?: DriverRide;
  riderId: string;
  rider?: UserProfile;
  requestId?: string;

  // Pickup/Dropoff
  pickupPoint: GeoPoint;
  pickupAddress: string;
  dropoffPoint: GeoPoint;
  dropoffAddress: string;

  // Calculated at booking time
  detourMeters: number;
  detourMinutes: number;
  price: number;
  currency: string;

  // Status
  status: BookingStatus;

  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  riderConfirmedPayment: boolean;
  driverConfirmedPayment: boolean;

  // Timestamps
  requestedAt: Date;
  acceptedAt?: Date;
  pickupAt?: Date;
  dropoffAt?: Date;
  completedAt?: Date;
}

// ============================================
// REAL-TIME TYPES
// ============================================

export interface LiveLocation {
  point: GeoPoint;
  heading?: number; // Direction in degrees
  speed?: number; // m/s
  timestamp: Date;
}

export interface RideTracking {
  bookingId: string;
  driverLocation: LiveLocation;
  etaToPickup?: number; // minutes
  etaToDropoff?: number; // minutes
  distanceToPickup?: number; // meters
}

// ============================================
// RATING TYPES
// ============================================

export interface Rating {
  fromId: string;
  toId: string;
  score: number; // 1-5
  comment?: string;
  role: 'RIDER' | 'DRIVER'; // Role of the person being rated
}

export interface EnhancedRating {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;

  // Overall score
  score: number; // 1-5

  // Specific criteria
  punctualityScore?: number; // 1-5
  communicationScore?: number; // 1-5
  safetyScore?: number; // 1-5
  vehicleConditionScore?: number; // 1-5 (driver only)

  comment?: string;
  roleRated: 'RIDER' | 'DRIVER';

  // Quick feedback tags
  positiveTags?: string[];
  negativeTags?: string[];

  // Would ride again?
  wouldRideAgain: boolean;

  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isAi?: boolean;
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  seatsAvailable: number;
  driverName: string;
  driverRating: number;
  vehicle: string;
  price: number;
  status: 'active' | 'cancelled' | 'completed';
  matchedRiders?: Array<{ name: string; id: string; rating: number }>;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface PlanningInsight {
  title: string;
  content: string;
  category: 'market' | 'feasibility' | 'tech' | 'ux';
}
