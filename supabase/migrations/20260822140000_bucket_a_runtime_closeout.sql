-- Bucket A runtime closeout.
-- Apply after 20260822130000_bucket_a_security_hardening.sql.
-- This migration deliberately does not configure secrets, call payment providers,
-- or change any cloud project.

BEGIN;

-- A narrow, read-only projection for matching and ride cards. Full profiles stay
-- owner-only under the users table RLS policy.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT
  id,
  display_name,
  avatar_url,
  rider_rating,
  rider_rating_count,
  driver_rating,
  driver_rating_count,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color
FROM public.users;

REVOKE ALL ON public.public_profiles FROM PUBLIC, anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Booking creation must set price, driver, currency, and available seats from
-- the locked ride row rather than trusting the client payload.
DROP POLICY IF EXISTS "Riders can create bookings" ON public.bookings;
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_booking(
  p_ride_id uuid,
  p_pickup geography,
  p_dropoff geography,
  p_pickup_address text,
  p_dropoff_address text,
  p_seats integer DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rider_id uuid := auth.uid();
  v_driver_id uuid;
  v_price_per_seat numeric(10, 2);
  v_currency text;
  v_available integer;
  v_booking_id uuid;
BEGIN
  IF v_rider_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_seats IS NULL OR p_seats < 1 THEN
    RAISE EXCEPTION 'invalid_seat_count';
  END IF;

  SELECT driver_id, price_per_seat, currency, seats_available
    INTO v_driver_id, v_price_per_seat, v_currency, v_available
  FROM public.rides
  WHERE id = p_ride_id AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ride_not_active';
  END IF;
  IF v_driver_id = v_rider_id THEN
    RAISE EXCEPTION 'cannot_book_own_ride';
  END IF;
  IF v_available < p_seats THEN
    RAISE EXCEPTION 'insufficient_seats';
  END IF;

  UPDATE public.rides
  SET seats_available = seats_available - p_seats
  WHERE id = p_ride_id;

  INSERT INTO public.bookings (
    ride_id, rider_id, driver_id, pickup, dropoff, pickup_address,
    dropoff_address, price, currency, seats_booked, status, payment_status
  ) VALUES (
    p_ride_id, v_rider_id, v_driver_id, p_pickup, p_dropoff,
    p_pickup_address, p_dropoff_address, v_price_per_seat * p_seats,
    v_currency, p_seats, 'pending', 'pending'
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_booking(
  p_booking_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_booking public.bookings%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;
  IF v_actor_id NOT IN (v_booking.rider_id, v_booking.driver_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_status = 'accepted'
     AND v_actor_id = v_booking.driver_id
     AND v_booking.status = 'pending' THEN
    UPDATE public.bookings SET status = 'accepted', accepted_at = now()
    WHERE id = v_booking.id;
  ELSIF p_status = 'driver_arrived'
     AND v_actor_id = v_booking.driver_id
     AND v_booking.status = 'accepted' THEN
    UPDATE public.bookings SET status = 'driver_arrived'
    WHERE id = v_booking.id;
  ELSIF p_status = 'picked_up'
     AND v_actor_id = v_booking.driver_id
     AND v_booking.status = 'driver_arrived' THEN
    UPDATE public.bookings SET status = 'picked_up', picked_up_at = now()
    WHERE id = v_booking.id;
  ELSIF p_status = 'completed'
     AND v_actor_id = v_booking.driver_id
     AND v_booking.status = 'picked_up' THEN
    UPDATE public.bookings SET status = 'completed', completed_at = now()
    WHERE id = v_booking.id;
  ELSIF p_status = 'cancelled'
     AND (
       (v_actor_id = v_booking.rider_id AND v_booking.status IN ('pending', 'accepted'))
       OR (v_actor_id = v_booking.driver_id AND v_booking.status IN ('pending', 'accepted', 'driver_arrived', 'picked_up'))
     ) THEN
    UPDATE public.bookings
    SET status = 'cancelled', cancelled_at = now(), cancelled_by = v_actor_id
    WHERE id = v_booking.id;
    UPDATE public.rides
    SET seats_available = seats_available + v_booking.seats_booked
    WHERE id = v_booking.ride_id;
  ELSE
    RAISE EXCEPTION 'illegal_booking_transition';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_booking(uuid, geography, geography, text, text, integer)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transition_booking(uuid, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_booking(uuid, geography, geography, text, text, integer)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_booking(uuid, text)
  TO authenticated;

COMMIT;
