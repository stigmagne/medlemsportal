
-- Enable btree_gist extension for scalar + range combined constraints
create extension if not exists btree_gist;

-- Add exclusion constraint to prevent overlapping bookings for the same resource
-- We check:
-- 1. status is 'confirmed' (we only care about confirmed bookings colliding) 
--    Actually, 'pending' bookings might also want to block? 
--    Let's block if status is NOT 'cancelled' and NOT 'rejected'.
--    Or simpler: if we have a robust status flow, maybe just checking 'confirmed'.
--    But if I double-click buy, both might be inserted as 'confirmed' or 'pending'.
--    Let's enforce no overlap for any non-cancelled booking.

-- NOTE: Supabase exclusion constraints with WHERE clause can be tricky.
-- Simpler: resource_id = resource_id AND time overlaps.
alter table resource_bookings
add constraint no_overlap
exclude using gist (
  resource_id with =,
  tstzrange(start_time, end_time) with &&
)
where (status != 'cancelled' and status != 'rejected');
