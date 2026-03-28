-- =====================================================================
-- PawAlert — FULL DATABASE RESET
-- Run this ENTIRE script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/thlsshecigejarsngumy/sql
-- =====================================================================

-- ========================
-- 1. DROP everything first
-- ========================

-- Drop RLS policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Public read reports" ON reports;
DROP POLICY IF EXISTS "Public insert reports" ON reports;
DROP POLICY IF EXISTS "Public update reports" ON reports;
DROP POLICY IF EXISTS "Public read animals" ON animals;
DROP POLICY IF EXISTS "Public read ngos" ON ngos;
DROP POLICY IF EXISTS "Service role full access" ON ngos;
DROP POLICY IF EXISTS "Service role update ngos" ON ngos;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Service role profiles full" ON profiles;
DROP POLICY IF EXISTS "Users read own application" ON ngo_applications;

-- Drop tables
DROP TABLE IF EXISTS ngo_applications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS animals CASCADE;
DROP TABLE IF EXISTS ngos CASCADE;

-- ========================
-- 2. CREATE tables fresh
-- ========================

-- Profiles table (linked to auth.users via id)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',       -- 'user', 'ngo', 'admin'
  ngo_status TEXT DEFAULT NULL,            -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table (rescue tickets)
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  species TEXT NOT NULL,
  description TEXT,
  lat DECIMAL,
  lng DECIMAL,
  location TEXT,
  severity INTEGER,
  severity_label TEXT,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  ai_description TEXT,
  injury_tags TEXT[],
  assigned_ngo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animals table
CREATE TABLE animals (
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
  image_emoji TEXT,
  ngo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- NGOs table (legacy verification queue)
CREATE TABLE ngos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  applied_on TEXT,
  documents TEXT,
  documents_ok BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'Pending'
);

-- NGO Applications table (new registration flow)
CREATE TABLE ngo_applications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  org_name TEXT NOT NULL,
  description TEXT,
  city TEXT,
  working_zone TEXT,
  address TEXT,
  pan_url TEXT,
  aadhaar_url TEXT,
  awbi_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ========================
-- 3. Enable RLS
-- ========================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_applications ENABLE ROW LEVEL SECURITY;

-- ========================
-- 4. RLS Policies
-- ========================

-- Profiles: users can read their own, service role can do everything
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_all_service" ON profiles
  FOR ALL USING (true);

-- Reports: public read + insert, service role update
CREATE POLICY "reports_select" ON reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_update" ON reports FOR UPDATE USING (true);

-- Animals: public read
CREATE POLICY "animals_select" ON animals FOR SELECT USING (true);

-- NGOs: public read, service role full
CREATE POLICY "ngos_select" ON ngos FOR SELECT USING (true);
CREATE POLICY "ngos_all" ON ngos FOR ALL USING (true);

-- NGO Applications: users can read own, service role full
CREATE POLICY "ngo_apps_select_own" ON ngo_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ngo_apps_all_service" ON ngo_applications
  FOR ALL USING (true);

-- ========================
-- 5. Seed data
-- ========================

INSERT INTO animals (id, name, species, breed, age, gender, status, rescue_date, location, shelter, image_emoji)
VALUES
  ('PAW-DOG-0291', 'Bruno', 'Dog', 'Mixed', '~2 yrs', 'Male', 'UNDER TREATMENT', '14 Jan 2025', 'Lajpat Nagar, Delhi', 'Friendicoes SECA', '🐕'),
  ('PAW-DOG-0285', 'Coco', 'Dog', 'Indie', '~1 yr', 'Female', 'AVAILABLE FOR ADOPTION', '08 Jan 2025', 'Sarojini Nagar, Delhi', 'Friendicoes SECA', '🐕'),
  ('PAW-CAT-0102', 'Whiskers', 'Cat', 'Tabby Mix', '~3 yrs', 'Male', 'RECOVERING', '10 Jan 2025', 'Connaught Place, Delhi', 'CARE India', '🐈'),
  ('PAW-COW-0058', 'Ganga', 'Cow', 'Desi', '~5 yrs', 'Female', 'UNDER TREATMENT', '12 Jan 2025', 'Karol Bagh, Delhi', 'Animal Aid Unlimited', '🐄'),
  ('PAW-BRD-0034', 'Chirpy', 'Bird', 'Pigeon', 'Unknown', 'Unknown', 'AVAILABLE FOR ADOPTION', '11 Jan 2025', 'Rohini, Delhi', 'Wildlife SOS', '🐦')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ngos (name, city, applied_on, documents, documents_ok, status)
VALUES
  ('Friendicoes SECA', 'Delhi', '10 Jan 2025', 'All submitted', true, 'Pending'),
  ('CARE India', 'Mumbai', '12 Jan 2025', 'PAN missing', false, 'Incomplete'),
  ('Animal Aid Unlimited', 'Udaipur', '13 Jan 2025', 'All submitted', true, 'Pending')
ON CONFLICT DO NOTHING;

-- ========================
-- 6. Storage Buckets
-- ========================

-- Animal photos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-photos', 'animal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- NGO documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ngo-documents', 'ngo-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop first then create)
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public View" ON storage.objects;
DROP POLICY IF EXISTS "ngo_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "ngo_docs_select" ON storage.objects;

CREATE POLICY "animal_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'animal-photos');

CREATE POLICY "animal_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'animal-photos');

CREATE POLICY "ngo_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ngo-documents');

CREATE POLICY "ngo_docs_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'ngo-documents');

-- ========================
-- 7. Auto-create profile on signup
-- ========================

-- This trigger auto-creates a profile row when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'user'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- DONE! Your database is fully reset and ready.
-- Now register a new NGO account at /ngo/register,
-- approve it in /admin, and login should work.
-- =====================================================================
