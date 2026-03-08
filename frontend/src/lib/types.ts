export interface Product {
  id: string;
  name: string;
  category: 'jewellery' | 'saree';
  subCategory: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  imageKey?: string;
  seller: {
    id: string;
    name: string;
  };
  stock: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
}

export interface ProductReview {
  id: string;
  product: string;
  user: {
    id: string;
    name: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibility {
  canReview: boolean;
  hasEligibleOrder: boolean;
  hasReviewed: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FlyingItem {
  id: number;
  image: string;
  startX: number;
  startY: number;
}

export type UserRole = 'admin' | 'seller' | 'customer' | 'marketer' | 'support';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CheckoutItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  subCategories: string[];
}