-- Migration: Add RLS policies to allow inserts on user_profiles
-- Created: 2025-11-06

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow service_role to manage rows (bypass typical restrictions)
DROP POLICY IF EXISTS "Service role can manage user_profiles" ON user_profiles;
CREATE POLICY "Service role can manage user_profiles"
  ON user_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (true);

-- Allow a user to insert their own profile row
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

