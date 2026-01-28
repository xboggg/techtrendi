-- Check what profiles exist
SELECT id, full_name, email FROM public.profiles;

-- Check auth users
SELECT id, email FROM auth.users;

-- Create or update profile for admin user
INSERT INTO public.profiles (id, full_name, xp, level)
SELECT
  u.id,
  'Shagadelic',
  0,
  1
FROM auth.users u
WHERE u.email = 'info@techtrendi.com'
ON CONFLICT (id)
DO UPDATE SET full_name = 'Shagadelic';

-- Verify it worked
SELECT p.id, p.full_name, u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'info@techtrendi.com';
