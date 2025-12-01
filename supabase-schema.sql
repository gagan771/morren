-- Supabase Database Schema for Marketplace Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes for better query performance
CREATE INDEX idx_items_seller_id ON items(seller_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_item_id ON orders(item_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_bids_order_id ON bids(order_id);
CREATE INDEX idx_bids_seller_id ON bids(seller_id);
CREATE INDEX idx_bids_status ON bids(status);

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

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Items policies
CREATE POLICY "Anyone can view active items" ON items FOR SELECT USING (status = 'active' OR auth.uid() = seller_id);
CREATE POLICY "Sellers can insert items" ON items FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own items" ON items FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers and admins can delete items" ON items FOR DELETE USING (auth.uid() = seller_id);

-- Orders policies
CREATE POLICY "Buyers can view own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can view orders for their items" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM items WHERE items.id = orders.item_id AND items.seller_id = auth.uid())
);
CREATE POLICY "Buyers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update own orders" ON orders FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can delete own orders" ON orders FOR DELETE USING (auth.uid() = buyer_id);

-- Bids policies
CREATE POLICY "Buyers can view bids on their orders" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = bids.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Sellers can view own bids" ON bids FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can create bids" ON bids FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own bids" ON bids FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own bids" ON bids FOR DELETE USING (auth.uid() = seller_id);

-- Insert sample data
INSERT INTO users (id, name, email, role, phone, address) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John Buyer', 'buyer@example.com', 'buyer', '+1234567890', '123 Main St, City, Country'),
  ('00000000-0000-0000-0000-000000000002', 'Sarah Seller', 'seller@example.com', 'seller', '+1234567891', '456 Market St, City, Country'),
  ('00000000-0000-0000-0000-000000000003', 'Admin User', 'admin@example.com', 'admin', '+1234567892', '789 Admin Ave, City, Country');

INSERT INTO items (id, name, description, price, size, category, condition, quantity, specifications, seller_id, status) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Fresh Organic Tomatoes', 'Premium quality organic tomatoes, freshly harvested', 4.99, '1 kg', 'Vegetables', 'new', 100, 
   '{"Origin": "Local Farm", "Organic": "Yes", "Harvest Date": "2024-11-28", "Variety": "Roma", "Color": "Red", "Shelf Life": "7 days"}', 
   '00000000-0000-0000-0000-000000000002', 'active'),
  ('00000000-0000-0000-0000-000000000012', 'Premium Laptop - Dell XPS 15', 'High-performance laptop for professionals', 1299.99, '15.6 inch', 'Electronics', 'new', 5,
   '{"Processor": "Intel Core i7", "RAM": "16GB", "Storage": "512GB SSD", "Graphics": "NVIDIA GTX 1650", "Display": "15.6\" FHD", "Weight": "2.0 kg"}',
   '00000000-0000-0000-0000-000000000002', 'active'),
  ('00000000-0000-0000-0000-000000000013', 'Wireless Headphones', 'Noise-cancelling wireless headphones with premium sound', 199.99, 'Standard', 'Electronics', 'new', 25,
   '{"Brand": "AudioPro", "Battery Life": "30 hours", "Connectivity": "Bluetooth 5.0", "Noise Cancellation": "Active", "Weight": "250g", "Color": "Black"}',
   '00000000-0000-0000-0000-000000000002', 'active'),
  ('00000000-0000-0000-0000-000000000014', 'Organic Carrots', 'Fresh organic carrots, perfect for cooking', 3.49, '1 kg', 'Vegetables', 'new', 150,
   '{"Origin": "Local Farm", "Organic": "Yes", "Harvest Date": "2024-11-27", "Variety": "Nantes", "Color": "Orange", "Shelf Life": "14 days"}',
   '00000000-0000-0000-0000-000000000002', 'active');

INSERT INTO orders (id, item_id, buyer_id, quantity, total_price, status, shipping_address, notes) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 5, 24.95, 'pending', '123 Main St, City, Country', 'Please deliver in the morning'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 1, 1299.99, 'accepted', '123 Main St, City, Country', 'Need invoice for business'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 2, 399.98, 'completed', '123 Main St, City, Country', NULL);

INSERT INTO bids (id, order_id, seller_id, bid_amount, estimated_delivery, message, status) VALUES
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 23.95, '2024-12-02', 'Can deliver fresh tomatoes by tomorrow morning', 'pending'),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', 1299.99, '2024-11-30', 'Brand new laptop with warranty', 'accepted');
