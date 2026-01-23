/**
 * useRealTimeBooking Hook
 * Provides real-time updates for booking status and driver location during active rides
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Booking, BookingStatus, GeoPoint, LiveLocation, RideTracking } from '../types';
import { calculateDistance, estimateTravelTime } from '../services/geoService';

// ============================================
// TYPES
// ============================================

interface UseRealTimeBookingReturn {
  booking: Booking | null;
  driverLocation: LiveLocation | null;
  etaToPickup: number | null;
  etaToDropoff: number | null;
  distanceToPickup: number | null;
  isConnected: boolean;
  error: string | null;

  // Methods
  updateBookingStatus: (status: BookingStatus) => Promise<void>;
  sendDriverLocation: (location: GeoPoint, heading?: number, speed?: number) => void;
}

interface UseRealTimeBookingOptions {
  bookingId: string;
  isDriver?: boolean;
  onStatusChange?: (status: BookingStatus) => void;
  onDriverArrival?: () => void;
}

// ============================================
// HOOK
// ============================================

export function useRealTimeBooking({
  bookingId,
  isDriver = false,
  onStatusChange,
  onDriverArrival,
}: UseRealTimeBookingOptions): UseRealTimeBookingReturn {
  // State
  const [booking, setBooking] = useState<Booking | null>(null);
  const [driverLocation, setDriverLocation] = useState<LiveLocation | null>(null);
  const [etaToPickup, setEtaToPickup] = useState<number | null>(null);
  const [etaToDropoff, setEtaToDropoff] = useState<number | null>(null);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const bookingChannelRef = useRef<RealtimeChannel | null>(null);
  const locationChannelRef = useRef<RealtimeChannel | null>(null);
  const lastStatusRef = useRef<BookingStatus | null>(null);

  // Fetch initial booking data
  const fetchBooking = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          ride:rides(*),
          rider:users!rider_id(*)
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        const bookingData: Booking = {
          id: data.id,
          rideId: data.ride_id,
          riderId: data.rider_id,
          pickupPoint: { lat: data.pickup_lat, lng: data.pickup_lng },
          pickupAddress: data.pickup_address,
          dropoffPoint: { lat: data.dropoff_lat, lng: data.dropoff_lng },
          dropoffAddress: data.dropoff_address,
          detourMeters: data.detour_meters,
          detourMinutes: data.detour_minutes,
          price: data.price,
          currency: data.currency,
          status: data.status as BookingStatus,
          paymentStatus: data.payment_status,
          paymentMethod: data.payment_method,
          riderConfirmedPayment: data.rider_confirmed_payment,
          driverConfirmedPayment: data.driver_confirmed_payment,
          requestedAt: new Date(data.requested_at),
          acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
          pickupAt: data.pickup_at ? new Date(data.pickup_at) : undefined,
          dropoffAt: data.dropoff_at ? new Date(data.dropoff_at) : undefined,
          completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        };
        setBooking(bookingData);
        lastStatusRef.current = bookingData.status;
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Failed to fetch booking details');
    }
  }, [bookingId]);

  // Subscribe to booking updates
  useEffect(() => {
    if (!bookingId) return;

    fetchBooking();

    // Subscribe to booking changes
    bookingChannelRef.current = supabase
      .channel(`booking:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const newStatus = newData.status as BookingStatus;

          setBooking((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: newStatus,
              paymentStatus: newData.payment_status,
              riderConfirmedPayment: newData.rider_confirmed_payment,
              driverConfirmedPayment: newData.driver_confirmed_payment,
              acceptedAt: newData.accepted_at ? new Date(newData.accepted_at) : prev.acceptedAt,
              pickupAt: newData.pickup_at ? new Date(newData.pickup_at) : prev.pickupAt,
              dropoffAt: newData.dropoff_at ? new Date(newData.dropoff_at) : prev.dropoffAt,
              completedAt: newData.completed_at ? new Date(newData.completed_at) : prev.completedAt,
            };
          });

          // Trigger status change callback
          if (newStatus !== lastStatusRef.current) {
            lastStatusRef.current = newStatus;
            onStatusChange?.(newStatus);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setError('Failed to connect to real-time updates');
        }
      });

    // Subscribe to driver location broadcasts
    locationChannelRef.current = supabase
      .channel(`location:${bookingId}`)
      .on('broadcast', { event: 'driver_location' }, (payload) => {
        const location: LiveLocation = {
          point: payload.payload.location,
          heading: payload.payload.heading,
          speed: payload.payload.speed,
          timestamp: new Date(payload.payload.timestamp),
        };
        setDriverLocation(location);
      })
      .subscribe();

    return () => {
      bookingChannelRef.current?.unsubscribe();
      locationChannelRef.current?.unsubscribe();
    };
  }, [bookingId, fetchBooking, onStatusChange]);

  // Calculate ETA when driver location updates
  useEffect(() => {
    if (!driverLocation || !booking) return;

    // Calculate distance to pickup
    const pickupDistance = calculateDistance(driverLocation.point, booking.pickupPoint);
    setDistanceToPickup(pickupDistance);

    // Calculate ETA to pickup
    const avgSpeed = driverLocation.speed ? driverLocation.speed * 3.6 : 30; // Convert m/s to km/h, default 30
    const etaPickup = estimateTravelTime(driverLocation.point, booking.pickupPoint, avgSpeed);
    setEtaToPickup(Math.ceil(etaPickup));

    // Calculate ETA to dropoff (via pickup if not picked up yet)
    if (booking.status === 'accepted') {
      // Driver hasn't picked up yet
      const pickupToDropoff = estimateTravelTime(booking.pickupPoint, booking.dropoffPoint, avgSpeed);
      setEtaToDropoff(Math.ceil(etaPickup + pickupToDropoff));
    } else if (booking.status === 'picked_up') {
      // Driver has picked up, calculate direct to dropoff
      const etaDropoff = estimateTravelTime(driverLocation.point, booking.dropoffPoint, avgSpeed);
      setEtaToDropoff(Math.ceil(etaDropoff));
    }

    // Trigger arrival callback when driver is within 100m
    if (pickupDistance < 100 && booking.status === 'accepted') {
      onDriverArrival?.();
    }
  }, [driverLocation, booking, onDriverArrival]);

  // Update booking status
  const updateBookingStatus = useCallback(async (status: BookingStatus) => {
    if (!bookingId) return;

    try {
      const updates: Record<string, any> = { status };

      // Add timestamp based on status
      switch (status) {
        case 'accepted':
          updates.accepted_at = new Date().toISOString();
          break;
        case 'picked_up':
          updates.pickup_at = new Date().toISOString();
          break;
        case 'dropped_off':
          updates.dropoff_at = new Date().toISOString();
          break;
        case 'completed':
          updates.completed_at = new Date().toISOString();
          break;
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status');
    }
  }, [bookingId]);

  // Send driver location (for drivers)
  const sendDriverLocation = useCallback(
    (location: GeoPoint, heading?: number, speed?: number) => {
      if (!isDriver || !locationChannelRef.current) return;

      locationChannelRef.current.send({
        type: 'broadcast',
        event: 'driver_location',
        payload: {
          location,
          heading,
          speed,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [isDriver]
  );

  return {
    booking,
    driverLocation,
    etaToPickup,
    etaToDropoff,
    distanceToPickup,
    isConnected,
    error,
    updateBookingStatus,
    sendDriverLocation,
  };
}

// ============================================
// DRIVER LOCATION TRACKER HOOK
// ============================================

interface UseDriverLocationTrackerReturn {
  isTracking: boolean;
  currentLocation: GeoPoint | null;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

interface UseDriverLocationTrackerOptions {
  bookingId: string;
  onLocationUpdate?: (location: GeoPoint) => void;
  updateInterval?: number; // ms
}

export function useDriverLocationTracker({
  bookingId,
  onLocationUpdate,
  updateInterval = 5000, // Default 5 seconds
}: UseDriverLocationTrackerOptions): UseDriverLocationTrackerReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentRef = useRef<number>(0);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    // Setup broadcast channel
    channelRef.current = supabase.channel(`location:${bookingId}`);
    channelRef.current.subscribe();

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location: GeoPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);

        // Throttle broadcasts
        const now = Date.now();
        if (now - lastSentRef.current >= updateInterval) {
          lastSentRef.current = now;

          // Broadcast location
          channelRef.current?.send({
            type: 'broadcast',
            event: 'driver_location',
            payload: {
              location,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: new Date().toISOString(),
            },
          });

          onLocationUpdate?.(location);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setIsTracking(true);
    setError(null);
  }, [bookingId, updateInterval, onLocationUpdate]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    channelRef.current?.unsubscribe();
    channelRef.current = null;

    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking,
  };
}

export default useRealTimeBooking;
