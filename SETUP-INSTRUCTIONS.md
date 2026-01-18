# Shein Affiliate App - Setup Instructions

## Step 1: Set up Supabase Database

1. Go to your Supabase project at https://supabase.com
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run it in the SQL Editor
5. Verify tables are created in the Table Editor

## Step 2: Create Admin User

1. Go to Authentication > Users in Supabase
2. Click "Add User" and create an admin account:
   - Email: admin@yourapp.com
   - Password: (choose a secure password)
   - Confirm the user
3. Go to Table Editor > profiles
4. Find the admin user row
5. Change the `role` column from `customer` to `admin`

## Step 3: Configure Environment Variables

1. Create `.env` file in `mobile-app/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

2. Get your Supabase URL and Anon Key from:
   - Project Settings > API in Supabase

## Step 4: Update App.tsx

Wrap your app with AuthProvider:

```tsx
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* Your existing app content */}
    </AuthProvider>
  );
}
```

## Step 5: Test the Setup

### Test Database Connection:
Run this code in a test screen:

```tsx
import { supabase } from './src/config/supabase';

// Test query
const { data, error } = await supabase.from('settings').select('*');
console.log('Settings:', data, error);
```

### Test Authentication:
```tsx
import { useAuth } from './src/contexts/AuthContext';

const { signUp, signIn, user, profile } = useAuth();

// Test signup
await signUp('test@example.com', 'password123', 'Test User', '1234567890');

// Test login
await signIn('test@example.com', 'password123');
```

## Step 6: Verify RLS Policies

1. Log in as a customer user
2. Try to fetch orders - should only see their own
3. Log in as admin user
4. Try to fetch orders - should see all orders

## Next Steps

The foundation is now ready! You can now:

1. Create order placement flow (already have `orderService`)
2. Build UI screens for customers and admins
3. Implement navigation between screens
4. Add order status updates
5. Build admin dashboard

## Available Services

- **AuthContext**: `useAuth()` hook for authentication
- **orderService**: Create orders, fetch orders, update status
- **addressService**: Manage delivery addresses
- **scrapeCart**: Existing scraper (from api.ts)

## Database Structure

✅ **profiles** - User accounts with roles
✅ **delivery_addresses** - Customer shipping addresses
✅ **orders** - Order records with status tracking
✅ **order_items** - Individual products in orders
✅ **order_status_history** - Audit trail of status changes
✅ **settings** - App configuration

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Customers can only access their own data
- ✅ Admins can access all data
- ✅ Automatic profile creation on signup
- ✅ JWT-based authentication

## Quick Test Order Creation

```tsx
import { orderService } from './src/services/orderService';
import { CartItem } from './src/types/cart';

// After scraping cart items
const cartItems: CartItem[] = [...]; // from scraper

// Create order
const order = await orderService.createOrder({
  cart_url: 'https://...',
  delivery_address_id: 'address-uuid',
  customer_notes: 'Please deliver after 5pm',
  items: cartItems.map(item => ({
    name: item.name!,
    price: item.price!,
    quantity: parseInt(item.quantity || '1'),
    image: item.image,
    sku: item.sku,
    color: item.color,
    size: item.size,
  })),
});

console.log('Order created:', order);
```

## Troubleshooting

### Can't connect to Supabase
- Check environment variables are correct
- Verify Supabase project is active
- Check network connection

### RLS Policy errors
- Make sure you're authenticated
- Verify user role in profiles table
- Check the SQL migration ran successfully

### Order number not generating
- Check the `generate_order_number()` function exists
- Verify orders table has order_number column

## Support

For issues, check:
1. Supabase logs (Logs & Analytics)
2. App console errors
3. Network tab in browser dev tools
