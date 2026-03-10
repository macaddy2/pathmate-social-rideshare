/**
 * PostRide Component
 * Enhanced driver route posting with map visualization and route management
 */

import React, { useState, useEffect } from 'react';
import { GeoPoint, DriverRide, RideStatus, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchActiveRides } from '../services/dataService';
import { createGeoRoute, formatDistance, formatDuration } from '../services/geoService';
import { formatTime, formatShortDate, getCurrencySymbol } from '../lib/formatters';
import { CURRENCIES } from '../lib/constants';
import RatingModal from './RatingModal';
import RouteMap from './RouteMap';
import PlacesAutocomplete, { PlaceResult } from './PlacesAutocomplete';
import { useRideStore } from '../stores/useRideStore';
import { useChatStore } from '../stores/useChatStore';
import { useActiveRidesStore, type ActiveRide } from '../stores/useActiveRidesStore';
import { Check, X, Bell, Map, ChevronDown, Star, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// ============================================
// TYPES
// ============================================

interface RideFormState {
  originAddress: string;
  originLocation: GeoPoint | null;
  destinationAddress: string;
  destinationLocation: GeoPoint | null;
  departureDate: string;
  departureTime: string;
  seatsAvailable: number;
  pricePerSeat: number;
  currency: string;
  maxDetourMinutes: number;
  vehicleInfo: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_FORM_STATE: RideFormState = {
  originAddress: '',
  originLocation: null,
  destinationAddress: '',
  destinationLocation: null,
  departureDate: new Date().toISOString().split('T')[0],
  departureTime: '',
  seatsAvailable: 3,
  pricePerSeat: 0,
  currency: 'NGN',
  maxDetourMinutes: 10,
  vehicleInfo: '',
};

// ============================================
// COMPONENT
// ============================================

const PostRide: React.FC = () => {
  const { user } = useAuth();
  const { addRating: onRate } = useRideStore();
  const { openChat: onOpenChat } = useChatStore();
  const { activeRides, setActiveRides, addRide, removeRide, updateRide } = useActiveRidesStore();
  // Form state
  const [form, setForm] = useState<RideFormState>(DEFAULT_FORM_STATE);
  const [showMap, setShowMap] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);

  // Rating modal
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetId: string;
  } | null>(null);

  // Initialize active rides from data service (only if store is empty)
  useEffect(() => {
    if (activeRides.length === 0) {
      fetchActiveRides(user?.id || 'current-user').then(rides => {
        setActiveRides(rides);
      });
    }
  }, []);

  // Handle form field changes
  const updateForm = <K extends keyof RideFormState>(field: K, value: RideFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle origin selection
  const handleOriginSelect = (place: PlaceResult) => {
    setForm((prev) => ({
      ...prev,
      originAddress: place.address,
      originLocation: place.location,
    }));
  };

  // Handle destination selection
  const handleDestinationSelect = (place: PlaceResult) => {
    setForm((prev) => ({
      ...prev,
      destinationAddress: place.address,
      destinationLocation: place.location,
    }));
  };

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.originAddress || !form.destinationAddress) {
      showNotification('error', 'Please enter both origin and destination');
      return;
    }

    if (!form.departureTime) {
      showNotification('error', 'Please select a departure time');
      return;
    }

    if (form.pricePerSeat <= 0) {
      showNotification('error', 'Please enter a valid price');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create departure datetime
      const departureDateTime = new Date(`${form.departureDate}T${form.departureTime}`);

      // Create the route
      const route = createGeoRoute(
        `route-${Date.now()}`,
        form.originLocation || { lat: 6.5244, lng: 3.3792 },
        form.originAddress,
        form.destinationLocation || { lat: 6.5965, lng: 3.3421 },
        form.destinationAddress,
        []
      );

      // Create the new ride
      const newRide: ActiveRide = {
        id: `ride-${Date.now()}`,
        driverId: 'current-user',
        route,
        departureTime: departureDateTime,
        flexibleMinutes: 15,
        seatsAvailable: form.seatsAvailable,
        seatsTotal: form.seatsAvailable,
        pricePerSeat: form.pricePerSeat,
        currency: form.currency,
        maxDetourMeters: form.maxDetourMinutes * 200, // Rough estimate: 200m per minute
        maxDetourMinutes: form.maxDetourMinutes,
        status: 'active' as RideStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
        matchedRiders: [],
      };

      // Add to active rides
      addRide(newRide);

      // Reset form
      setForm(DEFAULT_FORM_STATE);
      setSubmitted(true);
      showNotification('success', 'Route published successfully! Riders will be notified.');

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error publishing ride:', error);
      showNotification('error', 'Failed to publish route. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ride cancellation
  const handleCancelRide = (rideId: string) => {
    const ride = activeRides.find((r) => r.id === rideId);
    if (!ride) return;

    const hasRiders = ride.matchedRiders.length > 0;
    const confirmMessage = hasRiders
      ? `Are you sure you want to cancel this route? ${ride.matchedRiders.length} matched rider(s) will be notified immediately.`
      : 'Are you sure you want to cancel this route?';

    if (window.confirm(confirmMessage)) {
      removeRide(rideId);

      if (hasRiders) {
        showNotification(
          'info',
          `Cancellation alert sent to: ${ride.matchedRiders.map((r) => r.name.split(' ')[0]).join(', ')}`
        );
      } else {
        showNotification('info', 'Route cancelled successfully.');
      }
    }
  };

  // Handle rider action
  const handleRiderAction = (rideId: string, riderId: string, action: 'accept' | 'reject' | 'picked_up' | 'dropped_off') => {
    updateRide(rideId, (ride) => {
      if (action === 'reject') {
        return {
          ...ride,
          matchedRiders: ride.matchedRiders.filter((r) => r.id !== riderId),
          seatsAvailable: ride.seatsAvailable + 1,
        };
      }

      return {
        ...ride,
        matchedRiders: ride.matchedRiders.map((r) =>
          r.id === riderId ? { ...r, status: action === 'accept' ? 'accepted' : action } : r
        ),
      };
    });

    const actionMessages = {
      accept: 'Rider request accepted!',
      reject: 'Rider request declined.',
      picked_up: 'Rider marked as picked up.',
      dropped_off: 'Rider marked as dropped off.',
    };
    showNotification('success', actionMessages[action]);
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
          role="RIDER"
          onSubmit={onRate}
        />
      )}

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideDown ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : notification.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-6 h-6 shrink-0" />
          ) : notification.type === 'error' ? (
            <X className="w-6 h-6 shrink-0" />
          ) : (
            <Bell className="w-6 h-6 shrink-0" />
          )}
          <p className="text-sm font-bold">{notification.message}</p>
        </div>
      )}

      {/* Post New Route Form */}
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Publish Route</h2>
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
        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-bold">
          Share your commute, earn while you drive
        </p>

        {/* Map Preview */}
        {showMap && (form.originLocation || form.destinationLocation) && (
          <div className="mb-4">
            <RouteMap
              height="180px"
              route={
                form.originLocation && form.destinationLocation
                  ? createGeoRoute(
                      'preview',
                      form.originLocation,
                      form.originAddress,
                      form.destinationLocation,
                      form.destinationAddress,
                      []
                    )
                  : undefined
              }
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Route Inputs */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Your Route</label>
            <div className="space-y-3">
              <PlacesAutocomplete
                value={form.originAddress}
                onChange={(value) => updateForm('originAddress', value)}
                onSelect={handleOriginSelect}
                placeholder="Where are you starting from?"
                icon={
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                }
              />
              <PlacesAutocomplete
                value={form.destinationAddress}
                onChange={(value) => updateForm('destinationAddress', value)}
                onSelect={handleDestinationSelect}
                placeholder="Where are you going?"
                icon={
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                }
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Date</label>
              <Input
                type="date"
                value={form.departureDate}
                onChange={(e) => updateForm('departureDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-12 bg-gray-50 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Time</label>
              <Input
                type="time"
                value={form.departureTime}
                onChange={(e) => updateForm('departureTime', e.target.value)}
                className="h-12 bg-gray-50 rounded-xl"
                required
              />
            </div>
          </div>

          {/* Seats & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Available Seats</label>
              <Select value={form.seatsAvailable.toString()} onValueChange={(value) => updateForm('seatsAvailable', parseInt(value))}>
                <SelectTrigger className="h-12 bg-gray-50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} seat{n !== 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Price/Seat</label>
              <div className="relative flex">
                <Select value={form.currency} onValueChange={(value) => updateForm('currency', value)}>
                  <SelectTrigger className="w-20 h-12 bg-gray-50 rounded-l-xl rounded-r-none border-r-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={form.pricePerSeat || ''}
                  onChange={(e) => updateForm('pricePerSeat', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1 h-12 bg-gray-50 rounded-l-none rounded-r-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* Max Detour */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              Max Detour Tolerance
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={form.maxDetourMinutes}
                onChange={(e) => updateForm('maxDetourMinutes', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-sm font-bold text-indigo-600 w-16 text-right">
                {form.maxDetourMinutes} min
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              How far you&apos;re willing to deviate from your route for pickups/dropoffs
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className={`w-full font-bold p-4 rounded-xl shadow-lg active:scale-95 ${
              submitted ? 'bg-green-500 hover:bg-green-600' : ''
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </span>
            ) : submitted ? (
              'Route Published!'
            ) : (
              'Publish Route'
            )}
          </Button>
        </form>
        </CardContent>
      </Card>

      {/* Active Routes */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex justify-between items-center">
          <span>Your Active Routes</span>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-600">
            {activeRides.length}
          </Badge>
        </h3>

        {activeRides.length === 0 ? (
          <div className="text-center py-8">
            <Map className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No active routes</p>
            <p className="text-xs text-gray-300 mt-1">Post a route to start earning</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRides.map((ride) => (
              <div
                key={ride.id}
                className="border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-200 transition-all"
              >
                {/* Route Header */}
                <div
                  className="p-4 bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedRide(selectedRide === ride.id ? null : ride.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">
                        {ride.route.originAddress.split(',')[0]} → {ride.route.destinationAddress.split(',')[0]}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span>{formatShortDate(ride.departureTime)}</span>
                        <span>•</span>
                        <span>{formatTime(ride.departureTime)}</span>
                        <span>•</span>
                        <span>{ride.seatsAvailable} seats left</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600">
                          {getCurrencySymbol(ride.currency)}{ride.pricePerSeat.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ride.matchedRiders.length > 0 && (
                        <Badge variant="success" className="text-xs">
                          {ride.matchedRiders.length} rider{ride.matchedRiders.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          selectedRide === ride.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {selectedRide === ride.id && (
                  <div className="p-4 border-t border-gray-100 space-y-4">
                    {/* Route Map */}
                    <RouteMap route={ride.route} height="150px" />

                    {/* Matched Riders */}
                    {ride.matchedRiders.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Matched Riders</div>
                        <div className="space-y-2">
                          {ride.matchedRiders.map((rider) => (
                            <div
                              key={rider.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {rider.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{rider.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {rider.pickupAddress} → {rider.dropoffAddress}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="text-xs text-gray-500">{rider.rating}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {rider.status === 'pending' ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRiderAction(ride.id, rider.id, 'accept')}
                                      className="bg-green-100 text-green-600 hover:bg-green-200 h-9 w-9"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRiderAction(ride.id, rider.id, 'reject')}
                                      className="bg-red-100 text-red-600 hover:bg-red-200 h-9 w-9"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onOpenChat(rider.name, rider.id)}
                                      className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 h-9 w-9"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setRatingModal({ isOpen: true, targetName: rider.name, targetId: rider.id })}
                                      className="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 h-9 w-9"
                                    >
                                      <Star className="w-4 h-4 fill-current" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cancel Button */}
                    <Button
                      variant="outline"
                      onClick={() => handleCancelRide(ride.id)}
                      className="w-full p-3 h-auto border-red-200 text-red-600 rounded-xl hover:bg-red-50"
                    >
                      Cancel Route
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Driver Tips */}
      <Card className="bg-indigo-50 rounded-2xl border-indigo-100">
        <CardContent className="p-5">
        <h3 className="font-bold text-indigo-900 text-sm mb-2">Driver Tips</h3>
        <ul className="text-xs text-indigo-700 space-y-2 opacity-80">
          <li className="flex gap-2">
            <span>•</span> Set a reasonable detour tolerance to get more matches.
          </li>
          <li className="flex gap-2">
            <span>•</span> Cancellations within 30 mins of departure may affect your rating.
          </li>
          <li className="flex gap-2">
            <span>•</span> Confirm cash payments in-app after each ride for both parties.
          </li>
        </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostRide;
