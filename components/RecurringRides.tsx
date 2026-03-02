/**
 * RecurringRides Component
 * Manage recurring commute schedules with auto-matching
 */

import React, { useState, useEffect } from 'react';
import { Route, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PlacesAutocomplete, { PlaceResult } from './PlacesAutocomplete';
import type { RecurringRide, GeoPoint } from '../types';
import { useRecurringRidesStore } from '../stores/useRecurringRidesStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

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
                <Button
                    key={key}
                    variant={selectedDays.includes(key) ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleDay(key)}
                    className="w-10 h-10 rounded-full font-medium"
                >
                    {label}
                </Button>
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
        <Card className={`rounded-2xl border-gray-100 ${!ride.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
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
                    <Switch
                        checked={ride.isActive}
                        onCheckedChange={() => onToggle(ride.id)}
                        className="data-[state=checked]:bg-green-500"
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Route className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-800 truncate">{ride.origin}</p>
                        <p className="text-gray-500 truncate">{ride.destination}</p>
                    </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(ride)}
                        className="flex-1 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-600"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(ride.id)}
                        className="flex-1 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-600"
                    >
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

const RecurringRides: React.FC = () => {
    const { user } = useAuth();
    const { rides, setRides, addRide, updateRide, deleteRide, toggleActive } = useRecurringRidesStore();
    const [showForm, setShowForm] = useState(false);

    // Initialize with mock data if store is empty
    useEffect(() => {
        if (rides.length === 0) {
            setRides(generateMockRecurringRides());
        }
    }, []);
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
            updateRide(editingRide.id, newRide);
        } else {
            addRide(newRide);
        }

        resetForm();
        setShowForm(false);
    };

    const handleToggle = (id: string) => {
        toggleActive(id);
    };

    const handleDelete = (id: string) => {
        deleteRide(id);
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
                <Button
                    variant="outline"
                    onClick={() => setShowForm(true)}
                    className="w-full h-14 rounded-2xl border-gray-100 text-indigo-600 font-semibold hover:bg-indigo-50"
                >
                    <Plus className="w-5 h-5" />
                    Add Recurring Ride
                </Button>
            )}

            {/* Form */}
            {showForm && (
                <Card className="rounded-2xl border-gray-100">
                <CardContent className="p-5 space-y-4">
                    <h3 className="font-bold text-gray-900">
                        {editingRide ? 'Edit Recurring Ride' : 'New Recurring Ride'}
                    </h3>

                    {/* Role Toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        <Button
                            variant={role === 'rider' ? 'outline' : 'ghost'}
                            onClick={() => setRole('rider')}
                            className={`flex-1 rounded-lg text-sm font-medium ${role === 'rider' ? 'bg-white text-gray-900 shadow-sm border-0 hover:bg-white' : 'text-gray-500 hover:bg-transparent hover:text-gray-700'}`}
                        >
                            🧑 I need a ride
                        </Button>
                        <Button
                            variant={role === 'driver' ? 'outline' : 'ghost'}
                            onClick={() => setRole('driver')}
                            className={`flex-1 rounded-lg text-sm font-medium ${role === 'driver' ? 'bg-white text-gray-900 shadow-sm border-0 hover:bg-white' : 'text-gray-500 hover:bg-transparent hover:text-gray-700'}`}
                        >
                            🚗 I'm driving
                        </Button>
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
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="h-12 px-4 rounded-xl"
                        />
                    </div>

                    {/* Driver-specific fields */}
                    {role === 'driver' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Price per seat (₦)</label>
                                <Input
                                    type="number"
                                    value={pricePerSeat}
                                    onChange={(e) => setPricePerSeat(e.target.value)}
                                    className="h-12 px-4 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Seats available</label>
                                <Input
                                    type="number"
                                    value={seatsAvailable}
                                    onChange={(e) => setSeatsAvailable(e.target.value)}
                                    min={1}
                                    max={6}
                                    className="h-12 px-4 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={!origin || !destination || selectedDays.length === 0}
                            className="flex-1 h-12 rounded-xl font-semibold"
                        >
                            {editingRide ? 'Save Changes' : 'Create Schedule'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetForm();
                                setShowForm(false);
                            }}
                            className="h-12 px-6 rounded-xl font-medium"
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
                </Card>
            )}

            {/* Info Card */}
            <Card className="rounded-2xl bg-amber-50 border-amber-100">
                <CardContent className="p-4 flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <p className="font-medium text-amber-800">How it works</p>
                        <p className="text-sm text-amber-700">We'll automatically match you with drivers/riders on your route at your scheduled time. You'll get notified when a match is found!</p>
                    </div>
                </CardContent>
            </Card>

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
