-- ============================================
-- PathMate Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- USERS TABLE
-- Extended user profile data
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,

  -- Verification status
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,

  -- Role preference
  default_role TEXT CHECK (default_role IN ('RIDER', 'DRIVER', 'BOTH')) DEFAULT 'RIDER',

  -- Vehicle info (for drivers)
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  vehicle_plate TEXT,

  -- Ratings
  rider_rating DECIMAL(2,1) DEFAULT 5.0,
  rider_rating_count INTEGER DEFAULT 0,
  driver_rating DECIMAL(2,1) DEFAULT 5.0,
  driver_rating_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RIDES TABLE
-- Driver-posted rides
-- ============================================

CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Route information
  origin GEOGRAPHY(POINT, 4326) NOT NULL,
  destination GEOGRAPHY(POINT, 4326) NOT NULL,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  route_polyline TEXT, -- Encoded polyline
  route_geometry GEOGRAPHY(LINESTRING, 4326), -- For spatial queries
  distance_meters INTEGER,
  duration_minutes INTEGER,

  -- Timing
  departure_time TIMESTAMPTZ NOT NULL,
  flexible_minutes INTEGER DEFAULT 15,

  -- Capacity & pricing
  seats_available INTEGER NOT NULL CHECK (seats_available > 0),
  seats_total INTEGER NOT NULL CHECK (seats_total > 0),
  price_per_seat DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',

  -- Detour tolerance
  max_detour_meters INTEGER DEFAULT 2000,
  max_detour_minutes INTEGER DEFAULT 15,

  -- Status
  status TEXT CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast location queries
CREATE INDEX IF NOT EXISTS idx_rides_origin ON public.rides USING GIST (origin);
CREATE INDEX IF NOT EXISTS idx_rides_destination ON public.rides USING GIST (destination);
CREATE INDEX IF NOT EXISTS idx_rides_route ON public.rides USING GIST (route_geometry);
CREATE INDEX IF NOT EXISTS idx_rides_departure ON public.rides (departure_time);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides (status);

-- ============================================
-- RIDE_REQUESTS TABLE
-- Rider search requests
-- ============================================

CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Locations
  pickup GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,

  -- Timing
  requested_time TIMESTAMPTZ NOT NULL,
  flexible_minutes INTEGER DEFAULT 30,

  -- Status
  status TEXT CHECK (status IN ('searching', 'matched', 'cancelled')) DEFAULT 'searching',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_pickup ON public.ride_requests USING GIST (pickup);
CREATE INDEX IF NOT EXISTS idx_requests_dropoff ON public.ride_requests USING GIST (dropoff);

-- ============================================
-- BOOKINGS TABLE
-- Confirmed ride matches
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Pickup/dropoff points (may differ from rider's original request)
  pickup GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff GEOGRAPHY(POINT, 4326) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,

  -- Match details
  detour_minutes INTEGER,
  match_score DECIMAL(4,2),

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  seats_booked INTEGER DEFAULT 1,

  -- Status flow: pending -> accepted -> driver_arrived -> picked_up -> completed
  status TEXT CHECK (status IN ('pending', 'accepted', 'driver_arrived', 'picked_up', 'completed', 'cancelled')) DEFAULT 'pending',

  -- Payment
  payment_status TEXT CHECK (payment_status IN ('pending', 'rider_confirmed', 'driver_confirmed', 'completed', 'disputed')) DEFAULT 'pending',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_ride ON public.bookings (ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_rider ON public.bookings (rider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver ON public.bookings (driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);

-- ============================================
-- RATINGS TABLE
-- Post-ride ratings
-- ============================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Rating details
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  role TEXT NOT NULL CHECK (role IN ('RIDER', 'DRIVER')), -- Who is being rated

  -- Criteria ratings (1-5)
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  safety INTEGER CHECK (safety >= 1 AND safety <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),

  -- Optional comment
  comment TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate ratings
  UNIQUE(booking_id, from_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_to_user ON public.ratings (to_user_id);

-- ============================================
-- MESSAGES TABLE
-- Chat messages between users
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'location', 'image', 'system')) DEFAULT 'text',

  -- Read status
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_booking ON public.messages (booking_id, created_at);

-- ============================================
-- EMERGENCY_CONTACTS TABLE
-- User's trusted contacts for trip sharing
-- ============================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,

  -- Auto-share settings
  auto_share_rides BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_user ON public.emergency_contacts (user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Users: Can read all, update own
CREATE POLICY "Users can read all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Rides: Can read active, manage own
CREATE POLICY "Anyone can read active rides" ON public.rides
  FOR SELECT USING (status = 'active' OR driver_id = auth.uid());

CREATE POLICY "Drivers can create rides" ON public.rides
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own rides" ON public.rides
  FOR UPDATE USING (auth.uid() = driver_id);

-- Ride Requests: Only own
CREATE POLICY "Users manage own requests" ON public.ride_requests
  FOR ALL USING (auth.uid() = rider_id);

-- Bookings: Participants only
CREATE POLICY "Booking participants can read" ON public.bookings
  FOR SELECT USING (auth.uid() IN (rider_id, driver_id));

CREATE POLICY "Riders can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Participants can update bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() IN (rider_id, driver_id));

-- Ratings: Participants can read, creator can insert
CREATE POLICY "Booking participants can read ratings" ON public.ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = ratings.booking_id
      AND auth.uid() IN (bookings.rider_id, bookings.driver_id)
    )
  );

CREATE POLICY "Users can create ratings for their bookings" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_id
      AND auth.uid() IN (bookings.rider_id, bookings.driver_id)
    )
  );

