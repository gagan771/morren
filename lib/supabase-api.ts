import { supabase } from './supabase';
import { Item, Order, Bid, User, DashboardStats, RFQ, Supplier, Quote, SupplierInvite, MarketPrice, BuyerProfile } from './types';

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

    if (error) {
        // PGRST116 means no rows returned - user doesn't exist yet
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error fetching user:', error);
        throw error;
    }
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

// Admin function to create seller account
export async function createSellerAccount(email: string, password: string, name: string): Promise<{ user: User | null; error: any }> {
    try {
        // Create auth user using Supabase admin API
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role: 'seller',
                },
            },
        });

        if (authError) {
            return { user: null, error: authError };
        }

        // Wait for the database trigger to create the user profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch the created user profile
        if (authData.user) {
            const profile = await getUserById(authData.user.id);
            return { user: profile, error: null };
        }

        return { user: null, error: new Error('Failed to create user profile') };
    } catch (error: any) {
        return { user: null, error };
    }
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

// Helper function to transform order data from snake_case to camelCase
function transformOrder(data: any): Order {
    return {
        id: data.id,
        itemId: data.item_id,
        buyerId: data.buyer_id,
        quantity: data.quantity,
        totalPrice: data.total_price,
        status: data.status,
        shippingAddress: data.shipping_address,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        item: data.item,
        buyer: data.buyer,
    };
}

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
    return (data || []).map(transformOrder);
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
    return data ? transformOrder(data) : null;
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
    return (data || []).map(transformOrder);
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
    // Get all orders (not just seller's items) so sellers can bid on any order
    // Note: We fetch buyer info but mask it for privacy
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      item:items(*)
    `)
        .eq('status', 'pending') // Only show pending orders available for bidding
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform and mask buyer info for seller privacy
    return (data || []).map(order => {
        const transformed = transformOrder({ ...order, buyer: null });
        // Mask buyer info - seller should not see buyer details
        transformed.buyer = undefined;
        return transformed;
    });
}

// Get orders for seller's own items (for tracking their sales)
export async function getSellerItemOrders(sellerId: string): Promise<Order[]> {
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
    return (data || []).map(transformOrder);
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
        .select(`
            *,
            item:items(*),
            buyer:users!buyer_id(*)
        `)
        .single();

    if (error) {
        console.error('Supabase error creating order:', error);
        throw error;
    }

    // Transform snake_case to camelCase
    return {
        id: data.id,
        itemId: data.item_id,
        buyerId: data.buyer_id,
        quantity: data.quantity,
        totalPrice: data.total_price,
        status: data.status,
        shippingAddress: data.shipping_address,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        item: data.item,
        buyer: data.buyer,
    };
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
    return transformOrder(data);
}

export async function deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============= BIDS =============

// Helper function to transform bid data from snake_case to camelCase
function transformBid(data: any): Bid {
    return {
        id: data.id,
        orderId: data.order_id,
        sellerId: data.seller_id,
        bidAmount: data.bid_amount,
        estimatedDelivery: data.estimated_delivery,
        message: data.message,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        order: data.order ? transformOrder(data.order) : undefined,
        seller: data.seller,
    };
}

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
    return (data || []).map(transformBid);
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

export async function getBidsByOrder(orderId: string, maskSellerInfo: boolean = true): Promise<Bid[]> {
    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      order:orders(*)
    `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('getBidsByOrder raw data:', data); // Debug log
    
    // Transform bids - keep sellerId for comparison but mask seller name/details
    return (data || []).map(bid => {
        const transformed = transformBid({ ...bid, seller: null });
        // sellerId is kept for bid comparison, but seller details (name, email) are not exposed
        if (maskSellerInfo) {
            transformed.seller = undefined;
        }
        return transformed;
    });
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
    return (data || []).map(transformBid);
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
    return transformBid(data);
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
    return transformBid(data);
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

// ============= RFQ OPERATIONS =============

