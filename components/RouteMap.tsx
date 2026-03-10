/**
 * RouteMap Component
 * Displays a route on Google Maps with origin, destination, and optional markers
 */

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Map as MapIcon } from 'lucide-react';
import { Button } from './ui/button';
import {
  GoogleMap,
  useJsApiLoader,
  Polyline,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import type { GeoPoint, GeoRoute, LiveLocation } from '../types';
import { decodePolyline } from '../services/geoService';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from '../lib/constants';

// ============================================
// TYPES
// ============================================

interface RouteMapProps {
  route?: GeoRoute;
  pickupPoint?: GeoPoint;
  dropoffPoint?: GeoPoint;
  driverLocation?: LiveLocation;
  userLocation?: GeoPoint;
  height?: string;
  showTraffic?: boolean;
  interactive?: boolean;
  onMapClick?: (point: GeoPoint) => void;
  onPickupSelect?: (point: GeoPoint) => void;
  onDropoffSelect?: (point: GeoPoint) => void;
  className?: string;
}

type SelectionMode = 'none' | 'pickup' | 'dropoff';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_CENTER: GeoPoint = { lat: 9.0820, lng: 8.6753 }; // Nigeria center

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultMapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

// ============================================
// MARKER ICONS
// ============================================

const PIN_PATH = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';
const CAR_PATH = 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z';

const createPinIcon = (fillColor: string) => ({
  path: PIN_PATH,
  fillColor,
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 1.5,
});

// MARKER_ICONS must be a function (not a constant) because google.maps is not
// available at module evaluation time — it only exists after useJsApiLoader fires.
const getMarkerIcons = () => ({
  origin: createPinIcon('#10B981'),
  destination: createPinIcon('#EF4444'),
  pickup: createPinIcon('#3B82F6'),
  dropoff: createPinIcon('#8B5CF6'),
  driver: {
    path: CAR_PATH,
    fillColor: '#F59E0B',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1,
    scale: 1.5,
  },
  user: {
    path: 0, // 0 = google.maps.SymbolPath.CIRCLE (numeric value, no runtime dependency)
    fillColor: '#6366F1',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8,
  },
});

// ============================================
// COMPONENT
// ============================================

const RouteMap: React.FC<RouteMapProps> = ({
  route,
  pickupPoint,
  dropoffPoint,
  driverLocation,
  userLocation,
  height = '300px',
  showTraffic = false,
  interactive = false,
  onMapClick,
  onPickupSelect,
  onDropoffSelect,
  className = '',
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Memoize marker icons — computed once after Google Maps loads
  const markerIcons = useMemo(() => isLoaded ? getMarkerIcons() : null, [isLoaded]);

  // Decode polyline to get route path
  const routePath = route ? decodePolyline(route.polyline) : [];

  // Calculate map bounds
  const fitMapToBounds = useCallback(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();

    if (route) {
      bounds.extend(new google.maps.LatLng(route.origin.lat, route.origin.lng));
      bounds.extend(new google.maps.LatLng(route.destination.lat, route.destination.lng));
    }

    if (pickupPoint) {
      bounds.extend(new google.maps.LatLng(pickupPoint.lat, pickupPoint.lng));
    }

    if (dropoffPoint) {
      bounds.extend(new google.maps.LatLng(dropoffPoint.lat, dropoffPoint.lng));
    }

    if (userLocation) {
      bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
    }

    if (driverLocation) {
      bounds.extend(new google.maps.LatLng(driverLocation.point.lat, driverLocation.point.lng));
    }

    // Only fit bounds if we have points
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, route, pickupPoint, dropoffPoint, userLocation, driverLocation]);

  // Fit bounds when data changes
  useEffect(() => {
    fitMapToBounds();
  }, [fitMapToBounds]);

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle map click
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !interactive) return;

      const point: GeoPoint = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      if (selectionMode === 'pickup' && onPickupSelect) {
        onPickupSelect(point);
        setSelectionMode('none');
      } else if (selectionMode === 'dropoff' && onDropoffSelect) {
        onDropoffSelect(point);
        setSelectionMode('none');
      } else if (onMapClick) {
        onMapClick(point);
      }
    },
    [interactive, selectionMode, onMapClick, onPickupSelect, onDropoffSelect]
  );

  // Get center point
  const getCenter = (): GeoPoint => {
    if (route) {
      return {
        lat: (route.origin.lat + route.destination.lat) / 2,
        lng: (route.origin.lng + route.destination.lng) / 2,
      };
    }
    if (userLocation) return userLocation;
    return DEFAULT_CENTER;
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-xl ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading map...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 rounded-xl ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <span className="text-sm text-red-600">Failed to load map</span>
          <span className="text-xs text-red-400">Check your API key</span>
        </div>
      </div>
    );
  }

  // No API key state
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div
        className={`flex items-center justify-center bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 ${className}`}
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <MapIcon className="w-8 h-8 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">Map Preview</span>
          <span className="text-xs text-amber-600">Add Google Maps API key to enable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={getCenter()}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          ...defaultMapOptions,
          draggable: interactive,
          scrollwheel: interactive,
        }}
      >
        {/* Route polyline */}
        {routePath.length > 0 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor: '#4F46E5',
              strokeWeight: 4,
              strokeOpacity: 0.8,
            }}
          />
        )}

        {/* Origin marker */}
        {route && (
          <Marker
            position={route.origin}
            icon={markerIcons!.origin}
            onClick={() => setSelectedMarker('origin')}
          >
            {selectedMarker === 'origin' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm">
                  <strong>Start</strong>
                  <p className="text-gray-600">{route.originAddress}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* Destination marker */}
        {route && (
          <Marker
            position={route.destination}
            icon={markerIcons!.destination}
            onClick={() => setSelectedMarker('destination')}
          >
            {selectedMarker === 'destination' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm">
                  <strong>End</strong>
                  <p className="text-gray-600">{route.destinationAddress}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* Pickup point marker */}
        {pickupPoint && (
          <Marker
            position={pickupPoint}
            icon={markerIcons!.pickup}
            onClick={() => setSelectedMarker('pickup')}
          >
            {selectedMarker === 'pickup' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm">
                  <strong>Your Pickup</strong>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* Dropoff point marker */}
        {dropoffPoint && (
          <Marker
            position={dropoffPoint}
            icon={markerIcons!.dropoff}
            onClick={() => setSelectedMarker('dropoff')}
          >
            {selectedMarker === 'dropoff' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm">
                  <strong>Your Dropoff</strong>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* Driver location marker (for live tracking) */}
        {driverLocation && (
          <Marker
            position={driverLocation.point}
            icon={markerIcons!.driver}
            onClick={() => setSelectedMarker('driver')}
          >
            {selectedMarker === 'driver' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm">
                  <strong>Driver</strong>
                  <p className="text-gray-600">On the way...</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={markerIcons!.user}
            onClick={() => setSelectedMarker('user')}
          >
            {selectedMarker === 'user' && (
              <InfoWindow onCloseClick={() => setSelectedMarker(null)}>
                <div className="text-sm">
                  <strong>You are here</strong>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}
      </GoogleMap>

      {/* Selection mode indicator */}
      {interactive && selectionMode !== 'none' && (
        <div className="absolute top-2 left-2 right-2 bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
          {selectionMode === 'pickup'
            ? 'Tap on the map to set pickup point'
            : 'Tap on the map to set dropoff point'}
          <Button
            variant="link"
            onClick={() => setSelectionMode('none')}
            className="ml-2 text-indigo-200 hover:text-white p-0 h-auto"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Selection controls */}
      {interactive && selectionMode === 'none' && (onPickupSelect || onDropoffSelect) && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
          {onPickupSelect && (
            <Button
              onClick={() => setSelectionMode('pickup')}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              Set Pickup
            </Button>
          )}
          {onDropoffSelect && (
            <Button
              onClick={() => setSelectionMode('dropoff')}
              size="sm"
              className="flex-1 bg-purple-600 hover:bg-purple-700 shadow-lg"
            >
              Set Dropoff
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteMap;
