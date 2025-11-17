-- Create saved_schedules table if it doesn't exist
-- Run this SQL in your Supabase SQL editor if you're getting the error:
-- "Could not find the table 'public.saved_schedules' in the schema cache"

CREATE TABLE IF NOT EXISTS saved_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_schedules_date ON saved_schedules(date);