-- Messages: Booking participants only
CREATE POLICY "Booking participants can read messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
      AND auth.uid() IN (bookings.rider_id, bookings.driver_id)
    )
  );

CREATE POLICY "Booking participants can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_id
      AND auth.uid() IN (bookings.rider_id, bookings.driver_id)
    )
  );

-- Emergency Contacts: Own only
CREATE POLICY "Users manage own emergency contacts" ON public.emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update user rating when new rating is created
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'DRIVER' THEN
    UPDATE public.users SET
      driver_rating = (
        SELECT ROUND(AVG(score)::numeric, 1)
        FROM public.ratings
        WHERE to_user_id = NEW.to_user_id AND role = 'DRIVER'
      ),
      driver_rating_count = (
        SELECT COUNT(*)
        FROM public.ratings
        WHERE to_user_id = NEW.to_user_id AND role = 'DRIVER'
      )
    WHERE id = NEW.to_user_id;
  ELSE
    UPDATE public.users SET
      rider_rating = (
        SELECT ROUND(AVG(score)::numeric, 1)
        FROM public.ratings
        WHERE to_user_id = NEW.to_user_id AND role = 'RIDER'
      ),
      rider_rating_count = (
        SELECT COUNT(*)
        FROM public.ratings
        WHERE to_user_id = NEW.to_user_id AND role = 'RIDER'
      )
    WHERE id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_insert
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SPATIAL HELPER FUNCTION
-- Find rides where pickup & dropoff are near route AND in correct order
-- ============================================

CREATE OR REPLACE FUNCTION find_matching_rides(
  p_pickup GEOGRAPHY,
  p_dropoff GEOGRAPHY,
  p_requested_time TIMESTAMPTZ,
  p_max_time_diff_minutes INTEGER DEFAULT 60,
  p_max_detour_meters INTEGER DEFAULT 3000
)
RETURNS TABLE (
  ride_id UUID,
  driver_id UUID,
  pickup_distance_meters DOUBLE PRECISION,
  dropoff_distance_meters DOUBLE PRECISION,
  pickup_position DOUBLE PRECISION,
  dropoff_position DOUBLE PRECISION,
  departure_time TIMESTAMPTZ,
  price_per_seat DECIMAL,
  currency TEXT,
  seats_available INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as ride_id,
    r.driver_id,
    ST_Distance(p_pickup, r.route_geometry) as pickup_distance_meters,
    ST_Distance(p_dropoff, r.route_geometry) as dropoff_distance_meters,
    ST_LineLocatePoint(r.route_geometry::geometry, p_pickup::geometry) as pickup_position,
    ST_LineLocatePoint(r.route_geometry::geometry, p_dropoff::geometry) as dropoff_position,
    r.departure_time,
    r.price_per_seat,
    r.currency,
    r.seats_available
  FROM public.rides r
  WHERE
    r.status = 'active'
    AND r.seats_available > 0
    -- Time window filter
    AND r.departure_time BETWEEN
      p_requested_time - (p_max_time_diff_minutes || ' minutes')::INTERVAL
      AND p_requested_time + (p_max_time_diff_minutes || ' minutes')::INTERVAL
    -- Pickup is within detour tolerance
    AND ST_DWithin(p_pickup, r.route_geometry, p_max_detour_meters)
    -- Dropoff is within detour tolerance
    AND ST_DWithin(p_dropoff, r.route_geometry, p_max_detour_meters)
    -- CRITICAL: Pickup comes BEFORE dropoff (same direction)
    AND ST_LineLocatePoint(r.route_geometry::geometry, p_pickup::geometry)
      < ST_LineLocatePoint(r.route_geometry::geometry, p_dropoff::geometry)
  ORDER BY
    -- Prefer rides with less total detour
    (ST_Distance(p_pickup, r.route_geometry) + ST_Distance(p_dropoff, r.route_geometry)) ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REALTIME CONFIGURATION
-- Enable realtime for bookings and messages
-- ============================================

-- Note: Run these in Supabase Dashboard > Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert test data
/*
INSERT INTO public.users (id, email, display_name, default_role, vehicle_make, vehicle_model, vehicle_year, vehicle_color, driver_rating)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'driver1@test.com', 'Sarah Johnson', 'DRIVER', 'Toyota', 'Camry', 2022, 'Silver', 4.8),
  ('00000000-0000-0000-0000-000000000002', 'driver2@test.com', 'Michael Okonkwo', 'DRIVER', 'Honda', 'Accord', 2021, 'Black', 4.9),
  ('00000000-0000-0000-0000-000000000003', 'rider1@test.com', 'Test Rider', 'RIDER', NULL, NULL, NULL, NULL, 5.0);
*/
