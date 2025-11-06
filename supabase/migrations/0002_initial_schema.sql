-- Migration: Initial Schema for Blog Experience Platform
-- Created: 2025-11-06
-- Description: Creates all tables, enums, indexes, and triggers for the platform

-- ============================================================================
-- 1. PostgreSQL Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ENUM Types
-- ============================================================================

-- User role
CREATE TYPE user_role AS ENUM ('advertiser', 'influencer');

-- Verification status
CREATE TYPE verification_status_type AS ENUM ('pending', 'verified', 'failed');

-- SNS platform
CREATE TYPE sns_platform AS ENUM ('naver', 'youtube', 'instagram', 'threads');

-- Campaign status
CREATE TYPE campaign_status AS ENUM ('recruiting', 'closed', 'selection_complete');

-- Application status
CREATE TYPE application_status AS ENUM ('applied', 'selected', 'rejected');

-- ============================================================================
-- 3. Tables
-- ============================================================================

-- 3.1 User Profiles (Common)
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  terms_agreed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

COMMENT ON TABLE user_profiles IS 'Common user profile information for all users';
COMMENT ON COLUMN user_profiles.role IS 'User role: advertiser or influencer';
COMMENT ON COLUMN user_profiles.terms_agreed_at IS 'Timestamp when user agreed to terms';

-- 3.2 Influencer Profiles
-- ============================================================================

CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_profiles_completed ON influencer_profiles(profile_completed);

COMMENT ON TABLE influencer_profiles IS 'Influencer-specific profile information';
COMMENT ON COLUMN influencer_profiles.profile_completed IS 'Whether influencer has completed profile setup';

-- 3.3 Influencer Channels (SNS)
-- ============================================================================

CREATE TABLE influencer_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  platform sns_platform NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  channel_url TEXT NOT NULL,
  verification_status verification_status_type NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_influencer_channels_influencer ON influencer_channels(influencer_id);
CREATE INDEX idx_influencer_channels_status ON influencer_channels(verification_status);

COMMENT ON TABLE influencer_channels IS 'SNS channel information for influencers';
COMMENT ON COLUMN influencer_channels.platform IS 'SNS platform type';
COMMENT ON COLUMN influencer_channels.verification_status IS 'Channel verification status';

-- 3.4 Advertiser Profiles
-- ============================================================================

CREATE TABLE advertiser_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  business_registration_number VARCHAR(20) NOT NULL UNIQUE,
  verification_status verification_status_type NOT NULL DEFAULT 'pending',
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_advertiser_profiles_completed ON advertiser_profiles(profile_completed);
CREATE INDEX idx_advertiser_profiles_business_reg ON advertiser_profiles(business_registration_number);

COMMENT ON TABLE advertiser_profiles IS 'Advertiser-specific profile information';
COMMENT ON COLUMN advertiser_profiles.business_registration_number IS 'Business registration number (unique)';
COMMENT ON COLUMN advertiser_profiles.verification_status IS 'Business verification status';

-- 3.5 Campaigns
-- ============================================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  recruitment_start_date DATE NOT NULL,
  recruitment_end_date DATE NOT NULL,
  recruitment_count INTEGER NOT NULL CHECK (recruitment_count > 0),
  benefits TEXT NOT NULL,
  mission TEXT NOT NULL,
  store_info TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'recruiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(recruitment_start_date, recruitment_end_date);

COMMENT ON TABLE campaigns IS 'Experience campaign information';
COMMENT ON COLUMN campaigns.recruitment_count IS 'Number of influencers to recruit (must be > 0)';
COMMENT ON COLUMN campaigns.status IS 'Campaign status: recruiting, closed, or selection_complete';

-- 3.6 Applications
-- ============================================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL,
  visit_date DATE NOT NULL,
  status application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(campaign_id, influencer_id)
);

CREATE INDEX idx_applications_campaign ON applications(campaign_id);
CREATE INDEX idx_applications_influencer ON applications(influencer_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_influencer_status ON applications(influencer_id, status);

COMMENT ON TABLE applications IS 'Campaign application records';
COMMENT ON COLUMN applications.motivation IS 'Influencer motivation for applying';
COMMENT ON COLUMN applications.visit_date IS 'Planned visit date';
COMMENT ON COLUMN applications.status IS 'Application status: applied, selected, or rejected';

-- ============================================================================
-- 4. Triggers
-- ============================================================================

-- 4.1 Updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on record update';

-- 4.2 Apply triggers to all tables
-- ============================================================================

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_profiles_updated_at
  BEFORE UPDATE ON influencer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_influencer_channels_updated_at
  BEFORE UPDATE ON influencer_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertiser_profiles_updated_at
  BEFORE UPDATE ON advertiser_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================
-- Note: RLS policies should be configured based on your security requirements
-- Below are basic examples - adjust according to your needs

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertiser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Example: Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Example: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Example: Influencers can view their own influencer profile
CREATE POLICY "Influencers can view their own profile"
  ON influencer_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Example: Influencers can update their own influencer profile
CREATE POLICY "Influencers can update their own profile"
  ON influencer_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Example: Influencers can view their own channels
CREATE POLICY "Influencers can view their own channels"
  ON influencer_channels
  FOR SELECT
  USING (auth.uid() = influencer_id);

-- Example: Influencers can manage their own channels
CREATE POLICY "Influencers can manage their own channels"
  ON influencer_channels
  FOR ALL
  USING (auth.uid() = influencer_id);

-- Example: Advertisers can view their own profile
CREATE POLICY "Advertisers can view their own profile"
  ON advertiser_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Example: Advertisers can update their own profile
CREATE POLICY "Advertisers can update their own profile"
  ON advertiser_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Example: Everyone can view recruiting campaigns
CREATE POLICY "Anyone can view recruiting campaigns"
  ON campaigns
  FOR SELECT
  USING (status = 'recruiting');

-- Example: Advertisers can manage their own campaigns
CREATE POLICY "Advertisers can manage their own campaigns"
  ON campaigns
  FOR ALL
  USING (auth.uid() = advertiser_id);

-- Example: Influencers can view their own applications
CREATE POLICY "Influencers can view their own applications"
  ON applications
  FOR SELECT
  USING (auth.uid() = influencer_id);

-- Example: Influencers can create applications
CREATE POLICY "Influencers can create applications"
  ON applications
  FOR INSERT
  WITH CHECK (auth.uid() = influencer_id);

-- Example: Advertisers can view applications for their campaigns
CREATE POLICY "Advertisers can view applications for their campaigns"
  ON applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = applications.campaign_id
      AND campaigns.advertiser_id = auth.uid()
    )
  );

-- Example: Advertisers can update applications for their campaigns (for selection)
CREATE POLICY "Advertisers can update applications for their campaigns"
  ON applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = applications.campaign_id
      AND campaigns.advertiser_id = auth.uid()
    )
  );

-- ============================================================================
-- Migration Complete
-- ============================================================================
