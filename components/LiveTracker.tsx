/**
 * LiveTracker Component
 * Real-time driver location tracking during active rides
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X, User, Phone } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { useRealTimeBooking, useDriverLocationTracker } from '../hooks/useRealTimeBooking';
import type { GeoPoint, Booking } from '../types';

// ============================================
// TYPES
// ============================================

interface LiveTrackerProps {
  bookingId: string;
  isDriver?: boolean;
  onClose?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 6.5244,
  lng: 3.3792,
};

// ============================================
// STATUS DISPLAY
// ============================================

const StatusBadge: React.FC<{ status: Booking['status'] }> = ({ status }) => {
  const statusConfig: Record<Booking['status'], { label: string; color: string; icon: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    accepted: { label: 'Accepted', color: 'bg-blue-100 text-blue-800', icon: '✓' },
    driver_arrived: { label: 'Driver Arrived', color: 'bg-green-100 text-green-800', icon: '📍' },
    picked_up: { label: 'In Transit', color: 'bg-indigo-100 text-indigo-800', icon: '🚗' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '✗' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

// ============================================
// COMPONENT
// ============================================

const LiveTracker: React.FC<LiveTrackerProps> = ({ bookingId, isDriver = false, onClose }) => {
  const { booking, driverLocation, eta, connectionStatus } = useRealTimeBooking(bookingId);
  const { startTracking, stopTracking, isTracking } = useDriverLocationTracker(bookingId);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.warn('Geolocation error:', error.message),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Auto-start tracking for drivers
  useEffect(() => {
    if (isDriver && booking?.status === 'picked_up' && !isTracking) {
      startTracking();
    }

    return () => {
      if (isDriver && isTracking) {
        stopTracking();
      }
    };
  }, [isDriver, booking?.status, isTracking, startTracking, stopTracking]);

  // Fit map to show all markers
  const fitMapBounds = useCallback(() => {
    if (!map || !booking) return;

    const bounds = new google.maps.LatLngBounds();

    if (driverLocation) {
      bounds.extend(driverLocation);
    }

    if (booking.pickup) {
      bounds.extend(booking.pickup);
    }

    if (booking.dropoff) {
      bounds.extend(booking.dropoff);
    }

    if (userLocation) {
      bounds.extend(userLocation);
    }

    map.fitBounds(bounds, { padding: 50 });
  }, [map, booking, driverLocation, userLocation]);

  useEffect(() => {
    fitMapBounds();
  }, [fitMapBounds]);

  // Fallback for no API key
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Unavailable</h3>
            <p className="text-gray-500 text-sm mb-4">
              Add a Google Maps API key to enable live tracking.
            </p>
            {booking && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <StatusBadge status={booking.status} />
                {eta && (
                  <p className="text-sm text-gray-600 mt-2">
                    ETA: {eta} minutes
                  </p>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900">Live Tracking</h2>
            <p className="text-xs text-gray-500">
              {connectionStatus === 'connected' ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              ) : connectionStatus === 'connecting' ? (
                'Connecting...'
              ) : (
                <span className="text-amber-600">Reconnecting...</span>
              )}
            </p>
          </div>
        </div>

        {booking && <StatusBadge status={booking.status} />}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={driverLocation || booking?.pickup || defaultCenter}
          zoom={14}
          onLoad={setMap}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          }}
        >
          {/* Driver location marker */}
          {driverLocation && (
            <Marker
              position={driverLocation}
              icon={{
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: '#4F46E5',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                rotation: 0,
              }}
              title="Driver"
            />
          )}

          {/* Pickup marker */}
          {booking?.pickup && (
            <Marker
              position={booking.pickup}
              icon={{
                url: 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                    <circle cx="12" cy="12" r="10" fill="#22C55E" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                  </svg>
                `),
              }}
              title="Pickup"
            />
          )}

          {/* Dropoff marker */}
          {booking?.dropoff && (
            <Marker
              position={booking.dropoff}
              icon={{
                url: 'data:image/svg+xml,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                    <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
                    <rect x="8" y="8" width="8" height="8" fill="#ffffff" rx="1"/>
                  </svg>
                `),
              }}
              title="Dropoff"
            />
          )}

          {/* User location (if rider) */}
          {!isDriver && userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              title="You"
            />
          )}

          {/* Route line from driver to pickup (if not yet picked up) */}
          {driverLocation && booking?.pickup && booking.status !== 'picked_up' && booking.status !== 'completed' && (
            <Polyline
              path={[driverLocation, booking.pickup]}
              options={{
                strokeColor: '#4F46E5',
                strokeWeight: 3,
                strokeOpacity: 0.8,
                geodesic: true,
              }}
            />
          )}

          {/* Route line from pickup to dropoff */}
          {booking?.pickup && booking?.dropoff && (
            <Polyline
              path={[booking.pickup, booking.dropoff]}
              options={{
                strokeColor: '#22C55E',
                strokeWeight: 3,
                strokeOpacity: 0.6,
                geodesic: true,
              }}
            />
          )}
        </GoogleMap>

        {/* ETA overlay */}
        {eta && (
          <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2">
            <p className="text-sm text-gray-500">Estimated arrival</p>
            <p className="text-2xl font-bold text-indigo-600">{eta} min</p>
          </div>
        )}
      </div>

      {/* Bottom card */}
      <div className="bg-white rounded-t-3xl shadow-lg p-4">
        {booking ? (
          <div className="space-y-4">
            {/* Driver info (for rider view) */}
            {!isDriver && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Your Driver</p>
                  <p className="text-sm text-gray-500">Toyota Camry • ABC 123</p>
                </div>
                <button className="p-3 bg-green-100 rounded-full text-green-600 hover:bg-green-200 transition-colors">
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Route info */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div className="w-0.5 h-8 bg-gray-300" />
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {booking.pickupAddress || 'Pickup location'}
                  </p>
                  <div className="h-4" />
                  <p className="text-sm text-gray-900 truncate">
                    {booking.dropoffAddress || 'Dropoff location'}
                  </p>
                </div>
              </div>
            </div>

            {/* Driver tracking toggle (for driver view) */}
            {isDriver && booking.status === 'accepted' && (
              <button
                onClick={isTracking ? stopTracking : startTracking}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  isTracking
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isTracking ? 'Stop Sharing Location' : 'Start Sharing Location'}
              </button>
            )}

            {/* Action buttons based on status */}
            {booking.status === 'picked_up' && !isDriver && (
              <button className="w-full bg-red-600 text-white font-medium py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading booking details...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracker;
