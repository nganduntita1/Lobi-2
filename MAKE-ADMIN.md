# Make User Admin - Quick Fix

## The Issue:
The app was checking for `user.is_admin` but should check `profile.role === 'admin'`. This is now fixed!

---

## Step 1: Set Your Account as Admin

Run this in Supabase SQL Editor (replace the email with your admin account):

```sql
-- Replace 'your-email@example.com' with your actual admin email
UPDATE profiles 
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

**Example:**
```sql
UPDATE profiles 
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@lobi.com'
);
```

---

## Step 2: Verify It Worked

```sql
-- Check your role
SELECT 
  u.email,
  p.full_name,
  p.role
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'your-email@example.com';
```

You should see: `role: admin`

---

## Step 3: Restart App

```bash
# Stop the app (Ctrl+C)
# Then restart
npm start
```

---

## Step 4: Log Out and Back In

1. In the app, go to Profile
2. Click "Sign Out"
3. Sign back in with your admin account
4. You should now see:
   - **Dashboard** tab
   - **Orders** tab
   - **Payments** tab ⭐ NEW
   - **Profile** tab

---

## Alternative: Create New Admin Account

If you want a fresh admin account:

```sql
-- First create the account in Supabase Auth (Dashboard > Authentication > Add User)
-- Email: admin@lobi.com
-- Password: (set a strong password)
-- Then run:

UPDATE profiles 
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@lobi.com'
);
```

---

## Verify Admin Access:

As admin you should see:
- ✅ Dashboard with stats
- ✅ All orders (not just your own)
- ✅ Payment verification screen
- ✅ Order status update controls

As customer you see:
- ✅ Shop tab (cart scraper)
- ✅ Orders tab (your orders only)
- ✅ Profile tab

---

## What Was Fixed:

**Before:**
```typescript
{!user ? <AuthStack /> : user.is_admin ? <AdminTabs /> : <CustomerTabs />}
// ❌ user.is_admin doesn't exist!
```

**After:**
```typescript
{!user ? <AuthStack /> : isAdmin ? <AdminTabs /> : <CustomerTabs />}
// ✅ isAdmin checks profile.role === 'admin'
```

---

## Quick Test Checklist:

- [ ] Run UPDATE query to set role = 'admin'
- [ ] Verify role with SELECT query
- [ ] Restart the app
- [ ] Sign out and sign back in
- [ ] See admin tabs (Dashboard, Orders, Payments, Profile)

---

Done! You should now see the admin interface. 🎉
