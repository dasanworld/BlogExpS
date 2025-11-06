-- Migration: Disable RLS for local development
-- Created: 2025-11-06

-- CAUTION: This disables RLS on key tables for local/dev only.
-- Re-enable and review policies before staging/production.

-- Drop optional policies (ignore errors if missing)
DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Service role can manage user_profiles" ON user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Influencers can view their own profile" ON influencer_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Influencers can update their own profile" ON influencer_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Influencers can view their own channels" ON influencer_channels';
  EXECUTE 'DROP POLICY IF EXISTS "Influencers can manage their own channels" ON influencer_channels';
  EXECUTE 'DROP POLICY IF EXISTS "Advertisers can view their own profile" ON advertiser_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Advertisers can update their own profile" ON advertiser_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can view recruiting campaigns" ON campaigns';
  EXECUTE 'DROP POLICY IF EXISTS "Advertisers can manage their own campaigns" ON campaigns';
  EXECUTE 'DROP POLICY IF EXISTS "Influencers can view their own applications" ON applications';
  EXECUTE 'DROP POLICY IF EXISTS "Influencers can create applications" ON applications';
  EXECUTE 'DROP POLICY IF EXISTS "Advertisers can view applications for their campaigns" ON applications';
  EXECUTE 'DROP POLICY IF EXISTS "Advertisers can update applications for their campaigns" ON applications';
END $$;

-- Disable RLS on all app tables
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS influencer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS influencer_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS advertiser_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications DISABLE ROW LEVEL SECURITY;

