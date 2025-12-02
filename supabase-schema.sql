-- Supabase Database Schema for Marketplace Platform with Auth Integration
-- This script will drop existing tables and recreate them
-- WARNING: This will delete all existing data!

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse dependency order (if they exist)
-- Using CASCADE to handle foreign key dependencies, triggers, and policies
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS supplier_invites CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  avatar TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  price DECIMAL(10, 2) NOT NULL,
  size TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
  quantity INTEGER NOT NULL DEFAULT 0,
  specifications JSONB DEFAULT '{}',
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  estimated_delivery DATE NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQ Tables
-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  contact_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQs table
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  specs TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  required_by_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'AWARDED')),
  awarded_to JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Invites table
CREATE TABLE supplier_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'INVITE_SENT' CHECK (status IN ('INVITE_SENT', 'VIEWED', 'QUOTED', 'UPDATED')),
  invite_token TEXT UNIQUE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  quoted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Prices table
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buyer Profiles table
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_items_seller_id ON items(seller_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_item_id ON orders(item_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_bids_order_id ON bids(order_id);
CREATE INDEX idx_bids_seller_id ON bids(seller_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_rfqs_buyer_id ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
CREATE INDEX idx_supplier_invites_rfq_id ON supplier_invites(rfq_id);
CREATE INDEX idx_supplier_invites_supplier_id ON supplier_invites(supplier_id);
CREATE INDEX idx_supplier_invites_token ON supplier_invites(invite_token);
CREATE INDEX idx_quotes_rfq_id ON quotes(rfq_id);
CREATE INDEX idx_quotes_supplier_id ON quotes(supplier_id);
CREATE INDEX idx_market_prices_product_name ON market_prices(product_name);
CREATE INDEX idx_buyer_profiles_buyer_id ON buyer_profiles(buyer_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_invites_updated_at BEFORE UPDATE ON supplier_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Items policies
CREATE POLICY "Anyone can view active items" ON items FOR SELECT USING (status = 'active' OR auth.uid() = seller_id);
CREATE POLICY "Sellers can insert items" ON items FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own items" ON items FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers and admins can delete items" ON items FOR DELETE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Orders policies
CREATE POLICY "Buyers can view own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders for their items" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM items WHERE items.id = orders.item_id AND items.seller_id = auth.uid())
);
CREATE POLICY "Sellers can view all pending orders" ON orders FOR SELECT USING (
  status = 'pending' AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'seller')
);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update own orders" ON orders FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can delete own orders" ON orders FOR DELETE USING (auth.uid() = buyer_id);

-- Bids policies
CREATE POLICY "Buyers can view bids on their orders" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = bids.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Sellers can view own bids" ON bids FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can view all bids on orders they bid on" ON bids FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bids AS my_bids 
    WHERE my_bids.order_id = bids.order_id 
    AND my_bids.seller_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all bids" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Sellers can create bids" ON bids FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own bids" ON bids FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own bids" ON bids FOR DELETE USING (auth.uid() = seller_id);

-- RFQs policies
CREATE POLICY "Buyers can view own RFQs" ON rfqs FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Admins can view all RFQs" ON rfqs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Buyers can create RFQs" ON rfqs FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update own RFQs" ON rfqs FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can delete own RFQs" ON rfqs FOR DELETE USING (auth.uid() = buyer_id);

-- Supplier Invites policies
CREATE POLICY "Buyers can view invites for their RFQs" ON supplier_invites FOR SELECT USING (
  EXISTS (SELECT 1 FROM rfqs WHERE rfqs.id = supplier_invites.rfq_id AND rfqs.buyer_id = auth.uid())
);
CREATE POLICY "Anyone can view invite by token" ON supplier_invites FOR SELECT USING (true);
CREATE POLICY "Buyers can create invites" ON supplier_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM rfqs WHERE rfqs.id = supplier_invites.rfq_id AND rfqs.buyer_id = auth.uid())
);
CREATE POLICY "Buyers can update invites for their RFQs" ON supplier_invites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM rfqs WHERE rfqs.id = supplier_invites.rfq_id AND rfqs.buyer_id = auth.uid())
);

-- Quotes policies
CREATE POLICY "Buyers can view quotes for their RFQs" ON quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM rfqs WHERE rfqs.id = quotes.rfq_id AND rfqs.buyer_id = auth.uid())
);
CREATE POLICY "Anyone can view quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "Anyone can create quotes" ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quotes" ON quotes FOR UPDATE USING (true);

-- Market Prices policies
CREATE POLICY "Anyone can view market prices" ON market_prices FOR SELECT USING (true);
CREATE POLICY "Buyers and admins can insert market prices" ON market_prices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('buyer', 'admin'))
);

-- Buyer Profiles policies
CREATE POLICY "Users can view own profile" ON buyer_profiles FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Admins can view all profiles" ON buyer_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create own profile" ON buyer_profiles FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update own profile" ON buyer_profiles FOR UPDATE USING (auth.uid() = buyer_id);

-- Suppliers policies
CREATE POLICY "Anyone can view suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Buyers and admins can manage suppliers" ON suppliers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('buyer', 'admin'))
);
