-- Drop tables if they exist (if you already created them)
DROP TABLE IF EXISTS saved_schedules;
DROP TABLE IF EXISTS bookings;

-- Create bookings table WITHOUT unique constraint
-- Note: Both voice_actor_id and room_id are BIGINT to match your existing schema
-- Now supports TWO voice actors per slot and a director
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_actor_id BIGINT NOT NULL REFERENCES voice_actors(id),
  voice_actor_id_2 BIGINT NOT NULL REFERENCES voice_actors(id),
  director_id BIGINT NOT NULL REFERENCES directors(id),
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  date DATE NOT NULL,
  am_start_time TIME,
  am_end_time TIME,
  pm_start_time TIME,
  pm_end_time TIME,
  notes TEXT,
  am_emails_sent BOOLEAN NOT NULL DEFAULT FALSE,
  pm_emails_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create saved_schedules table for saving schedule snapshots
CREATE TABLE saved_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Create indexes for faster queries
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_room_date ON bookings(room_id, date);
CREATE INDEX idx_saved_schedules_date ON saved_schedules(date);

