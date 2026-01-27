-- Phase 3: GDPR and Privacy Improvements
-- Addresses privacy concerns with IP address storage and consent defaults

-- =====================================================
-- 1. IP Address Privacy Fix
-- =====================================================

-- GDPR Issue: IP addresses are personal data under GDPR
-- Options:
-- A) Remove IP storage completely (recommended for most cases)
-- B) Hash IP addresses (still identifiable for abuse detection)
-- C) Keep but add retention policy + consent

-- Option A: Remove IP address column (Recommended)
-- Uncomment if you want to completely remove IP tracking:
-- ALTER TABLE email_tracking_events DROP COLUMN IF EXISTS ip_address;

-- Option B: Add IP address hashing (Balanced approach)
-- Keeps abuse detection capability while reducing privacy risk
CREATE OR REPLACE FUNCTION hash_ip_address(ip inet) 
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Hash IP with a per-day salt for basic abuse detection
  -- Same IP on same day = same hash, but cannot reverse
  RETURN encode(
    digest(
      ip::text || current_date::text || 'your-secret-salt-here',
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Add hashed_ip column
ALTER TABLE email_tracking_events 
ADD COLUMN IF NOT EXISTS hashed_ip text;

-- Migrate existing data
UPDATE email_tracking_events 
SET hashed_ip = hash_ip_address(ip_address)
WHERE ip_address IS NOT NULL AND hashed_ip IS NULL;

-- Drop the plain IP column
ALTER TABLE email_tracking_events 
DROP COLUMN IF EXISTS ip_address;

-- Option C: Add retention policy (if keeping IP addresses)
-- Automatically delete old tracking data after 90 days
-- CREATE OR REPLACE FUNCTION cleanup_old_email_tracking_events()
-- RETURNS void
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   DELETE FROM email_tracking_events
--   WHERE created_at < NOW() - INTERVAL '90 days';
-- END;
-- $$;

-- =====================================================
-- 2. GDPR Consent Defaults Fix
-- =====================================================

-- Ensure new members have explicit consent = false by default
-- They must opt-in, not opt-out

-- First, add the column if it doesn't exist
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false;

-- Set default for new records
ALTER TABLE members 
ALTER COLUMN gdpr_consent SET DEFAULT false;

-- Add NOT NULL constraint if it doesn't exist
DO $$
BEGIN
  -- First update any NULL values to false
  UPDATE members SET gdpr_consent = false WHERE gdpr_consent IS NULL;
  
  -- Then add NOT NULL constraint
  ALTER TABLE members 
  ALTER COLUMN gdpr_consent SET NOT NULL;
EXCEPTION
  WHEN others THEN
    -- If constraint already exists or other error, continue
    NULL;
END $$;

-- =====================================================
-- 3. Add Privacy Audit Trail
-- =====================================================

-- Track when users give/revoke consent
CREATE TABLE IF NOT EXISTS consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL, -- 'gdpr', 'marketing_email', 'data_processing'
  consented boolean NOT NULL,
  consented_at timestamptz DEFAULT NOW() NOT NULL,
  ip_hash text, -- Hashed IP for audit purposes
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_consent_log_member 
ON consent_log(member_id, consented_at DESC);

-- Function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only log if gdpr_consent actually changed
  IF OLD.gdpr_consent IS DISTINCT FROM NEW.gdpr_consent THEN
    INSERT INTO consent_log (
      member_id,
      consent_type,
      consented,
      consented_at
    ) VALUES (
      NEW.id,
      'gdpr',
      NEW.gdpr_consent,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS track_consent_changes ON members;
CREATE TRIGGER track_consent_changes
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();

-- =====================================================
-- 4. Data Minimization - Remove Unnecessary Data
-- =====================================================

-- Add metadata columns to track data retention
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS data_retention_date timestamptz;

-- Set retention date for inactive members (e.g., 2 years after last activity)
UPDATE members
SET data_retention_date = updated_at + INTERVAL '2 years'
WHERE data_retention_date IS NULL;

-- Function to anonymize old member data (run periodically)
CREATE OR REPLACE FUNCTION anonymize_old_members()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  anonymized_count integer := 0;
BEGIN
  -- Anonymize members past retention date who haven't logged in recently
  UPDATE members
  SET 
    email = 'anonymized_' || id::text || '@deleted.local',
    first_name = 'Anonymized',
    last_name = 'User',
    phone = NULL,
    address = NULL,
    postal_code = NULL,
    city = NULL,
    birth_date = NULL,
    notes = 'Data anonymized per GDPR retention policy'
  WHERE 
    data_retention_date < NOW()
    AND email NOT LIKE 'anonymized_%'
    AND updated_at < NOW() - INTERVAL '2 years';
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  
  RETURN anonymized_count;
END;
$$;

-- =====================================================
-- Verification
-- =====================================================

-- Check that ip_address is removed and hashed_ip exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'email_tracking_events'
  AND column_name IN ('ip_address', 'hashed_ip')
ORDER BY column_name;

-- Check gdpr_consent default
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
  AND column_name = 'gdpr_consent';

-- Count members without consent
SELECT 
  COUNT(*) as members_without_consent,
  COUNT(*) FILTER (WHERE gdpr_consent = true) as with_consent,
  COUNT(*) FILTER (WHERE gdpr_consent = false) as without_consent
FROM members;
