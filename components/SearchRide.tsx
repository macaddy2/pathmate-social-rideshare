/**
 * SearchRide Component
 * Enhanced ride search with map-based pickup/dropoff selection and real matching
 */

import React, { useState, useMemo } from 'react';
import { getRouteInsights } from '../services/geminiService';
import { findMatchingRides, generateMatchExplanation } from '../services/matchingService';
import { createGeoRoute, formatDistance, formatDuration } from '../services/geoService';
import RatingModal from './RatingModal';
import RouteMap from './RouteMap';
import PlacesAutocomplete, { PlaceResult } from './PlacesAutocomplete';
import type { Rating, GeoPoint, DriverRide, RideRequest, RouteMatch, RideStatus, UserRole } from '../types';

// ============================================
// TYPES
// ============================================

interface SearchRideProps {
  userLocation?: GeoPoint;
  onRate: (rating: Rating) => void;
  onOpenChat: (name: string, id: string) => void;
}

interface SearchState {
  pickupAddress: string;
  pickupLocation: GeoPoint | null;
  dropoffAddress: string;
  dropoffLocation: GeoPoint | null;
}

// ============================================
// MOCK DATA (will be replaced with Supabase)
// ============================================

const generateMockDriverRides = (): DriverRide[] => {
  // Sample routes going different directions
  return [
    {
      id: 'ride-1',
      driverId: 'driver-1',
      driver: {
        id: 'driver-1',
        email: 'sarah@example.com',
        displayName: 'Sarah Johnson',
        createdAt: new Date(),
        emailVerified: true,
        phoneVerified: true,
        idVerified: false,
        defaultRole: 'DRIVER' as UserRole,
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2022,
        vehicleColor: 'Silver',
        driverRating: 4.8,
        driverRatingCount: 127,
      },
      route: createGeoRoute(
        'route-1',
        { lat: 6.5244, lng: 3.3792 }, // Lagos Island
        'Lagos Island, Lagos',
        { lat: 6.5965, lng: 3.3421 }, // Ikeja
        'Ikeja, Lagos',
        [{ lat: 6.5500, lng: 3.3600 }, { lat: 6.5750, lng: 3.3500 }]
      ),
      departureTime: new Date(Date.now() + 30 * 60 * 1000), // 30 mins from now
      flexibleMinutes: 15,
      seatsAvailable: 3,
      seatsTotal: 4,
      pricePerSeat: 1500, // NGN
      currency: 'NGN',
      maxDetourMeters: 2000,
      maxDetourMinutes: 10,
      status: 'active' as RideStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ride-2',
      driverId: 'driver-2',
      driver: {
        id: 'driver-2',
        email: 'mike@example.com',
        displayName: 'Michael Okonkwo',
        createdAt: new Date(),
        emailVerified: true,
        phoneVerified: true,
        idVerified: true,
        defaultRole: 'DRIVER' as UserRole,
        vehicleMake: 'Honda',
        vehicleModel: 'Accord',
        vehicleYear: 2021,
        vehicleColor: 'Black',
        driverRating: 4.9,
        driverRatingCount: 256,
      },
      route: createGeoRoute(
        'route-2',
        { lat: 6.4541, lng: 3.3947 }, // Victoria Island
        'Victoria Island, Lagos',
        { lat: 6.6018, lng: 3.3515 }, // Airport
        'Murtala Muhammed Airport, Lagos',
        [{ lat: 6.5000, lng: 3.3750 }, { lat: 6.5500, lng: 3.3600 }]
      ),
      departureTime: new Date(Date.now() + 45 * 60 * 1000), // 45 mins from now
      flexibleMinutes: 20,
      seatsAvailable: 2,
      seatsTotal: 4,
      pricePerSeat: 2500,
      currency: 'NGN',
      maxDetourMeters: 3000,
      maxDetourMinutes: 15,
      status: 'active' as RideStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'ride-3',
      driverId: 'driver-3',
      driver: {
        id: 'driver-3',
        email: 'ada@example.com',
        displayName: 'Adaeze Nwosu',
        createdAt: new Date(),
        emailVerified: true,
        phoneVerified: false,
        idVerified: false,
        defaultRole: 'DRIVER' as UserRole,
        vehicleMake: 'Hyundai',
        vehicleModel: 'Elantra',
        vehicleYear: 2020,
        vehicleColor: 'White',
        driverRating: 4.6,
        driverRatingCount: 89,
      },
      route: createGeoRoute(
        'route-3',
        { lat: 6.4355, lng: 3.4106 }, // Lekki
        'Lekki Phase 1, Lagos',
        { lat: 6.5244, lng: 3.3792 }, // Lagos Island
        'Lagos Island, Lagos',
        []
      ),
      departureTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      flexibleMinutes: 10,
      seatsAvailable: 1,
      seatsTotal: 3,
      pricePerSeat: 1200,
      currency: 'NGN',
      maxDetourMeters: 1500,
      maxDetourMinutes: 8,
      status: 'active' as RideStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};

// ============================================
// COMPONENT
// ============================================

const SearchRide: React.FC<SearchRideProps> = ({ userLocation, onRate, onOpenChat }) => {
  // Search state
  const [search, setSearch] = useState<SearchState>({
    pickupAddress: '',
    pickupLocation: null,
    dropoffAddress: '',
    dropoffLocation: null,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<RouteMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<RouteMatch | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; links: any[] } | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetId: string;
  } | null>(null);

  // Mock data (will be replaced with Supabase query)
  const availableRides = useMemo(() => generateMockDriverRides(), []);

  // Handle pickup location selection
  const handlePickupSelect = (place: PlaceResult) => {
    setSearch((prev) => ({
      ...prev,
      pickupAddress: place.address,
      pickupLocation: place.location,
    }));
  };

  // Handle dropoff location selection
  const handleDropoffSelect = (place: PlaceResult) => {
    setSearch((prev) => ({
      ...prev,
      dropoffAddress: place.address,
      dropoffLocation: place.location,
    }));
  };

  // Handle map-based selection
  const handleMapPickupSelect = (point: GeoPoint) => {
    setSearch((prev) => ({
      ...prev,
      pickupLocation: point,
      pickupAddress: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
    }));
  };

  const handleMapDropoffSelect = (point: GeoPoint) => {
    setSearch((prev) => ({
      ...prev,
      dropoffLocation: point,
      dropoffAddress: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
    }));
  };

  // Search for matching rides
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!search.pickupAddress || !search.dropoffAddress) {
      return;
    }

    setIsLoading(true);
    setMatches([]);
    setAiAnalysis(null);
    setSelectedMatch(null);

    try {
      // Get AI insights for the route
      const insights = await getRouteInsights(
        search.pickupAddress,
        search.dropoffAddress,
        search.pickupLocation?.lat || userLocation?.lat,
        search.pickupLocation?.lng || userLocation?.lng
      );
      setAiAnalysis(insights);

      // Create ride request
      const rideRequest: RideRequest = {
        id: `request-${Date.now()}`,
        riderId: 'current-user', // Will be replaced with actual user ID
        pickup: search.pickupLocation || { lat: 6.5244, lng: 3.3792 }, // Default to Lagos
        pickupAddress: search.pickupAddress,
        dropoff: search.dropoffLocation || { lat: 6.5965, lng: 3.3421 },
        dropoffAddress: search.dropoffAddress,
        requestedTime: new Date(),
        flexibleMinutes: 30,
        currency: 'NGN',
        status: 'searching',
        createdAt: new Date(),
      };

      // Find matching rides using our algorithm
      const matchResults = await findMatchingRides(rideRequest, availableRides, {
        timeWindowMinutes: 120, // Look 2 hours ahead
        minMatchScore: 20, // Show more results for demo
      });

      setMatches(matchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle joining a ride
  const handleJoin = (match: RouteMatch) => {
    setSelectedMatch(match);
    // In a real app, this would create a booking request
    // For now, show rating modal as demonstration
    if (match.driverRide?.driver) {
      setRatingModal({
        isOpen: true,
        targetName: match.driverRide.driver.displayName,
        targetId: match.driverRide.driver.id,
      });
    }
  };

  // Format price with currency
  const formatPrice = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      NGN: '₦',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return `${symbols[currency] || currency}${amount.toLocaleString()}`;
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal(null)}
          targetName={ratingModal.targetName}
          targetId={ratingModal.targetId}
          role="DRIVER"
          onSubmit={onRate}
        />
      )}

      {/* Search Form */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Find your Route</h2>
          <button
            onClick={() => setShowMap(!showMap)}
            className={`p-2 rounded-lg transition-colors ${
              showMap ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </button>
        </div>

        {/* Map for location selection */}
        {showMap && (
          <div className="mb-4">
            <RouteMap
              height="200px"
              interactive={true}
              userLocation={userLocation}
              pickupPoint={search.pickupLocation || undefined}
              dropoffPoint={search.dropoffLocation || undefined}
              onPickupSelect={handleMapPickupSelect}
              onDropoffSelect={handleMapDropoffSelect}
            />
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Pickup Input */}
          <PlacesAutocomplete
            value={search.pickupAddress}
            onChange={(value) => setSearch((prev) => ({ ...prev, pickupAddress: value }))}
            onSelect={handlePickupSelect}
            label="PICKUP"
            placeholder="Where are you?"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            }
          />

          {/* Dropoff Input */}
          <PlacesAutocomplete
            value={search.dropoffAddress}
            onChange={(value) => setSearch((prev) => ({ ...prev, dropoffAddress: value }))}
            onSelect={handleDropoffSelect}
            label="DROPOFF"
            placeholder="Where are you going?"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />

          <button
            type="submit"
            disabled={isLoading || !search.pickupAddress || !search.dropoffAddress}
            className="w-full bg-indigo-600 text-white font-bold p-4 rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finding matches...
              </span>
            ) : (
              'Find Matches'
            )}
          </button>
        </form>
      </div>

      {/* AI Insights */}
      {aiAnalysis && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm animate-fadeIn">
          <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            PathMate Smart Insights
          </h3>
          <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
            {aiAnalysis.text}
          </p>
          {aiAnalysis.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {aiAnalysis.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-full shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Match Results */}
      {matches.length > 0 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">
              {matches.length} driver{matches.length !== 1 ? 's' : ''} heading your way
            </h3>
            <span className="text-xs text-gray-500">Sorted by match quality</span>
          </div>

          {matches.map((match) => {
            const ride = match.driverRide;
            const driver = ride?.driver;
            if (!ride || !driver) return null;

            return (
              <div
                key={match.driverRideId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-indigo-300 transition-all"
              >
                {/* Match score indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                  <div
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      match.matchScore >= 70
                        ? 'bg-green-100 text-green-700'
                        : match.matchScore >= 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {match.matchScore}% match
                  </div>
                  <span className="text-xs text-gray-500">
                    {generateMatchExplanation(match)}
                  </span>
                </div>

                {/* Driver info */}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {driver.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{driver.displayName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {driver.driverRating?.toFixed(1)}
                          </span>
                          <span>•</span>
                          <span>{ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? 's' : ''} left</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {ride.route.originAddress.split(',')[0]} → {ride.route.destinationAddress.split(',')[0]}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-indigo-600">
                        {formatPrice(match.price, match.currency)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Departs {formatTime(ride.departureTime)}
                      </div>
                    </div>
                  </div>

                  {/* Route details */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-gray-500">Pickup ETA</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {formatTime(match.estimatedPickupTime)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Route overlap</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {match.overlapPercentage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Driver detour</div>
                      <div className="text-sm font-semibold text-gray-800">
                        +{match.detourMinutes} min
                      </div>
                    </div>
                  </div>

                  {/* Vehicle info */}
                  {driver.vehicleMake && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {driver.vehicleColor} {driver.vehicleMake} {driver.vehicleModel}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => onOpenChat(driver.displayName, driver.id)}
                      className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <span className="text-sm font-medium">Chat</span>
                    </button>
                    <button
                      onClick={() => handleJoin(match)}
                      className="flex-1 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm font-medium">Request to Join</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!isLoading && matches.length === 0 && (search.pickupAddress || search.dropoffAddress) && aiAnalysis && (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h3 className="font-bold text-gray-800 mb-2">No drivers found</h3>
          <p className="text-sm text-gray-500">
            No one is heading your direction right now. Try again later or post your route as a rider to get notified when a match is available.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 font-medium">Finding drivers going your way...</p>
        </div>
      )}
    </div>
  );
};

export default SearchRide;
