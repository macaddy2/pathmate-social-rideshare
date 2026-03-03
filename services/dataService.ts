/**
 * Data Service
 * Centralized data access layer — Supabase queries with mock fallback
 *
 * When Supabase is configured (env vars present), queries the real database.
 * When unconfigured or on failure, falls back to mock data for development.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createGeoRoute } from './geoService';
import type {
  DriverRide,
  RideHistoryEntry,
  RecurringRide,
  UserNotification,
  PaymentTransaction,
  Wallet,
  Rating,
  GeoPoint,
  RideStatus,
  UserRole,
  NotificationType,
} from '../types';
import type { ActiveRide } from '../stores/useActiveRidesStore';

// ============================================
// FALLBACK HELPER
// ============================================

/**
 * Attempts a Supabase query; falls back to mock data if unconfigured or on error.
 */
async function withFallback<T>(
  queryFn: () => Promise<T>,
  mockFn: () => T,
  label: string
): Promise<T> {
  if (!isSupabaseConfigured()) {
    return mockFn();
  }
  try {
    return await queryFn();
  } catch (error) {
    console.warn(`[DataService] ${label}: Falling back to mock data`, error);
    return mockFn();
  }
}

// ============================================
// RIDES
// ============================================

export async function fetchAvailableRides(): Promise<DriverRide[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*, users!rides_driver_id_fkey(*)')
        .eq('status', 'active')
        .gt('seats_available', 0)
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapRideRow);
    },
    generateMockDriverRides,
    'fetchAvailableRides'
  );
}

export async function fetchActiveRides(userId: string): Promise<ActiveRide[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*, bookings(*, users!bookings_rider_id_fkey(display_name, rider_rating))')
        .eq('driver_id', userId)
        .in('status', ['active', 'in_progress'])
        .order('departure_time', { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...mapRideRow(row),
        matchedRiders: (row.bookings || []).map((b: any) => ({
          id: b.rider_id,
          name: b.users?.display_name || 'Rider',
          rating: b.users?.rider_rating || 5.0,
          pickupAddress: b.pickup_address || '',
          dropoffAddress: b.dropoff_address || '',
          status: b.status,
        })),
      }));
    },
    () => generateMockActiveRides(),
    'fetchActiveRides'
  );
}

export async function createRide(ride: Omit<DriverRide, 'id' | 'createdAt' | 'updatedAt'>): Promise<DriverRide | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('rides')
    .insert({
      driver_id: ride.driverId,
      origin_address: ride.route.originAddress,
      destination_address: ride.route.destinationAddress,
      route_polyline: ride.route.polyline,
      distance_meters: ride.route.distanceMeters,
      duration_minutes: ride.route.durationMinutes,
      departure_time: ride.departureTime.toISOString(),
      flexible_minutes: ride.flexibleMinutes,
      seats_available: ride.seatsAvailable,
      seats_total: ride.seatsTotal,
      price_per_seat: ride.pricePerSeat,
      currency: ride.currency,
      max_detour_meters: ride.maxDetourMeters,
      max_detour_minutes: ride.maxDetourMinutes,
    })
    .select()
    .single();

  if (error) { console.warn('[DataService] createRide failed:', error); return null; }
  return mapRideRow(data);
}

// ============================================
// RIDE HISTORY
// ============================================

export async function fetchRideHistory(userId: string): Promise<RideHistoryEntry[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, rides(*), rider:users!bookings_rider_id_fkey(display_name, rider_rating), driver:users!bookings_driver_id_fkey(display_name, driver_rating)')
        .or(`rider_id.eq.${userId},driver_id.eq.${userId}`)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map((row: any) => {
        const isDriver = row.driver_id === userId;
        const ride = row.rides;
        const distanceKm = ride?.distance_meters ? ride.distance_meters / 1000 : 10;
        return {
          id: row.id,
          date: new Date(row.created_at),
          origin: ride?.origin_address || '',
          destination: ride?.destination_address || '',
          role: isDriver ? 'driver' as const : 'rider' as const,
          status: row.status === 'completed' ? 'completed' as const : 'cancelled' as const,
          price: row.price,
          currency: row.currency,
          distanceKm,
          durationMinutes: ride?.duration_minutes || Math.floor(distanceKm * 3.5),
          partnerName: isDriver ? row.rider?.display_name || '' : row.driver?.display_name || '',
          partnerRating: isDriver ? row.rider?.rider_rating || 5.0 : row.driver?.driver_rating || 5.0,
          co2SavedKg: distanceKm * 0.12,
        };
      });
    },
    generateMockHistory,
    'fetchRideHistory'
  );
}

