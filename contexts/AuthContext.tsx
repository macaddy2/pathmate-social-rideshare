/**
 * AuthContext
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '../types';

// ============================================
// TYPES
// ============================================

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;

  // Profile methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;

  // Utility
  clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  });

  // Set error with auto-clear
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
    if (error) {
      setTimeout(() => setState((prev) => ({ ...prev, error: null })), 5000);
    }
  }, []);

  // Clear error manually
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Fetch user profile from database (with timeout so it can't hang forever)
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Profile fetch timeout') }), 5000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error || !data) {
        // Not an error if profile just doesn't exist yet (new signup)
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        phone: data.phone,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        createdAt: new Date(data.created_at),
        emailVerified: data.email_verified,
        phoneVerified: data.phone_verified,
        idVerified: data.id_verified,
        defaultRole: data.default_role as UserRole,
        vehicleMake: data.vehicle_make,
        vehicleModel: data.vehicle_model,
        vehicleYear: data.vehicle_year,
        vehicleColor: data.vehicle_color,
        licensePlate: data.license_plate,
        riderRating: data.rider_rating,
        riderRatingCount: data.rider_rating_count,
        driverRating: data.driver_rating,
        driverRatingCount: data.driver_rating_count,
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Create initial profile for new users
  const createProfile = useCallback(async (user: User, displayName: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          display_name: displayName,
          email_verified: !!user.email_confirmed_at,
          default_role: 'RIDER',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        createdAt: new Date(data.created_at),
        emailVerified: data.email_verified,
        phoneVerified: false,
        idVerified: false,
        defaultRole: 'RIDER' as UserRole,
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // If env vars aren't set, skip Supabase and let user see the login form.
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured — skipping auth init.');
        if (mounted) setState({ user: null, profile: null, session: null, loading: false, error: null });
        return;
      }

      try {
        // Race getSession() against a 10-second timeout so we can
        // never be stuck in a loading spinner indefinitely.
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: null }), 10000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!mounted) return;

        if (error) {
          console.error('Auth session error:', error);
          setState({ user: null, profile: null, session: null, loading: false, error: 'Failed to connect to authentication service' });
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            setState({ user: session.user, profile, session, loading: false, error: null });
          }
        } else {
          setState({ user: null, profile: null, session: null, loading: false, error: null });
        }
      } catch (err: unknown) {
        if (!mounted) return;
        // AbortError fires in React StrictMode dev — harmless, second mount will succeed.
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Auth initialization error:', err);
        setState({ user: null, profile: null, session: null, loading: false, error: 'Failed to initialize authentication' });
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          });
        } else if (event === 'USER_UPDATED' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState((prev) => ({
            ...prev,
            user: session.user,
            profile,
            session,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with email/password
  // Note: loading state is managed by onAuthStateChange — we don't set loading=true
  // here to avoid a race where the auth event resolves before we clear loading.
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    return { error };
  }, [setError]);

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setState((prev) => ({ ...prev, loading: false }));
      return { error };
    }

    // Create profile for new user
    if (data.user) {
      await createProfile(data.user, displayName);
    }

    setState((prev) => ({ ...prev, loading: false }));
    return { error: null };
  }, [setError, createProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,
    });
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setState((prev) => ({ ...prev, loading: false }));
    }

    return { error };
  }, [setError]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { error: new Error('No user logged in') };
    }

    try {
      // Map UserProfile fields to database columns
      const dbUpdates: Record<string, any> = {};
      if (updates.displayName) dbUpdates.display_name = updates.displayName;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.defaultRole) dbUpdates.default_role = updates.defaultRole;
      if (updates.vehicleMake !== undefined) dbUpdates.vehicle_make = updates.vehicleMake;
      if (updates.vehicleModel !== undefined) dbUpdates.vehicle_model = updates.vehicleModel;
      if (updates.vehicleYear !== undefined) dbUpdates.vehicle_year = updates.vehicleYear;
      if (updates.vehicleColor !== undefined) dbUpdates.vehicle_color = updates.vehicleColor;
      if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate;

      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', state.user.id);

      if (error) throw error;

      // Refresh profile
      await refreshProfile();

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  }, [state.user, refreshProfile]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateProfile,
    refreshProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
};

export default AuthContext;
