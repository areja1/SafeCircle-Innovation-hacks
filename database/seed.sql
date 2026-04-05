-- SafeCircle — demo data for hackathon (group dashboard + emergency pool)
--
-- Prerequisites: schema.sql, policies.sql, realtime.sql (in that order).
-- This file creates demo auth users + identities, profiles, circle, pool, surveys, etc.
-- Password for all demo logins: DemoHack2026!
-- (seed_auth_users.sql is optional — same auth block; use it alone if you only need users.)

BEGIN;

SET LOCAL search_path = public, extensions;

-- Idempotent cleanup for fixed demo IDs (safe to re-run)
DELETE FROM public.fund_votes WHERE request_id = 'fadefade-fade-fade-fade-fadefade0001';
DELETE FROM public.fund_requests WHERE id = 'fadefade-fade-fade-fade-fadefade0001';
DELETE FROM public.pool_contributions WHERE pool_id = '33333333-3333-3333-3333-333333333333';

-- ---- Demo auth.users + identities ----
-- instance_id: prefer auth.instances, else any existing user row, else all-zero UUID (common seed pattern when instances is empty)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
SELECT
  COALESCE(
    (SELECT inn.id FROM auth.instances inn LIMIT 1),
    (SELECT u0.instance_id FROM auth.users u0 WHERE u0.instance_id IS NOT NULL LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  crypt('DemoHack2026!', gen_salt('bf')),
  NOW(),
  '{}'::jsonb,
  u.meta,
  NOW(),
  NOW(),
  FALSE,
  FALSE
FROM (
  VALUES
    ('11111111-1111-1111-1111-000000000001'::uuid, 'demo01@safecircle.hackathon.invalid', '{"full_name": "Maria Martinez"}'::jsonb),
    ('11111111-1111-1111-1111-000000000002'::uuid, 'demo02@safecircle.hackathon.invalid', '{"full_name": "Carlos Garcia"}'::jsonb),
    ('11111111-1111-1111-1111-000000000003'::uuid, 'demo03@safecircle.hackathon.invalid', '{"full_name": "Jorge Martinez"}'::jsonb),
    ('11111111-1111-1111-1111-000000000004'::uuid, 'demo04@safecircle.hackathon.invalid', '{"full_name": "Ana Lopez"}'::jsonb),
    ('11111111-1111-1111-1111-000000000005'::uuid, 'demo05@safecircle.hackathon.invalid', '{"full_name": "Rosa Delgado"}'::jsonb),
    ('11111111-1111-1111-1111-000000000006'::uuid, 'demo06@safecircle.hackathon.invalid', '{"full_name": "Miguel Santos"}'::jsonb),
    ('11111111-1111-1111-1111-000000000007'::uuid, 'demo07@safecircle.hackathon.invalid', '{"full_name": "Elena Ruiz"}'::jsonb),
    ('11111111-1111-1111-1111-000000000008'::uuid, 'demo08@safecircle.hackathon.invalid', '{"full_name": "David Chen"}'::jsonb),
    ('11111111-1111-1111-1111-000000000009'::uuid, 'demo09@safecircle.hackathon.invalid', '{"full_name": "Sofia Patel"}'::jsonb),
    ('11111111-1111-1111-1111-00000000000a'::uuid, 'demo10@safecircle.hackathon.invalid', '{"full_name": "James Wilson"}'::jsonb)
) AS u(id, email, meta)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  au.id,
  au.email,
  jsonb_build_object(
    'sub', au.id::text,
    'email', au.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email LIKE 'demo%@safecircle.hackathon.invalid'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = au.id AND i.provider = 'email'
  );

-- Profiles (trigger may have inserted; this covers missed trigger / SQL-only auth)
INSERT INTO public.profiles (id, full_name, email)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email
FROM auth.users u
WHERE u.id IN (
  '11111111-1111-1111-1111-000000000001'::uuid,
  '11111111-1111-1111-1111-000000000002'::uuid,
  '11111111-1111-1111-1111-000000000003'::uuid,
  '11111111-1111-1111-1111-000000000004'::uuid,
  '11111111-1111-1111-1111-000000000005'::uuid,
  '11111111-1111-1111-1111-000000000006'::uuid,
  '11111111-1111-1111-1111-000000000007'::uuid,
  '11111111-1111-1111-1111-000000000008'::uuid,
  '11111111-1111-1111-1111-000000000009'::uuid,
  '11111111-1111-1111-1111-00000000000a'::uuid
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '11111111-1111-1111-1111-000000000001') THEN
    RAISE EXCEPTION
      'Could not create demo admin profile. Check: (1) auth.users has row 11111111-1111-1111-1111-000000000001; (2) no duplicate email for demo01@… with another id; (3) run this script in Dashboard SQL Editor as postgres.';
  END IF;
END;
$guard$;

-- ---- Circle + pool (deterministic IDs) ------------------------------------
INSERT INTO public.circles (id, name, description, invite_code, created_by)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Martinez Family Circle',
  'Martinez & Garcia families — shared emergency pool and risk check-ins',
  'DEMO1234',
  '11111111-1111-1111-1111-000000000001'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  invite_code = EXCLUDED.invite_code;

INSERT INTO public.emergency_pools (id, circle_id, target_monthly_per_member, total_balance)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  25,
  75000
)
ON CONFLICT (id) DO UPDATE SET
  target_monthly_per_member = EXCLUDED.target_monthly_per_member,
  total_balance = EXCLUDED.total_balance;

-- ---- Enrich profiles (trigger already created rows from auth) --------------
UPDATE public.profiles SET phone = '6025550101', preferred_language = 'es', zip_code = '85003' WHERE id = '11111111-1111-1111-1111-000000000001';
UPDATE public.profiles SET phone = '6025550102', preferred_language = 'es', zip_code = '85009' WHERE id = '11111111-1111-1111-1111-000000000002';
UPDATE public.profiles SET phone = '6025550103', preferred_language = 'en', zip_code = '85008' WHERE id = '11111111-1111-1111-1111-000000000003';
UPDATE public.profiles SET phone = '6025550104', preferred_language = 'es', zip_code = '85017' WHERE id = '11111111-1111-1111-1111-000000000004';
UPDATE public.profiles SET phone = '6025550105', preferred_language = 'es', zip_code = '85006' WHERE id = '11111111-1111-1111-1111-000000000005';
UPDATE public.profiles SET phone = '6025550106', preferred_language = 'en', zip_code = '85015' WHERE id = '11111111-1111-1111-1111-000000000006';
UPDATE public.profiles SET phone = '6025550107', preferred_language = 'es', zip_code = '85019' WHERE id = '11111111-1111-1111-1111-000000000007';
UPDATE public.profiles SET phone = '6025550108', preferred_language = 'en', zip_code = '85013' WHERE id = '11111111-1111-1111-1111-000000000008';
UPDATE public.profiles SET phone = '6025550109', preferred_language = 'en', zip_code = '85016' WHERE id = '11111111-1111-1111-1111-000000000009';
UPDATE public.profiles SET phone = '6025550110', preferred_language = 'en', zip_code = '85020' WHERE id = '11111111-1111-1111-1111-00000000000a';

-- ---- Members (admin + 9 members) -------------------------------------------
INSERT INTO public.circle_members (circle_id, user_id, role) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000001', 'admin'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000002', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000003', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000004', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000005', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000006', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000007', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000008', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-000000000009', 'member'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-00000000000a', 'member')
ON CONFLICT (circle_id, user_id) DO NOTHING;