// ============================================
// RECURRING RIDES
// ============================================

export async function fetchRecurringRides(userId: string): Promise<RecurringRide[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('recurring_rides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapRecurringRideRow);
    },
    generateMockRecurringRides,
    'fetchRecurringRides'
  );
}

export async function createRecurringRide(ride: Omit<RecurringRide, 'id' | 'createdAt'>): Promise<RecurringRide | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('recurring_rides')
    .insert({
      user_id: ride.userId,
      origin: ride.origin,
      origin_lat: ride.originLocation.lat,
      origin_lng: ride.originLocation.lng,
      destination: ride.destination,
      destination_lat: ride.destinationLocation.lat,
      destination_lng: ride.destinationLocation.lng,
      role: ride.role,
      schedule_days: ride.schedule.days,
      schedule_time: ride.schedule.time,
      is_active: ride.isActive,
      price_per_seat: ride.pricePerSeat,
      seats_available: ride.seatsAvailable,
    })
    .select()
    .single();

  if (error) { console.warn('[DataService] createRecurringRide failed:', error); return null; }
  return mapRecurringRideRow(data);
}

export async function updateRecurringRide(id: string, updates: Partial<RecurringRide>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const dbUpdates: Record<string, unknown> = {};
  if (updates.origin !== undefined) dbUpdates.origin = updates.origin;
  if (updates.destination !== undefined) dbUpdates.destination = updates.destination;
  if (updates.originLocation) {
    dbUpdates.origin_lat = updates.originLocation.lat;
    dbUpdates.origin_lng = updates.originLocation.lng;
  }
  if (updates.destinationLocation) {
    dbUpdates.destination_lat = updates.destinationLocation.lat;
    dbUpdates.destination_lng = updates.destinationLocation.lng;
  }
  if (updates.schedule) {
    dbUpdates.schedule_days = updates.schedule.days;
    dbUpdates.schedule_time = updates.schedule.time;
  }
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.pricePerSeat !== undefined) dbUpdates.price_per_seat = updates.pricePerSeat;
  if (updates.seatsAvailable !== undefined) dbUpdates.seats_available = updates.seatsAvailable;
  if (updates.role !== undefined) dbUpdates.role = updates.role;

  const { error } = await supabase.from('recurring_rides').update(dbUpdates).eq('id', id);
  if (error) console.warn('[DataService] updateRecurringRide failed:', error);
}

export async function deleteRecurringRide(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('recurring_rides').delete().eq('id', id);
  if (error) console.warn('[DataService] deleteRecurringRide failed:', error);
}

export async function toggleRecurringRideActive(id: string, isActive: boolean): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('recurring_rides').update({ is_active: isActive }).eq('id', id);
  if (error) console.warn('[DataService] toggleRecurringRideActive failed:', error);
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function fetchNotifications(userId: string): Promise<UserNotification[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(mapNotificationRow);
    },
    generateMockNotifications,
    'fetchNotifications'
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) console.warn('[DataService] markNotificationRead failed:', error);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) console.warn('[DataService] markAllNotificationsRead failed:', error);
}

export async function deleteNotificationById(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) console.warn('[DataService] deleteNotification failed:', error);
}

export async function createNotification(notification: Omit<UserNotification, 'id' | 'createdAt'>): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('notifications').insert({
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data || {},
    read: notification.read,
  });
  if (error) console.warn('[DataService] createNotification failed:', error);
}

// ============================================
// PAYMENTS / WALLET
// ============================================

export async function fetchWallet(userId: string): Promise<Wallet> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return {
        userId: data.user_id,
        balance: data.balance,
        currency: data.currency,
        lastUpdated: new Date(data.last_updated),
      };
    },
    () => generateMockWallet(userId),
    'fetchWallet'
  );
}

export async function fetchTransactions(userId: string): Promise<PaymentTransaction[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []).map(mapTransactionRow);
    },
    generateMockTransactions,
    'fetchTransactions'
  );
}

export async function createPaymentTransaction(
  transaction: Omit<PaymentTransaction, 'id' | 'createdAt'>
): Promise<PaymentTransaction | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from('payments')
    .insert({
      booking_id: transaction.bookingId || null,
      from_user_id: transaction.fromUserId,
      to_user_id: transaction.toUserId,
      amount: transaction.amount,
      currency: transaction.currency,
      provider: transaction.provider,
      provider_ref: transaction.providerRef,
      status: transaction.status,
    })
    .select()
    .single();

  if (error) { console.warn('[DataService] createPaymentTransaction failed:', error); return null; }
  return mapTransactionRow(data);
}

