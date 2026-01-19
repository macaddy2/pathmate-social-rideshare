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
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
          default_role: 'RIDER' | 'DRIVER' | 'GUEST';
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_year: number | null;
          vehicle_color: string | null;
          license_plate: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      rides: {
        Row: {
          id: string;
          driver_id: string;
          origin_address: string;
          origin_lat: number;
          origin_lng: number;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          route_polyline: string | null;
          departure_time: string;
          flexible_minutes: number;
          estimated_duration_minutes: number | null;
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
      bookings: {
        Row: {
          id: string;
          ride_id: string;
          rider_id: string;
          request_id: string | null;
          pickup_lat: number;
          pickup_lng: number;
          pickup_address: string;
          dropoff_lat: number;
          dropoff_lng: number;
          dropoff_address: string;
          detour_meters: number;
          detour_minutes: number;
          price: number;
          currency: string;
          status: string;
          payment_status: string;
          payment_method: string | null;
          rider_confirmed_payment: boolean;
          driver_confirmed_payment: boolean;
          requested_at: string;
          accepted_at: string | null;
          pickup_at: string | null;
          dropoff_at: string | null;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'requested_at'>;
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
      };
      ratings: {
        Row: {
          id: string;
          booking_id: string;
          from_user_id: string;
          to_user_id: string;
          score: number;
          punctuality_score: number | null;
          communication_score: number | null;
          safety_score: number | null;
          vehicle_condition_score: number | null;
          comment: string | null;
          role_rated: 'RIDER' | 'DRIVER';
          positive_tags: string[] | null;
          negative_tags: string[] | null;
          would_ride_again: boolean;
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
          is_ai_generated: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
}

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
