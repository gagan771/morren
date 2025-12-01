# Marketplace Platform

A comprehensive marketplace system with three distinct dashboards for buyers, sellers, and administrators.

## 🚀 Features

### 🛒 Buyer Dashboard (`/dashboard/buyer`)
- **Browse Items**: View all marketplace items with detailed information
  - Item name, description, image
  - Price, size, category, condition
  - Stock availability
  - Detailed specifications (e.g., for tomatoes: origin, variety, harvest date, shelf life, etc.)
- **View Item Details**: Click to see complete specifications and seller information
- **Manage Orders**: Track all your orders with status updates
- **Review Seller Bids**: View and accept/reject bids from sellers
- **Dashboard Stats**: 
  - Total orders
  - Pending orders
  - Total spent
  - Active bids

### 🏪 Seller Dashboard (`/dashboard/seller`)
- **View Buyer Orders**: See all buyer orders with complete details
  - Order information
  - Item specifications
  - Buyer contact details
  - Shipping address and notes
- **Place Bids**: Submit competitive bids on buyer orders
  - Custom bid amount
  - Estimated delivery date
  - Personalized message to buyer
- **Track Bids**: Monitor status of all your bids
- **Dashboard Stats**:
  - Available orders
  - Pending bids
  - Accepted bids
  - Potential revenue

### 🛡️ Admin Panel (`/dashboard/admin`)
- **Full CRUD on Items**:
  - Add new items with all details
  - Edit existing items
  - Delete items
  - Manage specifications (key-value pairs)
- **Order Management**: View and delete orders
- **Bid Oversight**: Monitor all bids in the system
- **User Management**: View all registered users
- **Dashboard Stats**:
  - Total items (active/inactive)
  - Total orders (pending/completed)
  - Total revenue
  - Total users

## 📊 Data Structure

### Items
Each item includes:
- Name, description, image
- Price, size, category
- Condition (new/used/refurbished)
- Quantity in stock
- Custom specifications (unlimited key-value pairs)
- Seller information
- Status (active/sold/inactive)

### Orders
- Item details
- Buyer information
- Quantity and total price
- Shipping address
- Order notes
- Status tracking

### Bids
- Order reference
- Seller information
- Bid amount
- Estimated delivery date
- Message to buyer
- Status (pending/accepted/rejected)

## 🎨 Design Features

- **Modern UI**: Gradient backgrounds, smooth animations, hover effects
- **Responsive**: Works on all screen sizes
- **Color-coded**: Each dashboard has its own color scheme
  - Buyer: Purple/Blue gradient
  - Seller: Emerald/Teal gradient
  - Admin: Rose/Orange gradient
- **Interactive**: Dialogs, alerts, and real-time updates
- **Accessible**: Clear labels, proper contrast, keyboard navigation

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL database)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

## 📁 Project Structure

```
/app
  /dashboard
    /buyer      - Buyer dashboard
    /seller     - Seller dashboard
    /admin      - Admin panel
  page.tsx      - Landing page with navigation
  
/lib
  types.ts      - TypeScript interfaces
  mock-data.ts  - Sample data and helper functions
  
/components/ui  - Reusable UI components
```

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase Backend
Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create a Supabase project
- Run the database schema
- Configure environment variables

**Quick Setup:**
1. Create a Supabase project at https://supabase.com
2. Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor
3. Create `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Open the Application
Open [http://localhost:3000](http://localhost:3000) in your browser

### 5. Navigate to Dashboards
- Buyer: `/dashboard/buyer`
- Seller: `/dashboard/seller`
- Admin: `/dashboard/admin`

## 📝 Sample Data

The application includes sample data for:
- 4 items (including organic tomatoes with full specifications)
- 3 orders
- 2 bids
- 3 users (buyer, seller, admin)

## 🔄 Future Enhancements

- ✅ Backend API integration (Supabase connected)
- User authentication with Supabase Auth
- Real-time notifications using Supabase Realtime
- Payment processing integration
- Image upload with Supabase Storage
- Advanced search and filtering
- Analytics and reporting dashboards
- Export functionality (CSV, PDF)
- Email notifications
- Mobile responsive improvements

## 📄 License

MIT License - feel free to use this project for your own purposes.
