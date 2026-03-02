/**
 * ProfileSettings Component
 * User profile management with verification features
 */

import React, { useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { VehicleInfo, NotificationPreferences } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';

// ============================================
// VERIFICATION BADGE COMPONENT
// ============================================

interface BadgeProps {
    verified: boolean;
    label: string;
}

const VerificationBadge: React.FC<BadgeProps> = ({ verified, label }) => (
    <Badge
        variant={verified ? 'success' : 'outline'}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl ${verified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500'}`}
    >
        {verified ? (
            <CheckCircle className="w-5 h-5" />
        ) : (
            <Circle className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">{label}</span>
    </Badge>
);

// ============================================
// SETTINGS SECTION COMPONENT
// ============================================

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
    <Card className="rounded-2xl border-gray-100">
        <CardContent className="p-5">
            <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
            {children}
        </CardContent>
    </Card>
);

// ============================================
// TOGGLE COMPONENT
// ============================================

interface ToggleProps {
    label: string;
    description?: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, enabled, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div>
            <p className="font-medium text-gray-800">{label}</p>
            {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <Switch checked={enabled} onCheckedChange={onChange} />
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const ProfileSettings: React.FC = () => {
    const { user, profile, signOut } = useAuth();

    // Local state for UI
    const [activeSection, setActiveSection] = useState<'profile' | 'vehicle' | 'notifications' | 'recurring'>('profile');
    const [isEditing, setIsEditing] = useState(false);

    // Profile form state
    const [displayName, setDisplayName] = useState(profile?.displayName || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');

    // Vehicle info state
    const [vehicle, setVehicle] = useState<VehicleInfo>({
        make: profile?.vehicleMake || '',
        model: profile?.vehicleModel || '',
        year: profile?.vehicleYear || new Date().getFullYear(),
        color: profile?.vehicleColor || '',
        licensePlate: profile?.licensePlate || '',
        verified: false,
    });

    // Notification preferences
    const [notifications, setNotifications] = useState<NotificationPreferences>({
        pushEnabled: true,
        emailEnabled: true,
        rideMatches: true,
        bookingUpdates: true,
        messages: true,
        payments: true,
        promotions: false,
    });

    const handleSaveProfile = () => {
        // Will save to Supabase
        console.log('Saving profile:', { displayName, phone });
        setIsEditing(false);
    };

    const handleSendOtp = () => {
        // Will integrate with phone verification
        console.log('Sending OTP to:', phone);
        setShowOtpInput(true);
    };

    const handleVerifyOtp = () => {
        // Will verify OTP
        console.log('Verifying OTP:', otp);
    };

    const handleSaveVehicle = () => {
        // Will save to Supabase
        console.log('Saving vehicle:', vehicle);
    };

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-24">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold backdrop-blur-sm border-2 border-white/30">
                        {(profile?.displayName || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{profile?.displayName || 'Set your name'}</h2>
                        <p className="text-indigo-200 text-sm">{user?.email}</p>
                        <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                ⭐ {profile?.riderRating?.toFixed(1) || '5.0'} Rider
                            </span>
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                ⭐ {profile?.driverRating?.toFixed(1) || '5.0'} Driver
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Status */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <VerificationBadge verified={profile?.emailVerified || true} label="Email" />
                <VerificationBadge verified={profile?.phoneVerified || false} label="Phone" />
                <VerificationBadge verified={profile?.idVerified || false} label="ID" />
                <VerificationBadge verified={vehicle.verified} label="Vehicle" />
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(['profile', 'vehicle', 'notifications', 'recurring'] as const).map((section) => (
                    <Button
                        key={section}
                        variant={activeSection === section ? 'default' : 'secondary'}
                        onClick={() => setActiveSection(section)}
                        className="rounded-xl whitespace-nowrap"
                    >
                        {section === 'profile' && '👤 Profile'}
                        {section === 'vehicle' && '🚗 Vehicle'}
                        {section === 'notifications' && '🔔 Alerts'}
                        {section === 'recurring' && '🔄 Recurring'}
                    </Button>
                ))}
            </div>

            {/* Profile Section */}
            {activeSection === 'profile' && (
                <SettingsSection title="Personal Information">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Display Name</label>
                            <Input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={!isEditing}
                                className="h-12 px-4 rounded-xl disabled:bg-gray-50"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                            <div className="flex gap-2">
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!isEditing}
                                    className="flex-1 h-12 px-4 rounded-xl disabled:bg-gray-50"
                                    placeholder="+234 800 000 0000"
                                />
                                {isEditing && !profile?.phoneVerified && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleSendOtp}
                                        className="h-12 px-4 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                                    >
                                        Verify
                                    </Button>
                                )}
                            </div>
                        </div>

                        {showOtpInput && (
                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <label className="block text-sm text-indigo-600 mb-2">Enter verification code</label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        className="flex-1 h-12 px-4 rounded-xl border-indigo-200 text-center text-xl tracking-widest"
                                        placeholder="000000"
                                    />
                                    <Button
                                        onClick={handleVerifyOtp}
                                        className="h-12 px-6 rounded-xl"
                                    >
                                        Confirm
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        onClick={handleSaveProfile}
                                        className="flex-1 h-12 rounded-xl font-semibold"
                                    >
                                        Save Changes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        className="h-12 px-6 rounded-xl font-medium"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 h-12 rounded-xl font-semibold"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                </SettingsSection>
            )}

            {/* Vehicle Section */}
            {activeSection === 'vehicle' && (
                <SettingsSection title="Vehicle Information">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Make</label>
                                <Input
                                    type="text"
                                    value={vehicle.make}
                                    onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                                    className="h-12 px-4 rounded-xl"
                                    placeholder="Toyota"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Model</label>
                                <Input
                                    type="text"
                                    value={vehicle.model}
                                    onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                                    className="h-12 px-4 rounded-xl"
                                    placeholder="Camry"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Year</label>
                                <Input
                                    type="number"
                                    value={vehicle.year}
                                    onChange={(e) => setVehicle({ ...vehicle, year: parseInt(e.target.value) })}
                                    className="h-12 px-4 rounded-xl"
                                    placeholder="2020"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Color</label>
                                <Input
                                    type="text"
                                    value={vehicle.color}
                                    onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                                    className="h-12 px-4 rounded-xl"
                                    placeholder="Silver"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">License Plate</label>
                            <Input
                                type="text"
                                value={vehicle.licensePlate}
                                onChange={(e) => setVehicle({ ...vehicle, licensePlate: e.target.value.toUpperCase() })}
                                className="h-12 px-4 rounded-xl uppercase"
                                placeholder="ABC 123 XY"
                            />
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3">
                            <span className="text-xl">📋</span>
                            <div>
                                <p className="font-medium text-amber-800">Vehicle Verification</p>
                                <p className="text-sm text-amber-600">Upload vehicle documents to get verified and build trust with riders.</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveVehicle}
                            className="w-full h-12 rounded-xl font-semibold"
                        >
                            Save Vehicle Info
                        </Button>
                    </div>
                </SettingsSection>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
                <SettingsSection title="Notification Preferences">
                    <Toggle
                        label="Push Notifications"
                        description="Receive notifications on your device"
                        enabled={notifications.pushEnabled}
                        onChange={(v) => setNotifications({ ...notifications, pushEnabled: v })}
                    />
                    <Toggle
                        label="Email Notifications"
                        description="Receive updates via email"
                        enabled={notifications.emailEnabled}
                        onChange={(v) => setNotifications({ ...notifications, emailEnabled: v })}
                    />
                    <Toggle
                        label="Ride Matches"
                        description="When a ride matches your request"
                        enabled={notifications.rideMatches}
                        onChange={(v) => setNotifications({ ...notifications, rideMatches: v })}
                    />
                    <Toggle
                        label="Booking Updates"
                        description="Confirmations, cancellations, and changes"
                        enabled={notifications.bookingUpdates}
                        onChange={(v) => setNotifications({ ...notifications, bookingUpdates: v })}
                    />
                    <Toggle
                        label="Messages"
                        description="Chat messages from drivers/riders"
                        enabled={notifications.messages}
                        onChange={(v) => setNotifications({ ...notifications, messages: v })}
                    />
                    <Toggle
                        label="Payment Alerts"
                        description="Payment confirmations and receipts"
                        enabled={notifications.payments}
                        onChange={(v) => setNotifications({ ...notifications, payments: v })}
                    />
                    <Toggle
                        label="Promotions"
                        description="Discounts and special offers"
                        enabled={notifications.promotions}
                        onChange={(v) => setNotifications({ ...notifications, promotions: v })}
                    />
                </SettingsSection>
            )}

            {/* Recurring Rides Section */}
            {activeSection === 'recurring' && (
                <SettingsSection title="Recurring Rides">
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl block mb-3">🔄</span>
                        <p className="font-medium">No recurring rides set up</p>
                        <p className="text-sm text-gray-400 mb-4">Save your daily commute and auto-match with regular drivers</p>
                        <Button className="h-12 px-6 rounded-xl font-medium">
                            Add Recurring Ride
                        </Button>
                    </div>
                </SettingsSection>
            )}

            {/* Logout Button */}
            <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full h-14 rounded-2xl font-semibold bg-red-50 text-red-600 hover:bg-red-100"
            >
                Sign Out
            </Button>
        </div>
    );
};

export default ProfileSettings;
