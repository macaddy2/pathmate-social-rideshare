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
  DRIVER_ARRIVED = 'driver_arrived',
  PICKED_UP = 'picked_up',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
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
  RIDER_CONFIRMED = 'rider_confirmed',
  DRIVER_CONFIRMED = 'driver_confirmed',
  COMPLETED = 'completed',
  DISPUTED = 'disputed'
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

// ============================================
// RIDE HISTORY TYPES
// ============================================

export interface RideHistoryEntry {
  id: string;
  date: Date;
  origin: string;
  destination: string;
  role: 'rider' | 'driver';
  status: 'completed' | 'cancelled';
  price: number;
  currency: string;
  distanceKm: number;
  durationMinutes: number;
  partnerName: string;
  partnerRating: number;
  ratingGiven?: number;
  co2SavedKg: number; // Estimated CO2 saved vs solo driving
}

export interface RideStats {
  totalRides: number;
  totalDistance: number;
  totalEarnings: number;
  totalSpent: number;
  co2Saved: number;
  avgRating: number;
  currency: string;
}

// ============================================
// RECURRING RIDES TYPES
// ============================================

export interface RecurringRide {
  id: string;
  userId: string;
  origin: string;
  originLocation: GeoPoint;
  destination: string;
  destinationLocation: GeoPoint;
  role: 'rider' | 'driver';
  schedule: {
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    time: string; // HH:mm format
  };
  isActive: boolean;
  pricePerSeat?: number;
  seatsAvailable?: number;
  createdAt: Date;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'ride_match'
  | 'booking_confirmed'
  | 'driver_arriving'
  | 'ride_started'
  | 'ride_completed'
  | 'new_message'
  | 'payment_received'
  | 'rating_received';

export interface UserNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  rideMatches: boolean;
  bookingUpdates: boolean;
  messages: boolean;
  payments: boolean;
  promotions: boolean;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentProvider = 'paystack' | 'stripe';

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerRef: string;
  status: 'pending' | 'escrow' | 'completed' | 'refunded' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

// ============================================
// ENHANCED PROFILE TYPES
// ============================================

export interface UserVerification {
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  vehicleVerified: boolean;
  phoneNumber?: string;
  idDocumentUrl?: string;
  verifiedAt?: Date;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  photoUrl?: string;
  verified: boolean;
}

