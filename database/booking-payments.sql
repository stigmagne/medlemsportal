-- Booking Payments Schema
-- Adds support for tracking payments and Stripe integration

ALTER TABLE resource_bookings
ADD COLUMN IF NOT EXISTS total_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS payment_due_date timestamptz;

-- Index for fast lookup by Stripe Session ID (critical for webhooks)
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON resource_bookings(stripe_session_id);