-- ---- Pool contributions (6 × $125 = $750 pool; stored in cents) ------------
INSERT INTO public.pool_contributions (pool_id, user_id, amount) VALUES
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-000000000001', 12500),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-000000000002', 12500),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-000000000003', 12500),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-000000000004', 12500),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-000000000005', 12500),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-000000000006', 12500);

-- ---- One open fund request + votes (matches demo narrative) ---------------
INSERT INTO public.fund_requests (
  id, pool_id, requested_by, amount, reason, crisis_type, status, votes_needed, votes_received
) VALUES (
  'fadefade-fade-fade-fade-fadefade0001',
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-000000000002',
  50000,
  'Car repair needed to keep DoorDash shifts — transmission estimate $500',
  'car_accident',
  'pending',
  5,
  3
)
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  reason = EXCLUDED.reason,
  status = EXCLUDED.status,
  votes_needed = EXCLUDED.votes_needed,
  votes_received = EXCLUDED.votes_received;

INSERT INTO public.fund_votes (request_id, voter_id, vote) VALUES
  ('fadefade-fade-fade-fade-fadefade0001', '11111111-1111-1111-1111-000000000001', TRUE),
  ('fadefade-fade-fade-fade-fadefade0001', '11111111-1111-1111-1111-000000000003', TRUE),
  ('fadefade-fade-fade-fade-fadefade0001', '11111111-1111-1111-1111-000000000004', TRUE)
ON CONFLICT (request_id, voter_id) DO UPDATE SET vote = EXCLUDED.vote;

