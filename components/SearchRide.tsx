/**
 * SearchRide Component
 * Enhanced ride search with map-based pickup/dropoff selection and real matching
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Map, MapPin, MapPinned, Info, Star, ChevronDown, MessageCircle, Check, SlidersHorizontal } from 'lucide-react';
import { getRouteInsights } from '../services/geminiService';
import { findMatchingRides, generateMatchExplanation } from '../services/matchingService';
import { fetchAvailableRides } from '../services/dataService';
import BookingFlow from './BookingFlow';
import RouteMap from './RouteMap';
import PlacesAutocomplete, { PlaceResult } from './PlacesAutocomplete';
import type { GeoPoint, DriverRide, RideRequest, RouteMatch } from '../types';
import { formatCurrency, formatTime } from '../lib/formatters';
import { useLocationStore } from '../stores/useLocationStore';
import { useChatStore } from '../stores/useChatStore';
import { useSearchStore } from '../stores/useSearchStore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';


const SearchRide: React.FC = () => {
  const { userLocation } = useLocationStore();
  const navigate = useNavigate();
  const { openChat: onOpenChat } = useChatStore();
  const { search, setSearch, clearSearch } = useSearchStore();

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<RouteMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<RouteMatch | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; links: any[] } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [filter, setFilter] = useState<'best' | 'price' | 'departure' | 'rating'>('best');

  const [availableRides, setAvailableRides] = useState<DriverRide[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);

  useEffect(() => {
    fetchAvailableRides().then(rides => {
      setAvailableRides(rides);
      setRidesLoading(false);
    });
  }, []);

  // Handle pickup location selection
  const handlePickupSelect = (place: PlaceResult) => {
    setSearch({
      ...search,
      pickupAddress: place.address,
      pickupLocation: place.location,
    });
  };

  // Handle dropoff location selection
  const handleDropoffSelect = (place: PlaceResult) => {
    setSearch({
      ...search,
      dropoffAddress: place.address,
      dropoffLocation: place.location,
    });
  };

  // Handle map-based selection
  const handleMapPickupSelect = (point: GeoPoint) => {
    setSearch({
      ...search,
      pickupLocation: point,
      pickupAddress: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
    });
  };

  const handleMapDropoffSelect = (point: GeoPoint) => {
    setSearch({
      ...search,
      dropoffLocation: point,
      dropoffAddress: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
    });
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

      // Run AI insights and ride matching in parallel
      const [insights, matchResults] = await Promise.all([
        getRouteInsights(
          search.pickupAddress,
          search.dropoffAddress,
          search.pickupLocation?.lat || userLocation?.lat,
          search.pickupLocation?.lng || userLocation?.lng
        ),
        findMatchingRides(rideRequest, availableRides, {
          timeWindowMinutes: 120, // Look 2 hours ahead
          minMatchScore: 20, // Show more results for demo
        }),
      ]);

      setAiAnalysis(insights);
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
  };

  const filteredMatches = useMemo(() => {
    const nextMatches = [...matches];
    if (filter === 'price') return nextMatches.sort((a, b) => a.price - b.price);
    if (filter === 'departure') {
      return nextMatches.sort((a, b) => a.estimatedPickupTime.getTime() - b.estimatedPickupTime.getTime());
    }
    if (filter === 'rating') {
      return nextMatches.sort(
        (a, b) => (b.driverRide?.driver?.driverRating || 0) - (a.driverRide?.driver?.driverRating || 0),
      );
    }
    return nextMatches.sort((a, b) => b.matchScore - a.matchScore);
  }, [filter, matches]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <BookingFlow
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onOpenChat={onOpenChat}
        onViewTrips={() => {
          setSelectedMatch(null);
          navigate('/trips');
        }}
      />

      {/* Search Form */}
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Find your Route</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMap(!showMap)}
            className={`rounded-lg ${
              showMap ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Map className="w-5 h-5" />
          </Button>
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
            onChange={(value) => setSearch({ ...search, pickupAddress: value })}
            onSelect={handlePickupSelect}
            label="PICKUP"
            placeholder="Where are you?"
            icon={
              <MapPin className="w-5 h-5" />
            }
          />

          {/* Dropoff Input */}
          <PlacesAutocomplete
            value={search.dropoffAddress}
            onChange={(value) => setSearch({ ...search, dropoffAddress: value })}
            onSelect={handleDropoffSelect}
            label="DROPOFF"
            placeholder="Where are you going?"
            icon={
              <MapPinned className="w-5 h-5" />
            }
          />

          <Button
            type="submit"
            disabled={isLoading || !search.pickupAddress || !search.dropoffAddress}
            size="lg"
            className="w-full font-bold p-4 rounded-xl shadow-lg active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finding matches...
              </span>
            ) : (
              'Find Matches'
            )}
          </Button>
        </form>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {aiAnalysis && (
        <Card className="bg-blue-50 border-blue-100 rounded-2xl shadow-sm animate-fadeIn">
          <CardContent className="p-5">
          <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
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
          </CardContent>
        </Card>
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

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-500">
              <SlidersHorizontal className="h-4 w-4" />
              Sort
            </span>
            {([
              ['best', 'Best match'],
              ['price', 'Lowest price'],
              ['departure', 'Soonest'],
              ['rating', 'Top rated'],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? 'default' : 'outline'}
                onClick={() => setFilter(value)}
                className={`h-9 shrink-0 rounded-full px-3 text-xs font-bold ${
                  filter === value ? 'bg-blue-700 hover:bg-blue-800' : 'bg-white'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>

          {filteredMatches.map((match) => {
            const ride = match.driverRide;
            const driver = ride?.driver;
            if (!ride || !driver) return null;

            return (
              <Card
                key={match.driverRideId}
                className="rounded-2xl overflow-hidden hover:border-indigo-300 transition-all"
              >
                {/* Match score indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                  <Badge
                    variant={match.matchScore >= 70 ? 'success' : match.matchScore >= 50 ? 'warning' : 'secondary'}
                    className="text-xs font-bold"
                  >
                    {match.matchScore}% match
                  </Badge>
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
                            <Star className="w-3 h-3 text-yellow-500" fill="currentColor" />
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
                        {formatCurrency(match.price, match.currency)}
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
                      <ChevronDown className="w-4 h-4" />
                      {driver.vehicleColor} {driver.vehicleMake} {driver.vehicleModel}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onOpenChat(driver.displayName, driver.id)}
                      className="flex-1 p-3 h-auto rounded-xl"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Chat</span>
                    </Button>
                    <Button
                      onClick={() => handleJoin(match)}
                      className="flex-1 p-3 h-auto rounded-xl"
                    >
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Request to Join</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!isLoading && matches.length === 0 && (search.pickupAddress || search.dropoffAddress) && aiAnalysis && (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
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
