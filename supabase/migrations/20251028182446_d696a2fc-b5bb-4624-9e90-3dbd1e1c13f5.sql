-- Update auth.users email for Talha Öztürk to match Talx Media LLC
UPDATE auth.users 
SET email = 'info@talxmedia.com.tr',
    raw_user_meta_data = jsonb_set(
      raw_user_meta_data,
      '{email}',
      '"info@talxmedia.com.tr"'
    )
WHERE id = 'ca96676b-8d71-4951-99ac-b8b1e0e10e65';

-- Also update the profiles table to ensure consistency
UPDATE profiles 
SET email = 'info@talxmedia.com.tr'
WHERE id = 'ca96676b-8d71-4951-99ac-b8b1e0e10e65';