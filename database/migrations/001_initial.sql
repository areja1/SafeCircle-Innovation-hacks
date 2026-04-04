-- SafeCircle — baseline migration (same as ../schema.sql).
-- Apply policies.sql and realtime.sql after this file in the SQL Editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USERS TABLE (extends Supabase auth.users)
-- ==========================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'es')),
    state TEXT DEFAULT 'AZ',
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CIRCLES TABLE
-- ==========================================
CREATE TABLE public.circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CIRCLE MEMBERS (junction table)
-- ==========================================
CREATE TABLE public.circle_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(circle_id, user_id)
);

-- ==========================================
-- RISK SURVEY RESPONSES
-- ==========================================
CREATE TABLE public.risk_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,

    employment_type TEXT CHECK (employment_type IN ('w2_employee', 'gig_worker', 'self_employed', 'unemployed', 'student')),
    has_health_insurance BOOLEAN,
    health_insurance_type TEXT CHECK (health_insurance_type IN ('employer', 'marketplace', 'medicaid', 'none', 'other')),
    has_renters_insurance BOOLEAN,
    has_auto_insurance BOOLEAN,
    drives_for_gig_apps BOOLEAN DEFAULT FALSE,
    has_rideshare_endorsement BOOLEAN DEFAULT FALSE,
    monthly_income INTEGER,
    emergency_savings INTEGER,
    household_size INTEGER DEFAULT 1,
    has_life_insurance BOOLEAN DEFAULT FALSE,
    credit_score_range TEXT CHECK (credit_score_range IN ('no_score', 'below_580', '580_669', '670_739', '740_plus', 'unknown')),

    risk_score INTEGER,
    gaps_found JSONB,
    benefits_eligible JSONB,
    poverty_tax_annual INTEGER,
    ai_analysis TEXT,

    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, circle_id)
);

-- ==========================================
-- EMERGENCY POOL
-- ==========================================
CREATE TABLE public.emergency_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID UNIQUE REFERENCES public.circles(id) ON DELETE CASCADE,
    target_monthly_per_member INTEGER DEFAULT 25,
    total_balance INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POOL CONTRIBUTIONS
-- ==========================================
CREATE TABLE public.pool_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES public.emergency_pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    contributed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- FUND REQUESTS
-- ==========================================
CREATE TABLE public.fund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES public.emergency_pools(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    crisis_type TEXT CHECK (crisis_type IN ('car_accident', 'medical', 'job_loss', 'home_damage', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'released')),
    votes_needed INTEGER DEFAULT 0,
    votes_received INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ==========================================
-- VOTES ON FUND REQUESTS
-- ==========================================
CREATE TABLE public.fund_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.fund_requests(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote BOOLEAN NOT NULL,
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, voter_id)
);

-- ==========================================
-- CRISIS MODE SESSIONS
-- ==========================================
CREATE TABLE public.crisis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    circle_id UUID REFERENCES public.circles(id),
    crisis_type TEXT NOT NULL CHECK (crisis_type IN ('car_accident', 'job_loss', 'medical_emergency', 'death_in_family', 'home_damage')),
    state TEXT DEFAULT 'AZ',
    triage_steps JSONB,
    completed_steps JSONB DEFAULT '[]',
    estimated_savings INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_circle_members_circle ON public.circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON public.circle_members(user_id);
CREATE INDEX idx_risk_surveys_circle ON public.risk_surveys(circle_id);
CREATE INDEX idx_risk_surveys_user ON public.risk_surveys(user_id);
CREATE INDEX idx_pool_contributions_pool ON public.pool_contributions(pool_id);
CREATE INDEX idx_fund_requests_pool ON public.fund_requests(pool_id);
CREATE INDEX idx_crisis_sessions_user ON public.crisis_sessions(user_id);

-- ==========================================
-- PROFILE ROW ON SIGNUP (Supabase Auth)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- UPDATED_AT ON PROFILES
-- ==========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS circles_updated_at ON public.circles;
CREATE TRIGGER circles_updated_at
  BEFORE UPDATE ON public.circles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
