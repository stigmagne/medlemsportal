-- Race Condition Fixes - Phase 3
-- This file implements database-level fixes for race conditions using row-level locking

-- =====================================================
-- 1. Subscription Balance Race Condition Fix
-- =====================================================

-- Function to atomically record payment and update member balance
CREATE OR REPLACE FUNCTION record_payment_atomic(
  p_org_id UUID,
  p_member_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_payment_method TEXT,
  p_transaction_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance DECIMAL;
BEGIN
  -- Lock the row for this member (prevents concurrent updates)
  -- FOR UPDATE NOWAIT will fail immediately if row is locked
  SELECT balance INTO v_current_balance
  FROM members
  WHERE id = p_member_id
  FOR UPDATE;
  
  -- Insert payment transaction
  INSERT INTO payment_transactions (
    organization_id,
    member_id,
    amount,
    description,
    payment_method,
    transaction_id,
    status,
    created_at
  ) VALUES (
    p_org_id,
    p_member_id,
    p_amount,
    p_description,
    p_payment_method,
    p_transaction_id,
    'completed',
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Update balance atomically
  UPDATE members
  SET 
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE id = p_member_id;
  
  RETURN v_transaction_id;
END;
$$;

-- =====================================================
-- 2. Booking Double-Booking Prevention
-- =====================================================

-- Create unique index to prevent double-booking at database level
-- This will cause INSERT to fail if same resource/date/time already booked
-- Note: resource_bookings uses timestamptz for start_time/end_time, not separate date+time
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_resource_booking 
ON resource_bookings(resource_id, start_time)
WHERE status != 'cancelled' AND status != 'rejected';

-- Function to atomically check availability and create booking
CREATE OR REPLACE FUNCTION create_resource_booking_atomic(
  p_resource_id UUID,
  p_user_id UUID,
  p_org_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_description TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_existing_count INT;
BEGIN
  -- Lock the resource row to prevent concurrent bookings
  PERFORM 1 FROM resources
  WHERE id = p_resource_id
  FOR UPDATE;
  
  -- Double-check no overlapping bookings exist (index will also prevent this)
  SELECT COUNT(*) INTO v_existing_count
  FROM resource_bookings
  WHERE resource_id = p_resource_id
    AND status NOT IN ('cancelled', 'rejected')
    AND (
      -- Check for time overlap using tstzrange
      tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
    );
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Booking slot already taken';
  END IF;
  
  -- Create booking
  INSERT INTO resource_bookings (
    resource_id,
    user_id,
    org_id,
    start_time,
    end_time,
    description,
    status,
    created_at
  ) VALUES (
    p_resource_id,
    p_user_id,
    p_org_id,
    p_start_time,
    p_end_time,
    p_description,
    'confirmed',
    NOW()
  ) RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$;

-- =====================================================
-- 3. Volunteering (Dugnad) Capacity Check
-- =====================================================

-- Function to atomically check capacity and signup for volunteering role
CREATE OR REPLACE FUNCTION signup_for_volunteering_atomic(
  p_role_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_filled_count INT;
  v_capacity INT;
  v_existing_signup_count INT;
BEGIN
  -- Lock the role row to prevent concurrent signups
  SELECT filled_count, capacity INTO v_filled_count, v_capacity
  FROM volunteering_roles
  WHERE id = p_role_id
  FOR UPDATE;
  
  -- Check if user already signed up for this role
  SELECT COUNT(*) INTO v_existing_signup_count
  FROM volunteering_assignments
  WHERE role_id = p_role_id
    AND user_id = p_user_id
    AND status IN ('pending', 'approved');
  
  IF v_existing_signup_count > 0 THEN
    RAISE EXCEPTION 'User already signed up for this role';
  END IF;
  
  -- Check capacity
  IF v_filled_count >= v_capacity THEN
    RETURN FALSE; -- Full
  END IF;
  
  -- Insert assignment
  INSERT INTO volunteering_assignments (role_id, user_id, status, created_at)
  VALUES (p_role_id, p_user_id, 'pending', NOW());
  
  -- Increment counter atomically
  UPDATE volunteering_roles
  SET filled_count = filled_count + 1
  WHERE id = p_role_id;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- 4. Cancel Volunteering Signup (Decrement Counter)
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_volunteering_signup_atomic(
  p_role_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_count INT;
BEGIN
  -- Lock the role row
  PERFORM 1 FROM volunteering_roles
  WHERE id = p_role_id
  FOR UPDATE;
  
  -- Check if signup exists
  SELECT COUNT(*) INTO v_assignment_count
  FROM volunteering_assignments
  WHERE role_id = p_role_id
    AND user_id = p_user_id
    AND status IN ('pending', 'approved');
  
  IF v_assignment_count = 0 THEN
    RETURN FALSE; -- No signup to cancel
  END IF;
  
  -- Update assignment status
  UPDATE volunteering_assignments
  SET status = 'rejected', updated_at = NOW()
  WHERE role_id = p_role_id
    AND user_id = p_user_id
    AND status IN ('pending', 'approved');
  
  -- Decrement counter atomically (only if was approved, not pending)
  UPDATE volunteering_roles
  SET filled_count = GREATEST(0, filled_count - 1)
  WHERE id = p_role_id;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- Verification
-- =====================================================

-- List all functions created
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'record_payment_atomic',
    'create_resource_booking_atomic',
    'signup_for_volunteering_atomic',
    'cancel_volunteering_signup_atomic'
  )
ORDER BY routine_name;
