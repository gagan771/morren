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
  sellerId: string;
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
}
