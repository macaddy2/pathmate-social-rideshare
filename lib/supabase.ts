import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.'
  );
}

// Create and export the Supabase client
// Use a placeholder URL when unconfigured so the client can be created safely
// (actual queries will be short-circuited by isSupabaseConfigured() in dataService)
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================
// DATABASE TYPES (for TypeScript)
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          email_verified: boolean;
          phone_verified: boolean;
          id_verified: boolean;
          default_role: 'RIDER' | 'DRIVER' | 'BOTH';
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
          vehicle_color: string | null;
          vehicle_plate: string | null;
          rider_rating: number;
          rider_rating_count: number;
          driver_rating: number;
          driver_rating_count: number;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at' | 'rider_rating' | 'rider_rating_count' | 'driver_rating' | 'driver_rating_count'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      rides: {
        Row: {
          id: string;
          driver_id: string;
          origin_address: string;
          destination_address: string;
          route_polyline: string | null;
          distance_meters: number | null;
          duration_minutes: number | null;
          departure_time: string;
          flexible_minutes: number;
          seats_available: number;
          seats_total: number;
          price_per_seat: number;
          currency: string;
          max_detour_meters: number;
          max_detour_minutes: number;
          status: 'active' | 'in_progress' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['rides']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['rides']['Insert']>;
      };
      ride_requests: {
        Row: {
          id: string;
          rider_id: string;
          pickup_address: string;
          dropoff_address: string;
          requested_time: string;
          flexible_minutes: number;
          status: 'searching' | 'matched' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ride_requests']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ride_requests']['Insert']>;
      };
      bookings: {
        Row: {
          id: string;
          ride_id: string;
          rider_id: string;
          driver_id: string;
          pickup_address: string | null;
          dropoff_address: string | null;
          detour_minutes: number | null;
          match_score: number | null;
          price: number;
          currency: string;
          seats_booked: number;
          status: 'pending' | 'accepted' | 'driver_arrived' | 'picked_up' | 'completed' | 'cancelled';
          payment_status: 'pending' | 'rider_confirmed' | 'driver_confirmed' | 'completed' | 'disputed';
          created_at: string;
          accepted_at: string | null;
          picked_up_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      ratings: {
        Row: {
          id: string;
          booking_id: string;
          from_user_id: string;
          to_user_id: string;
          score: number;
          role: 'RIDER' | 'DRIVER';
          punctuality: number | null;
          communication: number | null;
          safety: number | null;
          cleanliness: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ratings']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          booking_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'location' | 'image' | 'system';
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          email: string | null;
          relationship: string | null;
          auto_share_rides: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['emergency_contacts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string | null;
          from_user_id: string;
          to_user_id: string;
          amount: number;
          currency: string;
          provider: 'paystack' | 'stripe';
          provider_ref: string;
          status: 'pending' | 'escrow' | 'completed' | 'refunded' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
      recurring_rides: {
        Row: {
          id: string;
          user_id: string;
          origin: string;
          origin_lat: number;
          origin_lng: number;
          destination: string;
          destination_lat: number;
          destination_lng: number;
          role: 'rider' | 'driver';
          schedule_days: string[];
          schedule_time: string;
          is_active: boolean;
          price_per_seat: number | null;
          seats_available: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recurring_rides']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['recurring_rides']['Insert']>;
      };
      wallets: {
        Row: {
          user_id: string;
          balance: number;
          currency: string;
          last_updated: string;
        };
        Insert: Database['public']['Tables']['wallets']['Row'];
        Update: Partial<Database['public']['Tables']['wallets']['Row']>;
      };
    };
  };
}

// ============================================
// SUPABASE AVAILABILITY CHECK
// ============================================

/**
 * Check if Supabase is configured (env vars present)
 * Used to determine if we should attempt Supabase queries or use mock fallback
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Get the current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
