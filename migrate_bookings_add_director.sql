-- Migration: Add director_id to bookings and make voice_actor_id_2 required
-- Run this if you already have a bookings table

-- First, add director_id column (nullable initially)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS director_id BIGINT REFERENCES directors(id);

-- Make voice_actor_id_2 NOT NULL (you may need to update existing data first)
-- If you have existing bookings with null voice_actor_id_2, you'll need to handle them first
-- ALTER TABLE bookings ALTER COLUMN voice_actor_id_2 SET NOT NULL;

-- Make director_id NOT NULL (you may need to update existing data first)
-- If you have existing bookings with null director_id, you'll need to handle them first
-- ALTER TABLE bookings ALTER COLUMN director_id SET NOT NULL;

-- Note: Uncomment the NOT NULL constraints after ensuring all existing bookings have valid values

