# Supabase Integration Setup Guide

This guide will help you connect your marketplace platform to Supabase.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## 🚀 Setup Steps

### 1. Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details:
   - Project name: `marketplace-platform` (or your preferred name)
   - Database password: Choose a strong password
   - Region: Select the closest region to your users
4. Click "Create new project" and wait for it to initialize

### 2. Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- ✅ 4 tables: `users`, `items`, `orders`, `bids`
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Sample data for testing

### 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### 4. Configure Environment Variables

1. Create a file named `.env.local` in the root of your project
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace the placeholder values with your actual credentials from step 3.

### 5. Install Dependencies

Run the following command in your project directory:

```bash
npm install @supabase/supabase-js
```

### 6. Verify the Connection

The Supabase client is already configured in `lib/supabase.ts`. The API functions in `lib/supabase-api.ts` will automatically use your environment variables.

## 📊 Database Structure

### Tables

#### **users**
- `id` (UUID, Primary Key)
- `name` (Text)
- `email` (Text, Unique)
- `role` (Text: 'buyer', 'seller', 'admin')
- `avatar` (Text, Optional)
- `phone` (Text, Optional)
- `address` (Text, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### **items**
- `id` (UUID, Primary Key)
- `name` (Text)
- `description` (Text)
- `image` (Text)
- `price` (Decimal)
- `size` (Text)
- `category` (Text)
- `condition` (Text: 'new', 'used', 'refurbished')
- `quantity` (Integer)
- `specifications` (JSONB - stores key-value pairs)
- `seller_id` (UUID, Foreign Key → users)
- `status` (Text: 'active', 'sold', 'inactive')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### **orders**
- `id` (UUID, Primary Key)
- `item_id` (UUID, Foreign Key → items)
- `buyer_id` (UUID, Foreign Key → users)
- `quantity` (Integer)
- `total_price` (Decimal)
- `status` (Text: 'pending', 'accepted', 'rejected', 'completed', 'cancelled')
- `shipping_address` (Text)
- `notes` (Text, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### **bids**
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key → orders)
- `seller_id` (UUID, Foreign Key → users)
- `bid_amount` (Decimal)
- `estimated_delivery` (Date)
- `message` (Text, Optional)
- `status` (Text: 'pending', 'accepted', 'rejected')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 🔧 Using the API Functions

All database operations are available in `lib/supabase-api.ts`. Here are some examples:

### Get All Items
```typescript
import { getItems } from '@/lib/supabase-api';

const items = await getItems();
```

### Create a New Item
```typescript
import { createItem } from '@/lib/supabase-api';

const newItem = await createItem({
  name: 'Fresh Tomatoes',
  description: 'Organic tomatoes',
  price: 4.99,
  size: '1 kg',
  category: 'Vegetables',
  condition: 'new',
  quantity: 100,
  specifications: {
    'Origin': 'Local Farm',
    'Organic': 'Yes'
  },
  sellerId: 'seller-uuid-here',
  status: 'active',
  image: '/path/to/image.jpg'
});
```

### Update an Order
```typescript
import { updateOrder } from '@/lib/supabase-api';

await updateOrder('order-id', {
  status: 'completed'
});
```

### Get Dashboard Stats
```typescript
import { getBuyerStats, getSellerStats, getAdminStats } from '@/lib/supabase-api';

// For buyer dashboard
const buyerStats = await getBuyerStats('buyer-id');

// For seller dashboard
const sellerStats = await getSellerStats('seller-id');

// For admin dashboard
const adminStats = await getAdminStats();
```

## 🔐 Security (Row Level Security)

The database is secured with RLS policies:

- **Users**: Can view all users, update own profile
- **Items**: Anyone can view active items, sellers can manage their own items
- **Orders**: Buyers can view/manage their orders, sellers can view orders for their items
- **Bids**: Buyers can view bids on their orders, sellers can manage their own bids

## 📝 Sample Data

The schema includes sample data:
- 3 users (buyer, seller, admin)
- 4 items (including organic tomatoes with specifications)
- 3 orders
- 2 bids

You can use these for testing or delete them and add your own.

## 🔄 Next Steps

1. Update your dashboard components to use the Supabase API functions instead of mock data
2. Implement real-time subscriptions for live updates (optional)
3. Add authentication using Supabase Auth
4. Set up file storage for item images using Supabase Storage

## 🆘 Troubleshooting

### Connection Issues
- Verify your `.env.local` file has the correct credentials
- Make sure the file is in the root directory
- Restart your development server after adding environment variables

### Permission Errors
- Check that RLS policies are enabled
- Verify you're using the correct user IDs in your queries
- For testing, you can temporarily disable RLS in Supabase dashboard

### Query Errors
- Check the Supabase dashboard logs for detailed error messages
- Verify your data types match the schema
- Ensure foreign key relationships are valid

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?** Check the Supabase documentation or reach out to the community on Discord.
