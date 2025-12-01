import { supabase } from './supabase';
import { Item, Order, Bid, User, DashboardStats } from './types';

// ============= USERS =============

export async function getUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .insert([{
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            address: user.address,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============= ITEMS =============

export async function getItems(): Promise<Item[]> {
    const { data, error } = await supabase
        .from('items')
        .select(`
      *,
      seller:users!seller_id(*)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getItemById(id: string): Promise<Item | null> {
    const { data, error } = await supabase
        .from('items')
        .select(`
      *,
      seller:users!seller_id(*)
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function getActiveItems(): Promise<Item[]> {
    const { data, error } = await supabase
        .from('items')
        .select(`
      *,
      seller:users!seller_id(*)
    `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const { data, error } = await supabase
        .from('items')
        .insert([{
            name: item.name,
            description: item.description,
            image: item.image,
            price: item.price,
            size: item.size,
            category: item.category,
            condition: item.condition,
            quantity: item.quantity,
            specifications: item.specifications,
            seller_id: item.sellerId,
            status: item.status,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.size !== undefined) updateData.size = updates.size;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.condition !== undefined) updateData.condition = updates.condition;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.specifications !== undefined) updateData.specifications = updates.specifications;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteItem(id: string): Promise<void> {
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============= ORDERS =============

export async function getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      item:items(*),
      buyer:users!buyer_id(*)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      item:items(*),
      buyer:users!buyer_id(*)
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      item:items(*),
      buyer:users!buyer_id(*)
    `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      item:items!inner(*, seller_id),
      buyer:users!buyer_id(*)
    `)
        .eq('item.seller_id', sellerId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const { data, error } = await supabase
        .from('orders')
        .insert([{
            item_id: order.itemId,
            buyer_id: order.buyerId,
            quantity: order.quantity,
            total_price: order.totalPrice,
            status: order.status,
            shipping_address: order.shippingAddress,
            notes: order.notes,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const updateData: any = {};
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.totalPrice !== undefined) updateData.total_price = updates.totalPrice;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.shippingAddress !== undefined) updateData.shipping_address = updates.shippingAddress;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============= BIDS =============

export async function getBids(): Promise<Bid[]> {
    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      order:orders(*),
      seller:users!seller_id(*)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getBidById(id: string): Promise<Bid | null> {
    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      order:orders(*),
      seller:users!seller_id(*)
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function getBidsByOrder(orderId: string): Promise<Bid[]> {
    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      order:orders(*),
      seller:users!seller_id(*)
    `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getBidsBySeller(sellerId: string): Promise<Bid[]> {
    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      order:orders(*),
      seller:users!seller_id(*)
    `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createBid(bid: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bid> {
    const { data, error } = await supabase
        .from('bids')
        .insert([{
            order_id: bid.orderId,
            seller_id: bid.sellerId,
            bid_amount: bid.bidAmount,
            estimated_delivery: bid.estimatedDelivery,
            message: bid.message,
            status: bid.status,
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateBid(id: string, updates: Partial<Bid>): Promise<Bid> {
    const updateData: any = {};
    if (updates.bidAmount !== undefined) updateData.bid_amount = updates.bidAmount;
    if (updates.estimatedDelivery !== undefined) updateData.estimated_delivery = updates.estimatedDelivery;
    if (updates.message !== undefined) updateData.message = updates.message;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
        .from('bids')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteBid(id: string): Promise<void> {
    const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============= DASHBOARD STATS =============

export async function getBuyerStats(buyerId: string): Promise<DashboardStats> {
    const [orders, bids] = await Promise.all([
        getOrdersByBuyer(buyerId),
        supabase
            .from('bids')
            .select(`
        *,
        order:orders!inner(buyer_id)
      `)
            .eq('order.buyer_id', buyerId)
    ]);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalSpent = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0);
    const activeBids = bids.data?.filter(b => b.status === 'pending').length || 0;

    return {
        totalOrders,
        pendingOrders,
        totalRevenue: totalSpent,
        activeBids,
    };
}

export async function getSellerStats(sellerId: string): Promise<DashboardStats> {
    const [orders, bids] = await Promise.all([
        getOrdersBySeller(sellerId),
        getBidsBySeller(sellerId),
    ]);

    const totalOrders = orders.length;
    const pendingBids = bids.filter(b => b.status === 'pending').length;
    const acceptedBids = bids.filter(b => b.status === 'accepted').length;
    const potentialRevenue = bids
        .filter(b => b.status === 'accepted')
        .reduce((sum, b) => sum + b.bidAmount, 0);

    return {
        totalOrders,
        totalBids: bids.length,
        pendingOrders: pendingBids,
        totalRevenue: potentialRevenue,
    };
}

export async function getAdminStats(): Promise<DashboardStats> {
    const [items, orders, bids, users] = await Promise.all([
        getItems(),
        getOrders(),
        getBids(),
        getUsers(),
    ]);

    const totalItems = items.length;
    const activeItems = items.filter(i => i.status === 'active').length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalPrice, 0);
    const totalUsers = users.length;

    return {
        totalItems,
        activeItems,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalUsers,
        totalBids: bids.length,
    };
}
