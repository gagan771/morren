import { User, Item, Order, Bid } from './types';

// Mock Users
export const mockUsers: User[] = [
    {
        id: '1',
        name: 'John Buyer',
        email: 'john@buyer.com',
        role: 'buyer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        phone: '+1 234 567 8901',
        address: '123 Main St, New York, NY 10001',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        id: '2',
        name: 'Sarah Seller',
        email: 'sarah@seller.com',
        role: 'seller',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        phone: '+1 234 567 8902',
        address: '456 Oak Ave, Los Angeles, CA 90001',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
    },
    {
        id: '3',
        name: 'Admin User',
        email: 'admin@marketplace.com',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        phone: '+1 234 567 8903',
        address: '789 Admin Blvd, Chicago, IL 60601',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
];

// Mock Items
export const mockItems: Item[] = [
    {
        id: '1',
        name: 'Fresh Organic Tomatoes',
        description: 'Premium quality organic tomatoes, freshly harvested from local farms. Perfect for salads, cooking, and sauces.',
        image: '/api/placeholder/400/300',
        price: 4.99,
        size: '1 kg',
        category: 'Vegetables',
        condition: 'new',
        quantity: 100,
        specifications: {
            'Origin': 'Local Farm',
            'Organic': 'Yes',
            'Harvest Date': '2024-11-25',
            'Variety': 'Roma',
            'Color': 'Deep Red',
            'Shelf Life': '7 days',
            'Storage': 'Cool, dry place',
            'Certification': 'USDA Organic',
        },
        sellerId: '2',
        status: 'active',
        createdAt: new Date('2024-11-20'),
        updatedAt: new Date('2024-11-25'),
    },
    {
        id: '2',
        name: 'Premium Laptop - Dell XPS 15',
        description: 'High-performance laptop with Intel i7 processor, 16GB RAM, and 512GB SSD. Perfect for professionals and creators.',
        image: '/api/placeholder/400/300',
        price: 1299.99,
        size: '15 inch',
        category: 'Electronics',
        condition: 'new',
        quantity: 5,
        specifications: {
            'Processor': 'Intel Core i7-12700H',
            'RAM': '16GB DDR5',
            'Storage': '512GB NVMe SSD',
            'Display': '15.6" FHD (1920x1080)',
            'Graphics': 'NVIDIA GeForce RTX 3050',
            'Battery': 'Up to 10 hours',
            'Weight': '1.86 kg',
            'Warranty': '1 year',
        },
        sellerId: '2',
        status: 'active',
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-11-20'),
    },
    {
        id: '3',
        name: 'Wireless Headphones',
        description: 'Premium noise-cancelling wireless headphones with superior sound quality and long battery life.',
        image: '/api/placeholder/400/300',
        price: 199.99,
        size: 'Standard',
        category: 'Electronics',
        condition: 'new',
        quantity: 20,
        specifications: {
            'Type': 'Over-ear',
            'Connectivity': 'Bluetooth 5.0',
            'Battery Life': '30 hours',
            'Noise Cancellation': 'Active',
            'Driver Size': '40mm',
            'Weight': '250g',
            'Color': 'Black',
            'Warranty': '2 years',
        },
        sellerId: '2',
        status: 'active',
        createdAt: new Date('2024-11-10'),
        updatedAt: new Date('2024-11-15'),
    },
    {
        id: '4',
        name: 'Organic Carrots',
        description: 'Fresh organic carrots, crunchy and sweet. Great for snacking, cooking, or juicing.',
        image: '/api/placeholder/400/300',
        price: 3.49,
        size: '1 kg',
        category: 'Vegetables',
        condition: 'new',
        quantity: 150,
        specifications: {
            'Origin': 'Local Farm',
            'Organic': 'Yes',
            'Harvest Date': '2024-11-26',
            'Variety': 'Nantes',
            'Color': 'Orange',
            'Shelf Life': '14 days',
            'Storage': 'Refrigerate',
            'Certification': 'USDA Organic',
        },
        sellerId: '2',
        status: 'active',
        createdAt: new Date('2024-11-22'),
        updatedAt: new Date('2024-11-26'),
    },
];

// Mock Orders
export const mockOrders: Order[] = [
    {
        id: '1',
        itemId: '1',
        buyerId: '1',
        quantity: 5,
        totalPrice: 24.95,
        status: 'pending',
        shippingAddress: '123 Main St, New York, NY 10001',
        notes: 'Please ensure tomatoes are fresh and ripe.',
        createdAt: new Date('2024-11-26'),
        updatedAt: new Date('2024-11-26'),
    },
    {
        id: '2',
        itemId: '2',
        buyerId: '1',
        quantity: 1,
        totalPrice: 1299.99,
        status: 'accepted',
        shippingAddress: '123 Main St, New York, NY 10001',
        notes: 'Need delivery by end of week.',
        createdAt: new Date('2024-11-25'),
        updatedAt: new Date('2024-11-26'),
    },
    {
        id: '3',
        itemId: '3',
        buyerId: '1',
        quantity: 2,
        totalPrice: 399.98,
        status: 'completed',
        shippingAddress: '123 Main St, New York, NY 10001',
        notes: '',
        createdAt: new Date('2024-11-20'),
        updatedAt: new Date('2024-11-24'),
    },
];

// Mock Bids
export const mockBids: Bid[] = [
    {
        id: '1',
        orderId: '1',
        sellerId: '2',
        bidAmount: 23.50,
        estimatedDelivery: new Date('2024-11-28'),
        message: 'I can deliver fresh organic tomatoes by tomorrow. Best quality guaranteed!',
        status: 'pending',
        createdAt: new Date('2024-11-26'),
        updatedAt: new Date('2024-11-26'),
    },
    {
        id: '2',
        orderId: '2',
        sellerId: '2',
        bidAmount: 1250.00,
        estimatedDelivery: new Date('2024-11-30'),
        message: 'Brand new laptop with full warranty. Can offer a competitive price.',
        status: 'accepted',
        createdAt: new Date('2024-11-25'),
        updatedAt: new Date('2024-11-26'),
    },
];

// Helper functions to get related data
export function getItemsWithSeller(): Item[] {
    return mockItems.map(item => ({
        ...item,
        seller: mockUsers.find(u => u.id === item.sellerId),
    }));
}

export function getOrdersWithDetails(): Order[] {
    return mockOrders.map(order => ({
        ...order,
        item: mockItems.find(i => i.id === order.itemId),
        buyer: mockUsers.find(u => u.id === order.buyerId),
    }));
}

export function getBidsWithDetails(): Bid[] {
    return mockBids.map(bid => ({
        ...bid,
        order: mockOrders.find(o => o.id === bid.orderId),
        seller: mockUsers.find(u => u.id === bid.sellerId),
    }));
}
