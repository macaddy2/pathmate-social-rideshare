-- Bucket A security hardening for the existing PathMate schema.
-- Apply only after supabase/schema.sql (or an equivalent baseline migration)
-- has been applied to the staging project. This file intentionally does not
-- create cloud secrets, call external services, or change production.

BEGIN;

DO $$
DECLARE
  missing_tables TEXT;
BEGIN
  SELECT string_agg(required_table, ', ' ORDER BY required_table)
    INTO missing_tables
  FROM unnest(ARRAY[
    'users', 'rides', 'ride_requests', 'bookings', 'ratings', 'messages',
    'emergency_contacts', 'notifications', 'payments', 'recurring_rides', 'wallets'
  ]) AS required(required_table)
  WHERE to_regclass('public.' || required_table) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION
      'Bucket A requires the baseline PathMate schema first; missing public tables: %',
      missing_tables;
  END IF;
END;
$$;

-- Every exposed table is RLS-protected and API access is authenticated unless
-- a narrower policy below explicitly grants it.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Profiles contain contact details and verification state. Until a dedicated
-- public-profile projection exists, only the authenticated owner can read or
-- update a profile. Client updates are limited to user-editable columns.
DROP POLICY IF EXISTS "Users can read all profiles" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read own profile" ON public.users;
CREATE POLICY "Authenticated users can read own profile" ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
REVOKE INSERT ON public.users FROM anon, authenticated;
REVOKE UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (
  display_name, phone, avatar_url, default_role,
  vehicle_make, vehicle_model, vehicle_year, vehicle_color, vehicle_plate
) ON public.users TO authenticated;

-- Rides and requests are authenticated user data. Every update now retains
-- ownership; anonymous clients cannot enumerate or create them.
DROP POLICY IF EXISTS "Anyone can read active rides" ON public.rides;
DROP POLICY IF EXISTS "Authenticated users can read active rides" ON public.rides;
CREATE POLICY "Authenticated users can read active rides" ON public.rides
  FOR SELECT TO authenticated
  USING (status = 'active' OR (SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Drivers can create rides" ON public.rides;
CREATE POLICY "Drivers can create rides" ON public.rides
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Drivers can update own rides" ON public.rides;
CREATE POLICY "Drivers can update own rides" ON public.rides
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = driver_id)
  WITH CHECK ((SELECT auth.uid()) = driver_id);

DROP POLICY IF EXISTS "Users manage own requests" ON public.ride_requests;
CREATE POLICY "Users manage own requests" ON public.ride_requests
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = rider_id)
  WITH CHECK ((SELECT auth.uid()) = rider_id);

-- Booking state and payment fields must not be client-controlled. Reads remain
-- participant-only; inserts validate the selected driver against the ride.
DROP POLICY IF EXISTS "Booking participants can read" ON public.bookings;
CREATE POLICY "Booking participants can read" ON public.bookings
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (rider_id, driver_id));

DROP POLICY IF EXISTS "Riders can create bookings" ON public.bookings;
CREATE POLICY "Riders can create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = rider_id
    AND EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = bookings.ride_id
        AND rides.driver_id = bookings.driver_id
    )
  );

DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon, authenticated;
GRANT INSERT ON public.bookings TO authenticated;

-- Ratings can only be submitted by a booking participant for the other
-- participant. There is intentionally no client UPDATE or DELETE policy.
DROP POLICY IF EXISTS "Booking participants can read ratings" ON public.ratings;
CREATE POLICY "Booking participants can read ratings" ON public.ratings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = ratings.booking_id
        AND (SELECT auth.uid()) IN (bookings.rider_id, bookings.driver_id)
    )
  );

DROP POLICY IF EXISTS "Users can create ratings for their bookings" ON public.ratings;
CREATE POLICY "Users can create ratings for their bookings" ON public.ratings
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = from_user_id
    AND to_user_id <> from_user_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = ratings.booking_id
        AND (SELECT auth.uid()) IN (bookings.rider_id, bookings.driver_id)
        AND to_user_id IN (bookings.rider_id, bookings.driver_id)
    )
  );
REVOKE UPDATE, DELETE ON public.ratings FROM anon, authenticated;

-- Messages are private to booking participants and sender ownership is fixed.
DROP POLICY IF EXISTS "Booking participants can read messages" ON public.messages;
CREATE POLICY "Booking participants can read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
        AND (SELECT auth.uid()) IN (bookings.rider_id, bookings.driver_id)
    )
  );

DROP POLICY IF EXISTS "Booking participants can send messages" ON public.messages;
CREATE POLICY "Booking participants can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
        AND (SELECT auth.uid()) IN (bookings.rider_id, bookings.driver_id)
    )
  );

DROP POLICY IF EXISTS "Users manage own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users manage own emergency contacts" ON public.emergency_contacts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Notifications may be read and acknowledged by their owner. Creation is a
-- server responsibility; the former WITH CHECK (true) policy allowed spoofing.
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT ON public.notifications FROM anon, authenticated;

-- Payment records and wallet balances are server-owned. Keep participant reads
-- only and fail closed until a verified payment/webhook backend is connected.
DROP POLICY IF EXISTS "Payment participants can read" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Payment participants can read" ON public.payments
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (from_user_id, to_user_id));
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;

DROP POLICY IF EXISTS "Users manage own recurring rides" ON public.recurring_rides;
CREATE POLICY "Users manage own recurring rides" ON public.recurring_rides
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can read own wallet" ON public.wallets
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.wallets FROM anon, authenticated;

-- Restrict direct invocation of helper functions. The signup trigger remains
-- usable by auth because it fires as part of the trigger, not as a public RPC.
ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_user_rating() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.find_matching_rides(geography, geography, timestamptz, integer, integer)
  SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_matching_rides(geography, geography, timestamptz, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_matching_rides(geography, geography, timestamptz, integer, integer)
  TO authenticated;

COMMIT;
