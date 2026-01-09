// types.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: 'traditional' | 'casual' | 'party wear' | 'watches' | 'perfumes';
  isNewArrival: boolean;
  isPublished?: boolean;
  sizes: string[];
  colors: string[];
  stock: number;
  images: string[];
  slug?: string;
  createdAt?: any;
  updatedAt?: any;
  isBestSeller?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: CartItem[];
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  shippingAddress: ShippingAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  trackingNumber?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string; // Changed from zipCode
  phone: string;
  fullName?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  orders: string[];
  shippingAddress?: ShippingAddress;
}