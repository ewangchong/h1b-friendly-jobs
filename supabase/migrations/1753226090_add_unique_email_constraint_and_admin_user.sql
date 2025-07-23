-- Migration: add_unique_email_constraint_and_admin_user
-- Created at: 1753226090

-- Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON profiles(email);

-- Insert admin user safely
INSERT INTO profiles (user_id, email, full_name, is_admin, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'ewangchong@gmail.com',
  'Admin User',
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'ewangchong@gmail.com'
);

-- Update existing admin user if exists
UPDATE profiles 
SET is_admin = TRUE, updated_at = NOW() 
WHERE email = 'ewangchong@gmail.com';;