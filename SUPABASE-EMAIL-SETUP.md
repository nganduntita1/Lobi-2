# Disable Email Confirmation in Supabase

## Steps to Turn Off Email Verification

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project (Lobi-2 or your project name)

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" tab
   - Scroll down to "Email" provider

3. **Disable Email Confirmation**
   - Find the "Enable email confirmations" toggle
   - **Turn it OFF**
   - Click "Save" at the bottom

## Alternative: Email Auth Settings

If you can't find it in Providers, try:

1. Go to **Authentication** → **Settings** → **Auth Settings**
2. Look for **"Enable email confirmations"** or **"Confirm email"**
3. Toggle it **OFF**
4. Save changes

## Quick Fix via SQL (Advanced)

You can also run this SQL in the Supabase SQL Editor:

```sql
-- Update auth config to disable email confirmation
UPDATE auth.config
SET enable_signup = true,
    enable_email_signup = true,
    enable_email_confirmations = false;
```

## Verify It's Working

After disabling:
1. Try signing up a new user in your app
2. User should be able to log in immediately without checking email
3. Check Supabase Dashboard → Authentication → Users to see the new user

## For Testing with Existing Users

If you have users who already signed up but didn't confirm:

```sql
-- Mark all users as confirmed (run in SQL Editor)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
```

## Security Note

⚠️ **For Production**: Consider re-enabling email confirmation for security
- Prevents fake accounts
- Validates real email addresses
- Reduces spam/bot signups

For development/testing, it's fine to keep it disabled.