export async function updateTransactionStatus(id: string, status: string, completedAt?: Date): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const updates: Record<string, unknown> = { status };
  if (completedAt) updates.completed_at = completedAt.toISOString();
  const { error } = await supabase.from('payments').update(updates).eq('id', id);
  if (error) console.warn('[DataService] updateTransactionStatus failed:', error);
}

export async function updateWalletBalance(userId: string, newBalance: number): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from('wallets')
    .upsert({ user_id: userId, balance: newBalance, currency: 'NGN', last_updated: new Date().toISOString() });
  if (error) console.warn('[DataService] updateWalletBalance failed:', error);
}

// ============================================
// RATINGS
// ============================================

export async function fetchUserRatings(userId: string): Promise<Rating[]> {
  return withFallback(
    async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        fromId: row.from_user_id,
        toId: row.to_user_id,
        score: row.score,
        role: row.role,
        comment: row.comment,
      }));
    },
    () => [
      { fromId: 'a', toId: userId, score: 5, role: 'DRIVER' as const },
      { fromId: 'b', toId: userId, score: 4, role: 'DRIVER' as const },
      { fromId: 'c', toId: userId, score: 5, role: 'RIDER' as const },
    ],
    'fetchUserRatings'
  );
}

export async function createRating(rating: {
  bookingId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  role: 'RIDER' | 'DRIVER';
  comment?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('ratings').insert({
    booking_id: rating.bookingId,
    from_user_id: rating.fromUserId,
    to_user_id: rating.toUserId,
    score: rating.score,
    role: rating.role,
    comment: rating.comment,
  });
  if (error) console.warn('[DataService] createRating failed:', error);
}

// ============================================
// ROW MAPPERS (snake_case → camelCase)
// ============================================

function mapRideRow(row: any): DriverRide {
  return {
    id: row.id,
    driverId: row.driver_id,
    driver: row.users ? {
      id: row.users.id,
      email: row.users.email,
      displayName: row.users.display_name,
      createdAt: new Date(row.users.created_at),
      emailVerified: row.users.email_verified,
      phoneVerified: row.users.phone_verified,
      idVerified: row.users.id_verified,
      defaultRole: row.users.default_role as UserRole,
      vehicleMake: row.users.vehicle_make,
      vehicleModel: row.users.vehicle_model,
      vehicleYear: row.users.vehicle_year,
      vehicleColor: row.users.vehicle_color,
      driverRating: row.users.driver_rating,
      driverRatingCount: row.users.driver_rating_count,
    } : undefined,
    route: createGeoRoute(
      row.id,
      { lat: 0, lng: 0 }, // Origin point — decoded from polyline if available
      row.origin_address,
      { lat: 0, lng: 0 }, // Destination point
      row.destination_address,
      [],
      row.route_polyline
    ),
    departureTime: new Date(row.departure_time),
    flexibleMinutes: row.flexible_minutes,
    seatsAvailable: row.seats_available,
    seatsTotal: row.seats_total,
    pricePerSeat: Number(row.price_per_seat),
    currency: row.currency,
    maxDetourMeters: row.max_detour_meters,
    maxDetourMinutes: row.max_detour_minutes,
    status: row.status as RideStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapRecurringRideRow(row: any): RecurringRide {
  return {
    id: row.id,
    userId: row.user_id,
    origin: row.origin,
    originLocation: { lat: row.origin_lat, lng: row.origin_lng },
    destination: row.destination,
    destinationLocation: { lat: row.destination_lat, lng: row.destination_lng },
    role: row.role,
    schedule: {
      days: row.schedule_days,
      time: row.schedule_time,
    },
    isActive: row.is_active,
    pricePerSeat: row.price_per_seat ? Number(row.price_per_seat) : undefined,
    seatsAvailable: row.seats_available,
    createdAt: new Date(row.created_at),
  };
}

function mapNotificationRow(row: any): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    data: row.data,
    read: row.read,
    createdAt: new Date(row.created_at),
  };
}

function mapTransactionRow(row: any): PaymentTransaction {
  return {
    id: row.id,
    bookingId: row.booking_id || '',
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    amount: Number(row.amount),
    currency: row.currency,
    provider: row.provider,
    providerRef: row.provider_ref,
    status: row.status,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

// ============================================
// MOCK DATA GENERATORS (fallback when Supabase is unconfigured)
// ============================================

function generateMockDriverRides(): DriverRide[] {
  return [
    {
      id: 'ride-1',
      driverId: 'driver-1',
      driver: {
        id: 'driver-1', email: 'sarah@example.com', displayName: 'Sarah Johnson',
        createdAt: new Date(), emailVerified: true, phoneVerified: true, idVerified: false,
        defaultRole: 'DRIVER' as UserRole, vehicleMake: 'Toyota', vehicleModel: 'Camry',
        vehicleYear: 2022, vehicleColor: 'Silver', driverRating: 4.8, driverRatingCount: 127,
      },
      route: createGeoRoute('route-1', { lat: 6.5244, lng: 3.3792 }, 'Lagos Island, Lagos',
        { lat: 6.5965, lng: 3.3421 }, 'Ikeja, Lagos',
        [{ lat: 6.55, lng: 3.36 }, { lat: 6.575, lng: 3.35 }]),
      departureTime: new Date(Date.now() + 30 * 60 * 1000),
      flexibleMinutes: 15, seatsAvailable: 3, seatsTotal: 4, pricePerSeat: 1500,
      currency: 'NGN', maxDetourMeters: 2000, maxDetourMinutes: 10,
      status: 'active' as RideStatus, createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 'ride-2',
      driverId: 'driver-2',
      driver: {
        id: 'driver-2', email: 'mike@example.com', displayName: 'Michael Okonkwo',
        createdAt: new Date(), emailVerified: true, phoneVerified: true, idVerified: true,
        defaultRole: 'DRIVER' as UserRole, vehicleMake: 'Honda', vehicleModel: 'Accord',
        vehicleYear: 2021, vehicleColor: 'Black', driverRating: 4.9, driverRatingCount: 256,
      },
      route: createGeoRoute('route-2', { lat: 6.4541, lng: 3.3947 }, 'Victoria Island, Lagos',
        { lat: 6.6018, lng: 3.3515 }, 'Murtala Muhammed Airport, Lagos',
        [{ lat: 6.5, lng: 3.375 }, { lat: 6.55, lng: 3.36 }]),
      departureTime: new Date(Date.now() + 45 * 60 * 1000),
      flexibleMinutes: 20, seatsAvailable: 2, seatsTotal: 4, pricePerSeat: 2500,
      currency: 'NGN', maxDetourMeters: 3000, maxDetourMinutes: 15,
      status: 'active' as RideStatus, createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 'ride-3',
      driverId: 'driver-3',
      driver: {
        id: 'driver-3', email: 'ada@example.com', displayName: 'Adaeze Nwosu',
        createdAt: new Date(), emailVerified: true, phoneVerified: false, idVerified: false,
        defaultRole: 'DRIVER' as UserRole, vehicleMake: 'Hyundai', vehicleModel: 'Elantra',
        vehicleYear: 2020, vehicleColor: 'White', driverRating: 4.6, driverRatingCount: 89,
      },
      route: createGeoRoute('route-3', { lat: 6.4355, lng: 3.4106 }, 'Lekki Phase 1, Lagos',
        { lat: 6.5244, lng: 3.3792 }, 'Lagos Island, Lagos', []),
      departureTime: new Date(Date.now() + 60 * 60 * 1000),
      flexibleMinutes: 10, seatsAvailable: 1, seatsTotal: 3, pricePerSeat: 1200,
      currency: 'NGN', maxDetourMeters: 1500, maxDetourMinutes: 8,
      status: 'active' as RideStatus, createdAt: new Date(), updatedAt: new Date(),
    },
  ];
}

function generateMockActiveRides(): ActiveRide[] {
  return [{
    id: 'user-ride-1',
    driverId: 'current-user',
    route: createGeoRoute('route-user-1', { lat: 6.5244, lng: 3.3792 }, 'Victoria Island, Lagos',
      { lat: 6.5965, lng: 3.3421 }, 'Ikeja GRA, Lagos', []),
    departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    flexibleMinutes: 15, seatsAvailable: 2, seatsTotal: 4, pricePerSeat: 1500,
    currency: 'NGN', maxDetourMeters: 2000, maxDetourMinutes: 10,
    status: 'active' as RideStatus, createdAt: new Date(), updatedAt: new Date(),
    matchedRiders: [
      { id: 'rider-1', name: 'Chukwuemeka A.', rating: 4.8, pickupAddress: 'Lekki Phase 1', dropoffAddress: 'Allen Avenue', status: 'accepted' },
      { id: 'rider-2', name: 'Blessing O.', rating: 4.9, pickupAddress: 'Admiralty Way', dropoffAddress: 'Computer Village', status: 'pending' },
    ],
  }];
}

function generateMockHistory(): RideHistoryEntry[] {
  const origins = ['Lagos Island', 'Ikeja', 'Victoria Island', 'Lekki', 'Yaba'];
  const destinations = ['Surulere', 'Ikoyi', 'Ajah', 'Maryland', 'Obalende'];
  const names = ['Adaeze O.', 'Chidi M.', 'Fatima B.', 'Emmanuel K.', 'Grace A.'];

  return Array.from({ length: 12 }, (_, i) => {
    const isDriver = i % 2 === 0;
    const distanceKm = (i * 3 + 5) % 30 + 5;
    const basePrice = distanceKm * 150;

    return {
      id: `ride-${i + 1}`,
      date: new Date(Date.now() - (i * 2 + 1) * 24 * 60 * 60 * 1000),
      origin: origins[i % origins.length],
      destination: destinations[i % destinations.length],
      role: isDriver ? 'driver' as const : 'rider' as const,
      status: i === 3 ? 'cancelled' as const : 'completed' as const,
      price: basePrice,
      currency: 'NGN',
      distanceKm,
      durationMinutes: Math.floor(distanceKm * 3.5),
      partnerName: names[i % names.length],
      partnerRating: 4 + (i % 2),
      ratingGiven: i % 3 !== 0 ? 4 + (i % 2) : undefined,
      co2SavedKg: distanceKm * 0.12,
    };
  });
}

function generateMockRecurringRides(): RecurringRide[] {
  return [{
    id: 'recurring-1',
    userId: 'current-user',
    origin: 'Lekki Phase 1',
    originLocation: { lat: 6.4389, lng: 3.4732 },
    destination: 'Victoria Island',
    destinationLocation: { lat: 6.4281, lng: 3.4219 },
    role: 'rider',
    schedule: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], time: '08:00' },
    isActive: true,
    createdAt: new Date(),
  }];
}

function generateMockNotifications(): UserNotification[] {
  const now = new Date();
  return [
    { id: 'notif-1', userId: 'current-user', type: 'ride_match' as NotificationType, title: 'New Ride Match!', message: 'Chidi is heading to your destination in 15 minutes', data: { rideId: 'ride-123' }, read: false, createdAt: new Date(now.getTime() - 5 * 60 * 1000) },
    { id: 'notif-2', userId: 'current-user', type: 'booking_confirmed' as NotificationType, title: 'Booking Confirmed', message: 'Your ride with Adaeze is confirmed for 9:00 AM', data: { bookingId: 'booking-456' }, read: false, createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
    { id: 'notif-3', userId: 'current-user', type: 'driver_arriving' as NotificationType, title: 'Driver Arriving', message: 'Emmanuel is 3 minutes away', data: { bookingId: 'booking-789' }, read: true, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'notif-4', userId: 'current-user', type: 'payment_received' as NotificationType, title: 'Payment Received', message: 'You received ₦2,500 from Grace for your ride', data: { amount: 2500, currency: 'NGN' }, read: true, createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    { id: 'notif-5', userId: 'current-user', type: 'rating_received' as NotificationType, title: 'New Rating', message: 'Fatima gave you a 5-star rating!', data: { rating: 5 }, read: true, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  ];
}

function generateMockTransactions(): PaymentTransaction[] {
  const now = new Date();
  return [
    { id: 'txn-1', bookingId: 'booking-123', fromUserId: 'rider-1', toUserId: 'current-user', amount: 2500, currency: 'NGN', provider: 'paystack' as const, providerRef: 'PAY_xxx123', status: 'completed' as const, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { id: 'txn-2', bookingId: 'booking-456', fromUserId: 'current-user', toUserId: 'driver-1', amount: 1800, currency: 'NGN', provider: 'paystack' as const, providerRef: 'PAY_xxx456', status: 'completed' as const, createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    { id: 'txn-3', bookingId: 'booking-789', fromUserId: 'rider-2', toUserId: 'current-user', amount: 3200, currency: 'NGN', provider: 'paystack' as const, providerRef: 'PAY_xxx789', status: 'escrow' as const, createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
  ];
}

function generateMockWallet(userId: string): Wallet {
  return {
    userId,
    balance: 5700,
    currency: 'NGN',
    lastUpdated: new Date(),
  };
}
