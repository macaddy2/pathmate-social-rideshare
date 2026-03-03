/**
 * PathMate App
 * Social rideshare application with authentication and real-time features
 */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './components/Home';
import SearchRide from './components/SearchRide';
import PostRide from './components/PostRide';
import AIPlanner from './components/AIPlanner';
import ChatWindow from './components/ChatWindow';
import AuthScreen from './components/AuthScreen';
import RideHistory from './components/RideHistory';
import ProfileSettings from './components/ProfileSettings';
import RecurringRides from './components/RecurringRides';
import WalletScreen from './components/WalletScreen';
import { useRideStore } from './stores/useRideStore';
import { useLocationStore } from './stores/useLocationStore';
import { useChatStore } from './stores/useChatStore';
import { notificationService } from './services/notificationService';
import { paymentService } from './services/paymentService';

// ============================================
// MAIN APP CONTENT (Authenticated)
// ============================================

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { setRole } = useRideStore();
  const { initGeolocation } = useLocationStore();
  const { activeChat, closeChat } = useChatStore();

  // Get user location on mount
  useEffect(() => {
    initGeolocation();
  }, []);

  // Set role from profile when available
  useEffect(() => {
    if (profile?.defaultRole) {
      setRole(profile.defaultRole as UserRole);
    }
  }, [profile]);

  // Initialize services when user is authenticated
  useEffect(() => {
    if (user?.id) {
      notificationService.init(user.id);
      paymentService.init(user.id);
    }
  }, [user?.id]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Loading PathMate...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchRide />} />
        <Route path="/post" element={<PostRide />} />
        <Route path="/planner" element={<AIPlanner />} />
        <Route path="/history" element={<RideHistory />} />
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/recurring" element={<RecurringRides />} />
        <Route path="/wallet" element={<WalletScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {activeChat && (
        <ChatWindow
          isOpen={!!activeChat}
          onClose={closeChat}
          targetName={activeChat.targetName}
          targetId={activeChat.targetId}
        />
      )}
    </Layout>
  );
};

// ============================================
// ROOT APP WITH PROVIDERS
// ============================================

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
