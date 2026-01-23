/**
 * ProfileSettings Component
 * User profile management with verification features
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { VehicleInfo, NotificationPreferences } from '../types';

// ============================================
// VERIFICATION BADGE COMPONENT
// ============================================

interface BadgeProps {
    verified: boolean;
    label: string;
}

const VerificationBadge: React.FC<BadgeProps> = ({ verified, label }) => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${verified ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
        }`}>
        {verified ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
            </svg>
        )}
        <span className="text-sm font-medium">{label}</span>
    </div>
);

// ============================================
// SETTINGS SECTION COMPONENT
// ============================================

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
        {children}
    </div>
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
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
        >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
        </button>
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
                    <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeSection === section
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {section === 'profile' && '👤 Profile'}
                        {section === 'vehicle' && '🚗 Vehicle'}
                        {section === 'notifications' && '🔔 Alerts'}
                        {section === 'recurring' && '🔄 Recurring'}
                    </button>
                ))}
            </div>

            {/* Profile Section */}
            {activeSection === 'profile' && (
                <SettingsSection title="Personal Information">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!isEditing}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                                    placeholder="+234 800 000 0000"
                                />
                                {isEditing && !profile?.phoneVerified && (
                                    <button
                                        onClick={handleSendOtp}
                                        className="px-4 py-3 bg-indigo-100 text-indigo-600 rounded-xl font-medium hover:bg-indigo-200 transition-colors"
                                    >
                                        Verify
                                    </button>
                                )}
                            </div>
                        </div>

                        {showOtpInput && (
                            <div className="bg-indigo-50 p-4 rounded-xl">
                                <label className="block text-sm text-indigo-600 mb-2">Enter verification code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 text-center text-xl tracking-widest"
                                        placeholder="000000"
                                    />
                                    <button
                                        onClick={handleVerifyOtp}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Edit Profile
                                </button>
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
                                <input
                                    type="text"
                                    value={vehicle.make}
                                    onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Toyota"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Model</label>
                                <input
                                    type="text"
                                    value={vehicle.model}
                                    onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Camry"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Year</label>
                                <input
                                    type="number"
                                    value={vehicle.year}
                                    onChange={(e) => setVehicle({ ...vehicle, year: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="2020"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Color</label>
                                <input
                                    type="text"
                                    value={vehicle.color}
                                    onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Silver"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-600 mb-1">License Plate</label>
                            <input
                                type="text"
                                value={vehicle.licensePlate}
                                onChange={(e) => setVehicle({ ...vehicle, licensePlate: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 uppercase"
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

                        <button
                            onClick={handleSaveVehicle}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Save Vehicle Info
                        </button>
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
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                            Add Recurring Ride
                        </button>
                    </div>
                </SettingsSection>
            )}

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-semibold hover:bg-red-100 transition-colors"
            >
                Sign Out
            </button>
        </div>
    );
};

export default ProfileSettings;
