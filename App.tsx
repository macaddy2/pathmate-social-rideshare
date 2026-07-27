/**
 * PathMate App
 * Social rideshare application with authentication and real-time features
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import { useRideStore } from './stores/useRideStore';
import { useLocationStore } from './stores/useLocationStore';
import { useChatStore } from './stores/useChatStore';
import { notificationService } from './services/notificationService';
import { paymentService } from './services/paymentService';

const Home = lazy(() => import('./components/Home'));
const SearchRide = lazy(() => import('./components/SearchRide'));
const PostRide = lazy(() => import('./components/PostRide'));
const AIPlanner = lazy(() => import('./components/AIPlanner'));
const ChatWindow = lazy(() => import('./components/ChatWindow'));
const RideHistory = lazy(() => import('./components/RideHistory'));
const ProfileSettings = lazy(() => import('./components/ProfileSettings'));
const RecurringRides = lazy(() => import('./components/RecurringRides'));
const WalletScreen = lazy(() => import('./components/WalletScreen'));
const TripsHub = lazy(() => import('./components/TripsHub'));
const MessagesScreen = lazy(() => import('./components/MessagesScreen'));
const SafetyCenter = lazy(() => import('./components/SafetyCenter'));

const ScreenFallback = () => (
  <div className="flex min-h-64 items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
      <p className="mt-3 text-sm font-semibold text-slate-500">Loading your route…</p>
    </div>
  </div>
);

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
      <Suspense fallback={<ScreenFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchRide />} />
          <Route path="/post" element={<PostRide />} />
          <Route path="/planner" element={<AIPlanner />} />
          <Route path="/history" element={<RideHistory />} />
          <Route path="/trips" element={<TripsHub />} />
          <Route path="/messages" element={<MessagesScreen />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/recurring" element={<RecurringRides />} />
          <Route path="/wallet" element={<WalletScreen />} />
          <Route path="/safety" element={<SafetyCenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {activeChat ? (
          <ChatWindow
            isOpen
            onClose={closeChat}
            targetName={activeChat.targetName}
            targetId={activeChat.targetId}
          />
        ) : null}
      </Suspense>
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
