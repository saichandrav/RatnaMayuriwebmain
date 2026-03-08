import type { Product, ProductReview, ReviewEligibility, UserRole } from "@/lib/types";
import { resolveProductImages } from "@/lib/product-images";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeName?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface OrderPayloadItem {
  productId: string;
  quantity: number;
}

export interface RazorpayOrderResponse {
  order: Order;
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
  };
  keyId: string;
}

export interface RazorpayVerifyPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface Order {
  id: string;
  user?: string | { id: string; name?: string; email?: string; phone?: string };
  items: Array<{
    product: string;
    seller?: string | { id: string; name?: string; storeName?: string };
    name: string;
    image?: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: "payment_pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
  couponCode?: string | null;
  couponDiscount?: number;
  createdAt: string;
  updatedAt?: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  payment?: {
    provider?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    paymentId?: string;
    status?: "created" | "paid" | "failed";
  };
  tracking?: Array<{
    status: string;
    message?: string;
    createdAt: string;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  storeName?: string;
  createdAt?: string;
}

export interface AdminSummary {
  totalRevenue: number;
  totalUsers: number;
  totalOrders: number;
  usersByRole: Record<UserRole, number>;
}

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("auth_token");
};

const apiFetch = async (path: string, options: RequestInit & { token?: string | null } = {}) => {
  const token = options.token ?? getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

const normalizeProduct = (product: Product) => {
  const rawImage = product.images?.[0] || "";
  const imageKey = rawImage.startsWith("asset:") ? rawImage.replace("asset:", "") : undefined;
  return {
    ...product,
    images: resolveProductImages(product.images || []),
    imageKey,
  };
};

export const api = {
  async login(email: string, password: string) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }) as Promise<{ token: string; user: AuthUser }>;
  },
  async signup(name: string, email: string, password: string) {
    return apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }) as Promise<{ token: string; user: AuthUser }>;
  },
  async me() {
    return apiFetch("/auth/me") as Promise<{ user: AuthUser }>;
  },
  async getProducts(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const data = await apiFetch(`/products${query}`) as { products: Product[] };
    return data.products.map(normalizeProduct);
  },
  async getProduct(id: string) {
    const data = await apiFetch(`/products/${id}`) as { product: Product };
    return normalizeProduct(data.product);
  },
  async getProductReviews(id: string) {
    const data = await apiFetch(`/products/${id}/reviews`) as { reviews: ProductReview[] };
    return data.reviews;
  },
  async canReviewProduct(id: string) {
    const data = await apiFetch(`/products/${id}/reviews/can-review`) as ReviewEligibility;
    return data;
  },
  async createProductReview(id: string, payload: { rating: number; comment?: string }) {
    return apiFetch(`/products/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<{ review: ProductReview; product: { rating: number; reviewCount: number } }>;
  },
  async createProduct(payload: Partial<Product>) {
    const data = await apiFetch("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as { product: Product };
    return normalizeProduct(data.product);
  },
  async updateProduct(id: string, payload: Partial<Product>) {
    const data = await apiFetch(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }) as { product: Product };
    return normalizeProduct(data.product);
  },
  async deleteProduct(id: string) {
    return apiFetch(`/products/${id}`, { method: "DELETE" }) as Promise<{ success: boolean }>;
  },
  async createOrder(items: OrderPayloadItem[]) {
    return apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ items }),
    }) as Promise<{ order: Order }>;
  },
  async getOrders() {
    return apiFetch("/orders") as Promise<{ orders: Order[] }>;
  },
  async getOrder(id: string) {
    return apiFetch(`/orders/${id}`) as Promise<{ order: Order }>;
  },
  async createRazorpayOrder(items: OrderPayloadItem[], couponCode?: string, shippingAddress?: Record<string, string>) {
    return apiFetch("/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify({ items, couponCode, shippingAddress }),
    }) as Promise<RazorpayOrderResponse>;
  },
  async verifyRazorpayPayment(payload: RazorpayVerifyPayload) {
    return apiFetch("/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<{ order: Order }>;
  },
  async updateOrderStatus(id: string, status: Order["status"]) {
    return apiFetch(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }) as Promise<{ order: Order }>;
  },
  async getAdminSummary() {
    return apiFetch("/admin/summary") as Promise<{ summary: AdminSummary }>;
  },
  async getAdminUsers() {
    return apiFetch("/admin/users") as Promise<{ users: AdminUser[] }>;
  },
  async getAdminOrders() {
    return apiFetch("/admin/orders") as Promise<{ orders: Order[] }>;
  },
  async updateAdminOrder(id: string, status: Order["status"]) {
    return apiFetch(`/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }) as Promise<{ order: Order }>;
  },
  async deleteAdminOrder(id: string) {
    return apiFetch(`/admin/orders/${id}`, { method: "DELETE" }) as Promise<{ success: boolean }>;
  },
  async getAdminSellers() {
    return apiFetch("/admin/sellers") as Promise<{ sellers: AdminUser[] }>;
  },
  async createAdminSeller(payload: {
    name: string;
    email: string;
    password: string;
    storeName?: string;
    phone?: string;
    address?: string;
  }) {
    return apiFetch("/admin/sellers", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<{ seller: AdminUser }>;
  },
  async deleteAdminSeller(id: string) {
    return apiFetch(`/admin/sellers/${id}`, { method: "DELETE" }) as Promise<{ success: boolean }>;
  },
  async getAdminMarketers() {
    return apiFetch("/admin/marketers") as Promise<{ marketers: Array<AdminUser & { stats?: { totalCoupons: number; activeCoupons: number; totalOrders: number; totalEarnings: number; pendingPayout: number } }> }>;
  },
  async createAdminMarketer(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    couponCode: string;
    commissionRate?: number;
  }) {
    return apiFetch("/admin/marketers", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<{ marketer: AdminUser }>;
  },
  async deleteAdminMarketer(id: string) {
    return apiFetch(`/admin/marketers/${id}`, { method: "DELETE" }) as Promise<{ success: boolean }>;
  },
  async getAdminSupportTeam() {
    return apiFetch("/admin/support-team") as Promise<{ members: AdminUser[] }>;
  },
  async createAdminSupportMember(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return apiFetch("/admin/support-team", {
      method: "POST",
      body: JSON.stringify(payload),
    }) as Promise<{ member: AdminUser }>;
  },
  async deleteAdminSupportMember(id: string) {
    return apiFetch(`/admin/support-team/${id}`, { method: "DELETE" }) as Promise<{ success: boolean }>;
  },
  async uploadImage(file: File) {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }
    return data as { url: string };
  },
  async getUserProfile() {
    return apiFetch("/auth/me") as Promise<{ user: AuthUser }>;
  },
  async updateProfile(payload: { name?: string; phone?: string; address?: Record<string, string> }) {
    return apiFetch("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }) as Promise<{ user: AuthUser }>;
  },
};
