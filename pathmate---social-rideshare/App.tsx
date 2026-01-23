/**
 * PathMate App
 * Social rideshare application with authentication and real-time features
 */

import React, { useState, useEffect } from 'react';
import { UserRole, Rating } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './components/Home';
import SearchRide from './components/SearchRide';
import PostRide from './components/PostRide';
import AIPlanner from './components/AIPlanner';
import ChatWindow from './components/ChatWindow';
import AuthScreen from './components/AuthScreen';

// ============================================
// MAIN APP CONTENT (Authenticated)
// ============================================

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('home');
  const [role, setRole] = useState<UserRole>(UserRole.GUEST);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [activeChat, setActiveChat] = useState<{ targetName: string, targetId: string } | null>(null);

  // Ratings state (will be moved to Supabase later)
  const [ratings, setRatings] = useState<Rating[]>([
    { fromId: 'a', toId: 'You', score: 5, role: 'DRIVER' },
    { fromId: 'b', toId: 'You', score: 4, role: 'DRIVER' },
    { fromId: 'c', toId: 'You', score: 5, role: 'RIDER' },
  ]);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn("Geolocation denied:", error.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Set role from profile when available
  useEffect(() => {
    if (profile?.defaultRole) {
      setRole(profile.defaultRole as UserRole);
    }
  }, [profile]);

  const addRating = (newRating: Rating) => {
    setRatings(prev => [...prev, newRating]);
  };

  const getAverageRating = (userId: string, targetRole: 'RIDER' | 'DRIVER') => {
    const relevant = ratings.filter(r => r.toId === userId && r.role === targetRole);
    if (relevant.length === 0) return 5.0;
    const sum = relevant.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round((sum / relevant.length) * 10) / 10;
  };

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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home
            setRole={setRole}
            setActiveTab={setActiveTab}
            avgRiderRating={getAverageRating(user.id, 'RIDER')}
            avgDriverRating={getAverageRating(user.id, 'DRIVER')}
          />
        );
      case 'search':
        return (
          <SearchRide
            userLocation={userLocation}
            onRate={addRating}
            onOpenChat={(name, id) => setActiveChat({targetName: name, targetId: id})}
          />
        );
      case 'post':
        return (
          <PostRide
            onRate={addRating}
            onOpenChat={(name, id) => setActiveChat({targetName: name, targetId: id})}
          />
        );
      case 'planner':
        return <AIPlanner />;
      default:
        return (
          <Home
            setRole={setRole}
            setActiveTab={setActiveTab}
            avgRiderRating={getAverageRating(user.id, 'RIDER')}
            avgDriverRating={getAverageRating(user.id, 'DRIVER')}
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} role={role}>
      {renderContent()}
      {activeChat && (
        <ChatWindow
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
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
