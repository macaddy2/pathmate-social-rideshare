/**
 * RideHistory Component
 * Dashboard showing past rides, earnings, spending, and environmental impact
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Route } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchRideHistory } from '../services/dataService';
import type { RideHistoryEntry, RideStats } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// ============================================
// STATS CARD COMPONENT
// ============================================

interface StatsCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subtext?: string;
    color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, subtext, color }) => (
    <Card className="rounded-2xl">
        <CardContent className="p-4">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </CardContent>
    </Card>
);

// ============================================
// RIDE CARD COMPONENT
// ============================================

interface RideCardProps {
    ride: RideHistoryEntry;
    onRate?: (rideId: string) => void;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onRate }) => {
    const formatCurrency = (amount: number, currency: string) => {
        const symbols: Record<string, string> = { NGN: '₦', USD: '$', EUR: '€', GBP: '£' };
        return `${symbols[currency] || currency}${amount.toLocaleString()}`;
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    };

    return (
        <Card className={`rounded-2xl ${ride.status === 'cancelled' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${ride.role === 'driver' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                        {ride.role === 'driver' ? '🚗' : '🧑'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{ride.partnerName}</p>
                        <p className="text-xs text-gray-500">{formatDate(ride.date)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold ${ride.role === 'driver' ? 'text-green-600' : 'text-gray-900'}`}>
                        {ride.role === 'driver' ? '+' : ''}{formatCurrency(ride.price, ride.currency)}
                    </p>
                    <Badge variant={ride.status === 'completed' ? 'success' : 'destructive'} className="text-xs">
                        {ride.status}
                    </Badge>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Route className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                    <p className="text-gray-800">{ride.origin}</p>
                    <p className="text-gray-500">{ride.destination}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{ride.distanceKm} km</span>
                    <span>{ride.durationMinutes} min</span>
                    <span className="text-green-600">🌱 {ride.co2SavedKg.toFixed(1)} kg CO₂</span>
                </div>

                {ride.status === 'completed' && !ride.ratingGiven && onRate && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRate(ride.id)}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-medium hover:bg-indigo-100 h-auto"
                    >
                        Rate Ride
                    </Button>
                )}

                {ride.ratingGiven && (
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                        <span>⭐ {ride.ratingGiven}</span>
                    </div>
                )}
            </div>
      </CardContent>
    </Card>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

type FilterType = 'all' | 'driver' | 'rider';
type TimeFilter = 'week' | 'month' | 'year' | 'all';

const RideHistory: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<RideHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRideHistory(user?.id || 'current-user').then(entries => {
            setHistory(entries);
            setLoading(false);
        });
    }, [user?.id]);
    const [roleFilter, setRoleFilter] = useState<FilterType>('all');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

    // Calculate stats
    const stats = useMemo<RideStats>(() => {
        const completedRides = history.filter(r => r.status === 'completed');
        const driverRides = completedRides.filter(r => r.role === 'driver');
        const riderRides = completedRides.filter(r => r.role === 'rider');

        return {
            totalRides: completedRides.length,
            totalDistance: completedRides.reduce((sum, r) => sum + r.distanceKm, 0),
            totalEarnings: driverRides.reduce((sum, r) => sum + r.price, 0),
            totalSpent: riderRides.reduce((sum, r) => sum + r.price, 0),
            co2Saved: completedRides.reduce((sum, r) => sum + r.co2SavedKg, 0),
            avgRating: 4.7, // Would calculate from actual ratings
            currency: 'NGN',
        };
    }, [history]);

    // Filter rides
    const filteredRides = useMemo(() => {
        let filtered = history;

        if (roleFilter !== 'all') {
            filtered = filtered.filter(r => r.role === roleFilter);
        }

        const now = new Date();
        if (timeFilter !== 'all') {
            const cutoff = new Date();
            if (timeFilter === 'week') cutoff.setDate(now.getDate() - 7);
            else if (timeFilter === 'month') cutoff.setMonth(now.getMonth() - 1);
            else if (timeFilter === 'year') cutoff.setFullYear(now.getFullYear() - 1);
            filtered = filtered.filter(r => r.date >= cutoff);
        }

        return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [history, roleFilter, timeFilter]);

    const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            {/* Header */}
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl border-0">
                <h2 className="text-xl font-bold mb-1">Ride History</h2>
                <p className="text-purple-200 text-sm">Track your journeys and impact</p>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <StatsCard
                    icon={<span className="text-xl">🚗</span>}
                    label="Total Rides"
                    value={stats.totalRides.toString()}
                    subtext={`${stats.totalDistance} km traveled`}
                    color="bg-indigo-100"
                />
                <StatsCard
                    icon={<span className="text-xl">💰</span>}
                    label="Earnings"
                    value={formatCurrency(stats.totalEarnings)}
                    subtext="As driver"
                    color="bg-green-100"
                />
                <StatsCard
                    icon={<span className="text-xl">💸</span>}
                    label="Spent"
                    value={formatCurrency(stats.totalSpent)}
                    subtext="As rider"
                    color="bg-blue-100"
                />
                <StatsCard
                    icon={<span className="text-xl">🌱</span>}
                    label="CO₂ Saved"
                    value={`${stats.co2Saved.toFixed(1)} kg`}
                    subtext="Environmental impact"
                    color="bg-emerald-100"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['all', 'driver', 'rider'] as FilterType[]).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setRoleFilter(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === filter
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {filter === 'all' ? 'All' : filter === 'driver' ? '🚗 Driver' : '🧑 Rider'}
                        </button>
                    ))}
                </div>

                <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
                    <SelectTrigger className="w-[140px] bg-gray-100 border-0 rounded-xl text-sm font-medium">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last month</SelectItem>
                        <SelectItem value="year">Last year</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Ride List */}
            <div className="space-y-3">
                {filteredRides.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-4xl mb-3">📭</p>
                        <p>No rides found for this filter</p>
                    </div>
                ) : (
                    filteredRides.map((ride) => (
                        <RideCard
                            key={ride.id}
                            ride={ride}
                            onRate={(id) => console.log('Rate ride:', id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default RideHistory;
