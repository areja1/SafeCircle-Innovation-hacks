-- SafeCircle — create 10 deterministic demo auth users (Supabase SQL Editor, postgres role)
--
-- Optional: seed.sql includes the same auth inserts. Use this file alone to only (re)seed users.
--
-- Prerequisites: schema.sql applied (profiles + handle_new_user trigger).
-- Password for every account: DemoHack2026!
-- Emails: demo01@safecircle.hackathon.invalid … demo10@…
--
-- If INSERT fails (permissions / schema mismatch), create users in Dashboard → Authentication
-- and map their UUIDs into seed.sql instead (see comments there).

SET search_path = public, extensions;

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
WHERE au.email LIKE '%@safecircle.hackathon.invalid'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = au.id AND i.provider = 'email'
  );
