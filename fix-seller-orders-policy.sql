-- RUN THIS IN SUPABASE SQL EDITOR TO FIX INFINITE RECURSION
-- Copy and paste this entire script

-- ============================================
-- STEP 1: DROP ALL PROBLEMATIC BID POLICIES
-- ============================================
DROP POLICY IF EXISTS "Sellers can view all bids on orders they bid on" ON bids;
DROP POLICY IF EXISTS "Sellers can view bids on pending orders" ON bids;
DROP POLICY IF EXISTS "Sellers can view own bids" ON bids;
DROP POLICY IF EXISTS "Buyers can view bids on their orders" ON bids;
DROP POLICY IF EXISTS "Admins can view all bids" ON bids;
DROP POLICY IF EXISTS "Sellers can create bids" ON bids;
DROP POLICY IF EXISTS "Sellers can update own bids" ON bids;
DROP POLICY IF EXISTS "Sellers can delete own bids" ON bids;

-- ============================================
-- STEP 2: RECREATE BID POLICIES (NO RECURSION)
-- ============================================

-- Buyers can view bids on their own orders
CREATE POLICY "Buyers can view bids on their orders" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = bids.order_id AND orders.buyer_id = auth.uid())
);

-- Sellers can view their own bids
CREATE POLICY "Sellers can view own bids" ON bids FOR SELECT USING (
  auth.uid() = seller_id
);

-- Sellers can view ALL bids on pending orders (for bid comparison)
-- This does NOT reference the bids table recursively
CREATE POLICY "Sellers can view bids on pending orders" ON bids FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = bids.order_id 
    AND orders.status = 'pending'
  )
  AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'seller')
);

-- Admins can view all bids
CREATE POLICY "Admins can view all bids" ON bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Sellers can create bids
CREATE POLICY "Sellers can create bids" ON bids FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update own bids
CREATE POLICY "Sellers can update own bids" ON bids FOR UPDATE USING (auth.uid() = seller_id);

-- Sellers can delete own bids
CREATE POLICY "Sellers can delete own bids" ON bids FOR DELETE USING (auth.uid() = seller_id);

-- ============================================
-- STEP 3: ENSURE ORDERS POLICY EXISTS
-- ============================================
DROP POLICY IF EXISTS "Sellers can view all pending orders" ON orders;

CREATE POLICY "Sellers can view all pending orders" ON orders FOR SELECT USING (
  status = 'pending' AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'seller')
);

-- ============================================
-- STEP 4: VERIFY - Check all policies
-- ============================================
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('orders', 'bids')
ORDER BY tablename, policyname;

