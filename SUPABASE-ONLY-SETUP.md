# Complete Supabase Setup (No Railway Needed!)

## Step 1: Set Up Supabase Project

1. Go to https://supabase.com and create account
2. Click **"New Project"**
3. Choose organization and project name
4. Set a strong database password
5. Select region closest to your users
6. Wait for project to be created (~2 minutes)

## Step 2: Run Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"**
6. Verify tables created: Go to **Table Editor** and see all 6 tables

## Step 3: Create Admin User

1. Go to **Authentication** > **Users**
2. Click **"Add User"**
3. Enter email and password
4. Click **"Create user"**
5. Go to **Table Editor** > **profiles** table
6. Find your user's row
7. Change the `role` column from `customer` to `admin`

## Step 4: Deploy Scraper Edge Function

### Option A: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
cd /Users/mac/Documents/Lobi-test
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy scrape-cart --no-verify-jwt
```

### Option B: Via Dashboard (Manual)

1. Go to **Edge Functions** in Supabase
2. Click **"Create Function"**
3. Name it: `scrape-cart`
4. Copy contents from `supabase/functions/scrape-cart/index.ts`
5. Paste and click **"Deploy"**

## Step 5: Get Your API Credentials

1. Go to **Settings** > **API**
2. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
```

## Step 6: Update Mobile App

Update `mobile-app/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

That's it! **No Railway needed.**

## Step 7: Test Your Setup

### Test Database:
```typescript
import { supabase } from './src/config/supabase';

const { data, error } = await supabase.from('settings').select('*');
console.log('Settings:', data);
```

### Test Edge Function:
```bash
curl -X POST \
  https://xxxxx.supabase.co/functions/v1/scrape-cart \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://shein-cart-url"}'
```

### Test from App:
```typescript
const { data, error } = await supabase.functions.invoke('scrape-cart', {
  body: { url: 'https://shein-cart-url' }
});
console.log('Scraped items:', data);
```

## Architecture (All on Supabase):

```
Mobile App
    ↓
Supabase Edge Functions (scrape-cart)
    ↓
Supabase Database (orders, profiles, etc.)
    ↓
Supabase Auth (user management)
```

## Cost: **$0** (Forever!)

Supabase Free Tier includes:
- ✅ 500MB database storage
- ✅ 2GB file storage
- ✅ 2 million Edge Function requests/month
- ✅ Unlimited API requests
- ✅ 50,000 monthly active users
- ✅ Social OAuth providers

## Benefits vs Railway:

| Feature | Railway | Supabase |
|---------|---------|----------|
| Free Trial | 30 days | Forever |
| Database | Separate cost | Included |
| Auth | Build yourself | Included |
| Storage | Separate | Included |
| API | Build yourself | Auto-generated |
| Real-time | No | Yes |

## Update Your Services

Since we're no longer using Railway, update your API service:

**Update `mobile-app/src/services/api.ts`:**

```typescript
import { supabase } from '../config/supabase';
import { CartItem } from '../types/cart';

export const scrapeCart = async (url: string): Promise<CartItem[]> => {
  const { data, error } = await supabase.functions.invoke('scrape-cart', {
    body: { url }
  });

  if (error) throw error;
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to scrape cart');
  }

  return data.items || [];
};
```

## Monitoring

1. Go to **Edge Functions** > **scrape-cart**
2. Click **"Logs"** to see invocations
3. Monitor errors and performance

## Scaling

If you exceed free tier limits:
- Pro plan: $25/month
- Includes:
  - 8GB database
  - 100GB file storage  
  - 2 million Edge Function invocations
  - Much higher limits

But you likely won't need it for a while!

## Summary

✅ **No Railway needed**
✅ **Everything on Supabase**
✅ **Completely free (generous limits)**
✅ **Easier to manage (one platform)**
✅ **Built-in auth, storage, real-time**
✅ **Auto-scaling**

Your app is now 100% serverless and free! 🎉