-- ---- Risk surveys (10 varied profiles — powers group dashboard) -----------
INSERT INTO public.risk_surveys (
  user_id, circle_id,
  employment_type, has_health_insurance, health_insurance_type,
  has_renters_insurance, has_auto_insurance, drives_for_gig_apps, has_rideshare_endorsement,
  monthly_income, emergency_savings, household_size, has_life_insurance, credit_score_range,
  risk_score, gaps_found, benefits_eligible, poverty_tax_annual, ai_analysis
) VALUES
(
  '11111111-1111-1111-1111-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'w2_employee', TRUE, 'employer',
  FALSE, TRUE, FALSE, FALSE,
  5200, 800, 4, FALSE, '670_739',
  62,
  '[{"type":"renters","title":"No renters insurance","description":"Apartment lease requires coverage; a kitchen fire could cost $18k+ out of pocket.","risk_amount":18000,"fix_cost_monthly":18,"priority":"critical"},{"type":"life","title":"No life insurance","description":"Young kids — loss of income would hit the household hard.","risk_amount":120000,"fix_cost_monthly":35,"priority":"high"}]'::jsonb,
  '[{"name":"LIHEAP (cooling)","description":"Summer utility help for qualifying households","estimated_value":600,"how_to_apply":"Apply via Arizona LIHEAP portal","apply_url":"https://www.azdes.gov/"}]'::jsonb,
  4200,
  'Maria: solid W-2 income but missing renters and life coverage — common blind spot for young families in Phoenix.'
),
(
  '11111111-1111-1111-1111-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'gig_worker', TRUE, 'marketplace',
  TRUE, TRUE, TRUE, FALSE,
  3100, 400, 2, FALSE, '580_669',
  78,
  '[{"type":"auto_rideshare","title":"Gig driving without rideshare endorsement","description":"Personal auto policy often excludes app-on periods; one at-fault crash can mean denied claims.","risk_amount":8000,"fix_cost_monthly":15,"priority":"critical"}]'::jsonb,
  '[{"name":"Marketplace subsidy check","description":"Income may qualify for APTC on health plan","estimated_value":2400,"how_to_apply":"Healthcare.gov special enrollment if eligible"}]'::jsonb,
  6100,
  'Carlos delivers for DoorDash — biggest gap is commercial/rideshare coverage while working.'
),
(
  '11111111-1111-1111-1111-000000000003',
  '22222222-2222-2222-2222-222222222222',
  'w2_employee', TRUE, 'employer',
  TRUE, TRUE, FALSE, FALSE,
  6100, 12000, 3, TRUE, '740_plus',
  28,
  '[{"type":"health","title":"High-deductible exposure","description":"Even with insurance, a $7k ER bill could sting before HSA catches up.","risk_amount":7000,"fix_cost_monthly":0,"priority":"medium"}]'::jsonb,
  '[]'::jsonb,
  900,
  'Jorge is the most protected adult in the circle — strong emergency fund and core coverages in place.'
),
(
  '11111111-1111-1111-1111-000000000004',
  '22222222-2222-2222-2222-222222222222',
  'student', FALSE, 'none',
  FALSE, FALSE, FALSE, FALSE,
  900, 200, 2, FALSE, 'unknown',
  88,
  '[{"type":"health","title":"No health insurance","description":"Campus plan waived; injury or ER visit is full self-pay risk.","risk_amount":25000,"fix_cost_monthly":120,"priority":"critical"},{"type":"renters","title":"No renters insurance","description":"Dorm theft or laptop loss not covered.","risk_amount":4000,"fix_cost_monthly":12,"priority":"high"}]'::jsonb,
  '[{"name":"Medicaid / AHCCCS","description":"May qualify at student income levels","estimated_value":3500,"how_to_apply":"Apply via Health-e-Arizona Plus","apply_url":"https://www.healthearizonaplus.gov/"}]'::jsonb,
  5200,
  'Ana: classic student risk stack — coverage gaps plus thin cash buffer.'
),
(
  '11111111-1111-1111-1111-000000000005',
  '22222222-2222-2222-2222-222222222222',
  'self_employed', TRUE, 'marketplace',
  FALSE, TRUE, FALSE, FALSE,
  4800, 1500, 2, FALSE, '580_669',
  71,
  '[{"type":"renters","title":"No renters insurance","description":"Home office gear uninsured.","risk_amount":12000,"fix_cost_monthly":16,"priority":"high"},{"type":"disability","title":"No short-term disability","description":"If hurt, income stops immediately.","risk_amount":24000,"fix_cost_monthly":45,"priority":"medium"}]'::jsonb,
  '[{"name":"SNAP (estimate)","description":"Self-employed income variance — worth screening","estimated_value":1800,"how_to_apply":"DES SNAP application"}]'::jsonb,
  7800,
  'Rosa: self-employed stability looks OK until a health or liability shock hits.'
),
(
  '11111111-1111-1111-1111-000000000006',
  '22222222-2222-2222-2222-222222222222',
  'gig_worker', TRUE, 'employer',
  TRUE, TRUE, TRUE, TRUE,
  4200, 2200, 1, FALSE, '670_739',
  42,
  '[{"type":"life","title":"No life insurance","description":"Single but supports parents abroad — small term policy still useful.","risk_amount":50000,"fix_cost_monthly":22,"priority":"medium"}]'::jsonb,
  '[]'::jsonb,
  2100,
  'Miguel drives gigs with proper endorsement — much lower auto exposure than Carlos.'
),
(
  '11111111-1111-1111-1111-000000000007',
  '22222222-2222-2222-2222-222222222222',
  'unemployed', TRUE, 'medicaid',
  FALSE, FALSE, FALSE, FALSE,
  1400, 100, 3, FALSE, 'no_score',
  81,
  '[{"type":"renters","title":"No renters insurance","description":"Eviction or property loss would have no backstop.","risk_amount":9000,"fix_cost_monthly":14,"priority":"high"},{"type":"auto_rideshare","title":"No auto (still mobility risk)","description":"Relies on rides — medical transport costs spike in crisis.","risk_amount":3000,"fix_cost_monthly":0,"priority":"medium"}]'::jsonb,
  '[{"name":"SNAP","description":"Household size 3 with low income","estimated_value":4200,"how_to_apply":"AZ DES"},{"name":"WIC","description":"Young child in household — screening","estimated_value":1500,"how_to_apply":"AZ WIC clinics"}]'::jsonb,
  6400,
  'Elena: Medicaid helps health side; property and cash-flow risks dominate.'
),
(
  '11111111-1111-1111-1111-000000000008',
  '22222222-2222-2222-2222-222222222222',
  'w2_employee', TRUE, 'employer',
  TRUE, TRUE, FALSE, FALSE,
  5500, 3500, 2, FALSE, '670_739',
  48,
  '[{"type":"life","title":"No life insurance","description":"Partner depends on income for rent.","risk_amount":90000,"fix_cost_monthly":28,"priority":"high"}]'::jsonb,
  '[{"name":"EITC","description":"Check refund eligibility next filing","estimated_value":1500,"how_to_apply":"IRS Free File or VITA"}]'::jsonb,
  3100,
  'David: auto/health/renters OK — life insurance is the glaring hole.'
),
(
  '11111111-1111-1111-1111-000000000009',
  '22222222-2222-2222-2222-222222222222',
  'w2_employee', TRUE, 'employer',
  TRUE, TRUE, FALSE, FALSE,
  4700, 600, 1, FALSE, 'below_580',
  68,
  '[{"type":"health","title":"Thin buffer + subprime credit","description":"Any missed bill cascades to higher deposits and APR penalties.","risk_amount":15000,"fix_cost_monthly":0,"priority":"high"}]'::jsonb,
  '[]'::jsonb,
  8900,
  'Sofia: credit-invisible pattern — poverty tax shows up as fees and deposit multipliers.'
),
(
  '11111111-1111-1111-1111-00000000000a',
  '22222222-2222-2222-2222-222222222222',
  'w2_employee', TRUE, 'employer',
  TRUE, TRUE, FALSE, FALSE,
  7200, 20000, 2, TRUE, '740_plus',
  32,
  '[]'::jsonb,
  '[{"name":"HSA max-out","description":"Already advantaged — suggest tax-advantaged investing","estimated_value":800,"how_to_apply":"Payroll benefits portal"}]'::jsonb,
  600,
  'James: bench-mark profile for the circle — low drama, mostly optimization tips.'
)
ON CONFLICT (user_id, circle_id) DO UPDATE SET
  employment_type = EXCLUDED.employment_type,
  has_health_insurance = EXCLUDED.has_health_insurance,
  health_insurance_type = EXCLUDED.health_insurance_type,
  has_renters_insurance = EXCLUDED.has_renters_insurance,
  has_auto_insurance = EXCLUDED.has_auto_insurance,
  drives_for_gig_apps = EXCLUDED.drives_for_gig_apps,
  has_rideshare_endorsement = EXCLUDED.has_rideshare_endorsement,
  monthly_income = EXCLUDED.monthly_income,
  emergency_savings = EXCLUDED.emergency_savings,
  household_size = EXCLUDED.household_size,
  has_life_insurance = EXCLUDED.has_life_insurance,
  credit_score_range = EXCLUDED.credit_score_range,
  risk_score = EXCLUDED.risk_score,
  gaps_found = EXCLUDED.gaps_found,
  benefits_eligible = EXCLUDED.benefits_eligible,
  poverty_tax_annual = EXCLUDED.poverty_tax_annual,
  ai_analysis = EXCLUDED.ai_analysis,
  completed_at = NOW();

COMMIT;
