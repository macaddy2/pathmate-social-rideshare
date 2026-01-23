/**
 * RecurringRides Component
 * Manage recurring commute schedules with auto-matching
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlacesAutocomplete, { PlaceResult } from './PlacesAutocomplete';
import type { RecurringRide, GeoPoint } from '../types';

// ============================================
// MOCK DATA
// ============================================

const generateMockRecurringRides = (): RecurringRide[] => [
    {
        id: 'recurring-1',
        userId: 'current-user',
        origin: 'Lekki Phase 1',
        originLocation: { lat: 6.4389, lng: 3.4732 },
        destination: 'Victoria Island',
        destinationLocation: { lat: 6.4281, lng: 3.4219 },
        role: 'rider',
        schedule: {
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            time: '08:00',
        },
        isActive: true,
        createdAt: new Date(),
    },
];

// ============================================
// DAY SELECTOR COMPONENT
// ============================================

type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface DaySelectorProps {
    selectedDays: Day[];
    onChange: (days: Day[]) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ selectedDays, onChange }) => {
    const days: { key: Day; label: string }[] = [
        { key: 'mon', label: 'M' },
        { key: 'tue', label: 'T' },
        { key: 'wed', label: 'W' },
        { key: 'thu', label: 'T' },
        { key: 'fri', label: 'F' },
        { key: 'sat', label: 'S' },
        { key: 'sun', label: 'S' },
    ];

    const toggleDay = (day: Day) => {
        if (selectedDays.includes(day)) {
            onChange(selectedDays.filter(d => d !== day));
        } else {
            onChange([...selectedDays, day]);
        }
    };

    return (
        <div className="flex gap-2 justify-between">
            {days.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`w-10 h-10 rounded-full font-medium transition-all ${selectedDays.includes(key)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

// ============================================
// RECURRING RIDE CARD
// ============================================

interface RideCardProps {
    ride: RecurringRide;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (ride: RecurringRide) => void;
}

const RecurringRideCard: React.FC<RideCardProps> = ({ ride, onToggle, onDelete, onEdit }) => {
    const formatDays = (days: Day[]) => {
        if (days.length === 7) return 'Every day';
        if (days.length === 5 && !days.includes('sat') && !days.includes('sun')) return 'Weekdays';
        if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'Weekends';

        const dayLabels: Record<Day, string> = {
            mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
        };
        return days.map(d => dayLabels[d]).join(', ');
    };

    return (
        <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${!ride.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${ride.role === 'driver' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                        {ride.role === 'driver' ? '🚗' : '🧑'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">
                            {ride.role === 'driver' ? 'Offering Ride' : 'Need Ride'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDays(ride.schedule.days)} at {ride.schedule.time}</p>
                    </div>
                </div>
                <button
                    onClick={() => onToggle(ride.id)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${ride.isActive ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${ride.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" strokeWidth="2" />
                    <circle cx="12" cy="19" r="2" strokeWidth="2" />
                    <path strokeLinecap="round" strokeWidth="2" d="M12 7v10" />
                </svg>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-800 truncate">{ride.origin}</p>
                    <p className="text-gray-500 truncate">{ride.destination}</p>
                </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button
                    onClick={() => onEdit(ride)}
                    className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={() => onDelete(ride.id)}
                    className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

const RecurringRides: React.FC = () => {
    const { user } = useAuth();
    const [rides, setRides] = useState<RecurringRide[]>(generateMockRecurringRides);
    const [showForm, setShowForm] = useState(false);
    const [editingRide, setEditingRide] = useState<RecurringRide | null>(null);

    // Form state
    const [role, setRole] = useState<'rider' | 'driver'>('rider');
    const [origin, setOrigin] = useState('');
    const [originLocation, setOriginLocation] = useState<GeoPoint | null>(null);
    const [destination, setDestination] = useState('');
    const [destinationLocation, setDestinationLocation] = useState<GeoPoint | null>(null);
    const [selectedDays, setSelectedDays] = useState<Day[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
    const [time, setTime] = useState('08:00');
    const [pricePerSeat, setPricePerSeat] = useState('1000');
    const [seatsAvailable, setSeatsAvailable] = useState('3');

    const resetForm = () => {
        setRole('rider');
        setOrigin('');
        setOriginLocation(null);
        setDestination('');
        setDestinationLocation(null);
        setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri']);
        setTime('08:00');
        setPricePerSeat('1000');
        setSeatsAvailable('3');
        setEditingRide(null);
    };

    const handleOriginSelect = (place: PlaceResult) => {
        setOrigin(place.address);
        setOriginLocation(place.location);
    };

    const handleDestinationSelect = (place: PlaceResult) => {
        setDestination(place.address);
        setDestinationLocation(place.location);
    };

    const handleSubmit = () => {
        if (!origin || !destination || !originLocation || !destinationLocation || selectedDays.length === 0) {
            return;
        }

        const newRide: RecurringRide = {
            id: editingRide?.id || `recurring-${Date.now()}`,
            userId: user?.id || 'current-user',
            origin,
            originLocation,
            destination,
            destinationLocation,
            role,
            schedule: {
                days: selectedDays,
                time,
            },
            isActive: true,
            pricePerSeat: role === 'driver' ? parseInt(pricePerSeat) : undefined,
            seatsAvailable: role === 'driver' ? parseInt(seatsAvailable) : undefined,
            createdAt: editingRide?.createdAt || new Date(),
        };

        if (editingRide) {
            setRides(prev => prev.map(r => r.id === editingRide.id ? newRide : r));
        } else {
            setRides(prev => [...prev, newRide]);
        }

        resetForm();
        setShowForm(false);
    };

    const handleToggle = (id: string) => {
        setRides(prev => prev.map(r =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
        ));
    };

    const handleDelete = (id: string) => {
        setRides(prev => prev.filter(r => r.id !== id));
    };

    const handleEdit = (ride: RecurringRide) => {
        setEditingRide(ride);
        setRole(ride.role);
        setOrigin(ride.origin);
        setOriginLocation(ride.originLocation);
        setDestination(ride.destination);
        setDestinationLocation(ride.destinationLocation);
        setSelectedDays(ride.schedule.days);
        setTime(ride.schedule.time);
        if (ride.pricePerSeat) setPricePerSeat(ride.pricePerSeat.toString());
        if (ride.seatsAvailable) setSeatsAvailable(ride.seatsAvailable.toString());
        setShowForm(true);
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl">
                <h2 className="text-xl font-bold mb-1">Recurring Rides</h2>
                <p className="text-teal-100 text-sm">Set up your daily commute and auto-match with regulars</p>
            </div>

            {/* Add Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-indigo-600 font-semibold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Recurring Ride
                </button>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-900">
                        {editingRide ? 'Edit Recurring Ride' : 'New Recurring Ride'}
                    </h3>

                    {/* Role Toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setRole('rider')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'rider' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            🧑 I need a ride
                        </button>
                        <button
                            onClick={() => setRole('driver')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === 'driver' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            🚗 I'm driving
                        </button>
                    </div>

                    {/* Origin */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">From</label>
                        <PlacesAutocomplete
                            value={origin}
                            onChange={setOrigin}
                            onPlaceSelect={handleOriginSelect}
                            placeholder="Enter pickup location"
                        />
                    </div>

                    {/* Destination */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">To</label>
                        <PlacesAutocomplete
                            value={destination}
                            onChange={setDestination}
                            onPlaceSelect={handleDestinationSelect}
                            placeholder="Enter destination"
                        />
                    </div>

                    {/* Days */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Days</label>
                        <DaySelector selectedDays={selectedDays} onChange={setSelectedDays} />
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Departure Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Driver-specific fields */}
                    {role === 'driver' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Price per seat (₦)</label>
                                <input
                                    type="number"
                                    value={pricePerSeat}
                                    onChange={(e) => setPricePerSeat(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Seats available</label>
                                <input
                                    type="number"
                                    value={seatsAvailable}
                                    onChange={(e) => setSeatsAvailable(e.target.value)}
                                    min="1"
                                    max="6"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!origin || !destination || selectedDays.length === 0}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {editingRide ? 'Save Changes' : 'Create Schedule'}
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowForm(false);
                            }}
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="bg-amber-50 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                    <p className="font-medium text-amber-800">How it works</p>
                    <p className="text-sm text-amber-700">We'll automatically match you with drivers/riders on your route at your scheduled time. You'll get notified when a match is found!</p>
                </div>
            </div>

            {/* Rides List */}
            <div className="space-y-3">
                {rides.map((ride) => (
                    <RecurringRideCard
                        key={ride.id}
                        ride={ride}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                ))}
            </div>

            {rides.length === 0 && !showForm && (
                <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl block mb-3">🔄</span>
                    <p className="font-medium">No recurring rides yet</p>
                    <p className="text-sm text-gray-400">Set up your daily commute to get started</p>
                </div>
            )}
        </div>
    );
};

export default RecurringRides;
