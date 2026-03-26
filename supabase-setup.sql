-- PawAlert Database Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/thlsshecigejarsngumy/sql)

-- 1. Reports table (rescue tickets submitted by citizens)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  species TEXT NOT NULL,
  description TEXT,
  lat DECIMAL,
  lng DECIMAL,
  location TEXT,
  severity INTEGER,
  severity_label TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Animals table (shelter animal profiles)
CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  name TEXT,
  species TEXT,
  breed TEXT,
  age TEXT,
  gender TEXT,
  status TEXT DEFAULT 'RESCUED',
  rescue_date TEXT,
  location TEXT,
  shelter TEXT,
  image_emoji TEXT
);

-- 3. NGOs table (NGO verification queue)
CREATE TABLE IF NOT EXISTS ngos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  applied_on TEXT,
  documents TEXT,
  documents_ok BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Pending'
);

-- 4. Seed initial animals
INSERT INTO animals (id, name, species, breed, age, gender, status, rescue_date, location, shelter, image_emoji)
VALUES
  ('PAW-DOG-0291', 'Bruno', 'Dog', 'Mixed', '~2 yrs', 'Male', 'UNDER TREATMENT', '14 Jan 2025', 'Lajpat Nagar, Delhi', 'Friendicoes SECA', '🐕'),
  ('PAW-DOG-0285', 'Coco', 'Dog', 'Indie', '~1 yr', 'Female', 'AVAILABLE FOR ADOPTION', '08 Jan 2025', 'Sarojini Nagar, Delhi', 'Friendicoes SECA', '🐕'),
  ('PAW-CAT-0102', 'Whiskers', 'Cat', 'Tabby Mix', '~3 yrs', 'Male', 'RECOVERING', '10 Jan 2025', 'Connaught Place, Delhi', 'CARE India', '🐈'),
  ('PAW-COW-0058', 'Ganga', 'Cow', 'Desi', '~5 yrs', 'Female', 'UNDER TREATMENT', '12 Jan 2025', 'Karol Bagh, Delhi', 'Animal Aid Unlimited', '🐄'),
  ('PAW-BRD-0034', 'Chirpy', 'Bird', 'Pigeon', 'Unknown', 'Unknown', 'AVAILABLE FOR ADOPTION', '11 Jan 2025', 'Rohini, Delhi', 'Wildlife SOS', '🐦')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed initial NGOs
INSERT INTO ngos (name, city, applied_on, documents, documents_ok, status)
VALUES
  ('Friendicoes SECA', 'Delhi', '10 Jan 2025', 'All submitted', true, 'Pending'),
  ('CARE India', 'Mumbai', '12 Jan 2025', 'PAN missing', false, 'Incomplete'),
  ('Animal Aid Unlimited', 'Udaipur', '13 Jan 2025', 'All submitted', true, 'Pending')
ON CONFLICT DO NOTHING;

-- 6. Disable Row Level Security (for prototype - public read/write)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Public insert reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read animals" ON animals FOR SELECT USING (true);
CREATE POLICY "Public read ngos" ON ngos FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON ngos FOR ALL USING (true);
CREATE POLICY "Service role update ngos" ON ngos FOR UPDATE USING (true);
