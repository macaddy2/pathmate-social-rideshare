/**
 * AuthContext
 * Provides authentication state and methods throughout the app.
 *
 * When Supabase is configured, uses real Supabase auth.
 * When unconfigured (mock mode), provides an in-memory mock auth system
 * that stores sessions in localStorage so the app is fully navigable.
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
// MOCK AUTH HELPERS
// ============================================

const MOCK_STORAGE_KEY = 'pathmate_mock_auth';

interface MockAuthData {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  profile: UserProfile;
}

function createMockUser(email: string, displayName: string): { user: User; session: Session; profile: UserProfile } {
  const id = 'mock-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);

  const user = {
    id,
    email,
    app_metadata: {},
    user_metadata: { display_name: displayName },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    role: 'authenticated',
  } as unknown as User;

  const session = {
    access_token: 'mock-access-token-' + id,
    refresh_token: 'mock-refresh-token-' + id,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  } as unknown as Session;

  const profile: UserProfile = {
    id,
    email,
    displayName,
    createdAt: new Date(),
    emailVerified: true,
    phoneVerified: false,
    idVerified: false,
    defaultRole: 'RIDER' as UserRole,
    riderRating: 4.8,
    riderRatingCount: 12,
    driverRating: 4.9,
    driverRatingCount: 8,
  };

  return { user, session, profile };
}

function saveMockAuth(email: string, displayName: string): void {
  const data: MockAuthData = {
    user: { id: 'mock-' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12), email, displayName },
    profile: createMockUser(email, displayName).profile,
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
}

function loadMockAuth(): { user: User; session: Session; profile: UserProfile } | null {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return null;
    const data: MockAuthData = JSON.parse(raw);
    return createMockUser(data.user.email, data.user.displayName);
  } catch {
    return null;
  }
}

function clearMockAuth(): void {
  localStorage.removeItem(MOCK_STORAGE_KEY);
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

  // ── MOCK MODE ──────────────────────────────────────────
  const isMock = !isSupabaseConfigured();

  // Fetch user profile from database (with timeout so it can't hang forever)
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (isMock) {
      const saved = loadMockAuth();
      return saved?.profile || null;
    }

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
  }, [isMock]);

  // Create initial profile for new users
  const createProfile = useCallback(async (user: User, displayName: string): Promise<UserProfile | null> => {
    if (isMock) {
      const { profile } = createMockUser(user.email || '', displayName);
      return profile;
    }

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
  }, [isMock]);

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
      // ── Mock mode: restore from localStorage ──
      if (isMock) {
        const saved = loadMockAuth();
        if (mounted) {
          if (saved) {
            setState({ user: saved.user, profile: saved.profile, session: saved.session, loading: false, error: null });
          } else {
            setState({ user: null, profile: null, session: null, loading: false, error: null });
          }
        }
        return;
      }

      // ── Real Supabase mode ──
      try {
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
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Auth initialization error:', err);
        setState({ user: null, profile: null, session: null, loading: false, error: 'Failed to initialize authentication' });
      }
    };

    initAuth();

    // Listen for auth changes (real mode only)
    if (!isMock) {
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
    }

    return () => {
      mounted = false;
    };
  }, [fetchProfile, isMock]);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    if (isMock) {
      if (!email || !password) {
        const err = { message: 'Email and password are required', name: 'AuthError', status: 400 } as unknown as AuthError;
        setError(err.message);
        return { error: err };
      }
      // In mock mode, accept any email/password combo
      const displayName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const { user, session, profile } = createMockUser(email, displayName);
      saveMockAuth(email, displayName);
      setState({ user, profile, session, loading: false, error: null });
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    }
    return { error };
  }, [setError, isMock]);

  // Sign up with email/password
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (isMock) {
      if (!email || !password || !displayName) {
        const err = { message: 'All fields are required', name: 'AuthError', status: 400 } as unknown as AuthError;
        setError(err.message);
        return { error: err };
      }
      const { user, session, profile } = createMockUser(email, displayName);
      saveMockAuth(email, displayName);
      setState({ user, profile, session, loading: false, error: null });
      return { error: null };
    }

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

    if (data.user) {
      await createProfile(data.user, displayName);
    }

    setState((prev) => ({ ...prev, loading: false }));
    return { error: null };
  }, [setError, createProfile, isMock]);

  // Sign out
  const signOut = useCallback(async () => {
    if (isMock) {
      clearMockAuth();
      setState({ user: null, profile: null, session: null, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,
    });
  }, [isMock]);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    if (isMock) {
      // In mock mode, simulate Google sign-in with a demo user
      const email = 'demo.user@gmail.com';
      const displayName = 'Demo User';
      const { user, session, profile } = createMockUser(email, displayName);
      saveMockAuth(email, displayName);
      setState({ user, profile, session, loading: false, error: null });
      return { error: null };
    }

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
  }, [setError, isMock]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { error: new Error('No user logged in') };
    }

    if (isMock) {
      // Update local mock profile
      setState((prev) => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : prev.profile,
      }));
      // Persist display name change
      if (updates.displayName && state.profile) {
        saveMockAuth(state.profile.email, updates.displayName);
      }
      return { error: null };
    }

    try {
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

      await refreshProfile();

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  }, [state.user, state.profile, refreshProfile, isMock]);

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
