// Core Types for Marketplace System

export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  size: string;
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  quantity: number;
  specifications: {
    [key: string]: string;
  };
  sellerId: string | null; // Nullable for bid request items
  seller?: User;
  status: 'active' | 'sold' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  itemId: string;
  item?: Item;
  buyerId: string;
  buyer?: User;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  shippingAddress: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: string;
  orderId: string;
  order?: Order;
  sellerId: string;
  seller?: User;
  bidAmount: number;
  estimatedDelivery: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalItems?: number;
  totalOrders?: number;
  totalBids?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  activeItems?: number;
  totalUsers?: number;
  activeBids?: number;
}

// RFQ Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
}

export interface SupplierInvite {
  id: string;
  rfqId: string;
  supplierId: string;
  status: 'INVITE_SENT' | 'VIEWED' | 'QUOTED' | 'UPDATED';
  inviteToken: string;
  sentAt: Date;
  viewedAt?: Date;
  quotedAt?: Date;
}

export interface Quote {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryDays: number;
  validityDays: number;
  notes?: string;
  submittedAt: Date;
  updatedAt?: Date;
}

export interface RFQ {
  id: string;
  buyerId: string;
  productName: string;
  specs: string;
  quantity: number;
  unit: string;
  requiredByDate: Date;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'AWARDED';
  invites: SupplierInvite[];
  quotes: Quote[];
  awardedTo?: {
    supplierId: string;
    supplierName: string;
    price: number;
    awardedAt: Date;
  };
  createdAt: Date;
}

export interface MarketPrice {
  id: string;
  productName: string;
  price: number;
  date: Date;
}

export interface BuyerProfile {
  companyName: string;
  buyerName: string;
  email: string;
}