export async function getRFQs(buyerId?: string): Promise<RFQ[]> {
    let query = supabase
        .from('rfqs')
        .select(`
            *,
            invites:supplier_invites(*),
            quotes:quotes(*)
        `)
        .order('created_at', { ascending: false });

    if (buyerId) {
        query = query.eq('buyer_id', buyerId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformRFQ);
}

export async function getRFQById(id: string): Promise<RFQ | null> {
    const { data, error } = await supabase
        .from('rfqs')
        .select(`
            *,
            invites:supplier_invites(*),
            quotes:quotes(*)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data ? transformRFQ(data) : null;
}

export async function getRFQByInviteToken(token: string): Promise<{ rfq: RFQ; invite: SupplierInvite; supplier: Supplier } | null> {
    const { data: inviteData, error: inviteError } = await supabase
        .from('supplier_invites')
        .select(`
            *,
            rfq:rfqs(*),
            supplier:suppliers(*)
        `)
        .eq('invite_token', token)
        .single();

    if (inviteError || !inviteData) return null;

    const { data: rfqData } = await supabase
        .from('rfqs')
        .select(`
            *,
            invites:supplier_invites(*),
            quotes:quotes(*)
        `)
        .eq('id', inviteData.rfq_id)
        .single();

    if (!rfqData) return null;

    return {
        rfq: transformRFQ(rfqData),
        invite: transformSupplierInvite(inviteData),
        supplier: transformSupplier(inviteData.supplier),
    };
}

export async function createRFQ(rfq: Omit<RFQ, 'id' | 'createdAt' | 'invites' | 'quotes' | 'status'>): Promise<RFQ> {
    const { data, error } = await supabase
        .from('rfqs')
        .insert([{
            buyer_id: rfq.buyerId,
            product_name: rfq.productName,
            specs: rfq.specs,
            quantity: rfq.quantity,
            unit: rfq.unit,
            required_by_date: rfq.requiredByDate,
            status: 'DRAFT',
        }])
        .select()
        .single();

    if (error) throw error;
    return transformRFQ({ ...data, invites: [], quotes: [] });
}

export async function updateRFQ(id: string, updates: Partial<RFQ>): Promise<RFQ> {
    const updateData: any = {};
    if (updates.productName !== undefined) updateData.product_name = updates.productName;
    if (updates.specs !== undefined) updateData.specs = updates.specs;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.requiredByDate !== undefined) updateData.required_by_date = updates.requiredByDate;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.awardedTo !== undefined) updateData.awarded_to = updates.awardedTo;

    const { data, error } = await supabase
        .from('rfqs')
        .update(updateData)
        .eq('id', id)
        .select(`
            *,
            invites:supplier_invites(*),
            quotes:quotes(*)
        `)
        .single();

    if (error) throw error;
    return transformRFQ(data);
}

export async function addInviteToRFQ(rfqId: string, supplierId: string): Promise<SupplierInvite> {
    const inviteToken = `${rfqId}_${supplierId}_${Math.random().toString(36).substring(2, 15)}`;

    const { data, error } = await supabase
        .from('supplier_invites')
        .insert([{
            rfq_id: rfqId,
            supplier_id: supplierId,
            status: 'INVITE_SENT',
            invite_token: inviteToken,
        }])
        .select()
        .single();

    if (error) throw error;

    // Update RFQ status to OPEN if it was DRAFT
    await supabase
        .from('rfqs')
        .update({ status: 'OPEN' })
        .eq('id', rfqId)
        .eq('status', 'DRAFT');

    return transformSupplierInvite(data);
}

export async function markInviteViewed(token: string): Promise<void> {
    const { error } = await supabase
        .from('supplier_invites')
        .update({
            status: 'VIEWED',
            viewed_at: new Date().toISOString(),
        })
        .eq('invite_token', token)
        .eq('status', 'INVITE_SENT');

    if (error) throw error;
}

export async function submitQuote(
    rfqId: string,
    supplierId: string,
    supplierName: string,
    quoteData: { pricePerUnit: number; totalPrice: number; deliveryDays: number; validityDays: number; notes?: string }
): Promise<Quote> {
    // Check if quote exists
    const { data: existingQuote } = await supabase
        .from('quotes')
        .select('*')
        .eq('rfq_id', rfqId)
        .eq('supplier_id', supplierId)
        .single();

    let quote;
    if (existingQuote) {
        // Update existing quote
        const { data, error } = await supabase
            .from('quotes')
            .update({
                price_per_unit: quoteData.pricePerUnit,
                total_price: quoteData.totalPrice,
                delivery_days: quoteData.deliveryDays,
                validity_days: quoteData.validityDays,
                notes: quoteData.notes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existingQuote.id)
            .select()
            .single();

        if (error) throw error;
        quote = transformQuote(data);

        // Update invite status
        await supabase
            .from('supplier_invites')
            .update({
                status: 'UPDATED',
                quoted_at: new Date().toISOString(),
            })
            .eq('rfq_id', rfqId)
            .eq('supplier_id', supplierId);
    } else {
        // Create new quote
        const { data, error } = await supabase
            .from('quotes')
            .insert([{
                rfq_id: rfqId,
                supplier_id: supplierId,
                supplier_name: supplierName,
                price_per_unit: quoteData.pricePerUnit,
                total_price: quoteData.totalPrice,
                delivery_days: quoteData.deliveryDays,
                validity_days: quoteData.validityDays,
                notes: quoteData.notes,
            }])
            .select()
            .single();

        if (error) throw error;
        quote = transformQuote(data);

        // Update invite status
        await supabase
            .from('supplier_invites')
            .update({
                status: 'QUOTED',
                quoted_at: new Date().toISOString(),
            })
            .eq('rfq_id', rfqId)
            .eq('supplier_id', supplierId);
    }

    return quote;
}

export async function awardRFQ(rfqId: string, supplierId: string, supplierName: string, price: number): Promise<RFQ> {
    const { data, error } = await supabase
        .from('rfqs')
        .update({
            status: 'AWARDED',
            awarded_to: {
                supplierId,
                supplierName,
                price,
                awardedAt: new Date().toISOString(),
            },
        })
        .eq('id', rfqId)
        .select(`
            *,
            invites:supplier_invites(*),
            quotes:quotes(*)
        `)
        .single();

    if (error) throw error;
    return transformRFQ(data);
}

// ============= SUPPLIERS =============

export async function getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(transformSupplier);
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data ? transformSupplier(data) : null;
}

export async function createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const { data, error } = await supabase
        .from('suppliers')
        .insert([{
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            contact_person: supplier.contactPerson,
        }])
        .select()
        .single();

    if (error) throw error;
    return transformSupplier(data);
}

// ============= MARKET PRICES =============

export async function getMarketPrices(productName?: string): Promise<MarketPrice[]> {
    let query = supabase
        .from('market_prices')
        .select('*')
        .order('date', { ascending: false });

    if (productName) {
        query = query.ilike('product_name', productName);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformMarketPrice);
}

export async function addMarketPrice(productName: string, price: number): Promise<MarketPrice> {
    const { data, error } = await supabase
        .from('market_prices')
        .insert([{
            product_name: productName,
            price,
        }])
        .select()
        .single();

    if (error) throw error;
    return transformMarketPrice(data);
}

// ============= BUYER PROFILES =============

export async function getBuyerProfile(buyerId: string): Promise<BuyerProfile | null> {
    const { data, error } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('buyer_id', buyerId)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformBuyerProfile(data) : null;
}

export async function updateBuyerProfile(buyerId: string, profile: BuyerProfile): Promise<BuyerProfile> {
    const { data, error } = await supabase
        .from('buyer_profiles')
        .upsert({
            buyer_id: buyerId,
            company_name: profile.companyName,
            buyer_name: profile.buyerName,
            email: profile.email,
        })
        .select()
        .single();

    if (error) throw error;
    return transformBuyerProfile(data);
}

// ============= TRANSFORMERS =============

function transformRFQ(data: any): RFQ {
    return {
        id: data.id,
        buyerId: data.buyer_id,
        productName: data.product_name,
        specs: data.specs,
        quantity: data.quantity,
        unit: data.unit,
        requiredByDate: new Date(data.required_by_date),
        status: data.status,
        invites: (data.invites || []).map(transformSupplierInvite),
        quotes: (data.quotes || []).map(transformQuote),
        awardedTo: data.awarded_to,
        createdAt: new Date(data.created_at),
    };
}

function transformSupplierInvite(data: any): SupplierInvite {
    return {
        id: data.id,
        rfqId: data.rfq_id,
        supplierId: data.supplier_id,
        status: data.status,
        inviteToken: data.invite_token,
        sentAt: new Date(data.sent_at),
        viewedAt: data.viewed_at ? new Date(data.viewed_at) : undefined,
        quotedAt: data.quoted_at ? new Date(data.quoted_at) : undefined,
    };
}

function transformQuote(data: any): Quote {
    return {
        id: data.id,
        rfqId: data.rfq_id,
        supplierId: data.supplier_id,
        supplierName: data.supplier_name,
        pricePerUnit: parseFloat(data.price_per_unit),
        totalPrice: parseFloat(data.total_price),
        deliveryDays: data.delivery_days,
        validityDays: data.validity_days,
        notes: data.notes,
        submittedAt: new Date(data.submitted_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
}

function transformSupplier(data: any): Supplier {
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        contactPerson: data.contact_person,
    };
}

function transformMarketPrice(data: any): MarketPrice {
    return {
        id: data.id,
        productName: data.product_name,
        price: parseFloat(data.price),
        date: new Date(data.date),
    };
}

function transformBuyerProfile(data: any): BuyerProfile {
    return {
        companyName: data.company_name,
        buyerName: data.buyer_name,
        email: data.email,
    };
}

// ============= UTILITY FUNCTIONS =============

export function getLowestQuote(quotes: Quote[]): Quote | null {
    if (quotes.length === 0) return null;
    return quotes.reduce((lowest, quote) => (quote.pricePerUnit < lowest.pricePerUnit ? quote : lowest));
}

export function calculatePercentageDiff(price: number, lowestPrice: number): number {
    if (lowestPrice === 0) return 0;
    return ((price - lowestPrice) / lowestPrice) * 100;
}
