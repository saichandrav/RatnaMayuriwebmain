import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  Megaphone,
  TicketCheck,
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Plus,
  Pencil,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  BoxIcon,
  RotateCcw,
  IndianRupee,
  Users,
  TrendingUp,
  MessageSquare,
  Send,
  StickyNote,
  Filter,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { api, type AdminSummary, type AdminUser, type Order } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   HELPERS & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const formatCurrency = (v: number) => `₹${v.toLocaleString("en-IN")}`;
const formatDate = (v: string) => new Date(v).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
const formatDateTime = (v: string) => new Date(v).toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

type OrderStatus = "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "returned" | "payment_pending";
type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
type TicketStatus = "open" | "in_progress" | "closed";
type IssueType = "delivery" | "payment" | "product" | "return" | "other";

interface SupportOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productName: string;
  productImage: string;
  sellerName: string;
  sellerPhone: string;
  sellerStore: string;
  marketer: string | null;
  orderDate: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingId: string | null;
  courierName: string | null;
  shippingAddress: { line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  internalNotes: string[];
  isResolved: boolean;
}

interface SupportSeller {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeName: string;
  totalOrders: number;
  totalRevenue: number;
  status: "active" | "suspended";
  joinedAt: string;
}

interface SupportMarketer {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number;
  totalSales: number;
  totalEarnings: number;
  linkedOrders: number;
  isActive: boolean;
  joinedAt: string;
}

interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  relatedOrderId: string | null;
  issueType: IssueType;
  subject: string;
  status: TicketStatus;
  messages: { from: "customer" | "support"; text: string; at: string }[];
  internalNotes: string[];
  createdAt: string;
  updatedAt: string;
}

interface SupportDashboardSummary {
  totalOrdersToday: number;
  pendingOrders: number;
  activeSellers: number;
  totalMarketers: number;
  revenueToday: number;
  revenueThisMonth: number;
  openTickets: number;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1515562141589-67f0d569b4b5?w=120&h=120&fit=crop";

const mapPaymentStatus = (status?: Order["payment"]["status"]): PaymentStatus => {
  if (status === "paid") return "paid";
  if (status === "failed") return "failed";
  return "pending";
};

const mapAdminOrder = (order: Order): SupportOrder => {
  const firstItem = order.items?.[0];
  const customer = typeof order.user === "object" && order.user ? order.user : undefined;
  const sellerObj = typeof firstItem?.seller === "object" && firstItem?.seller ? firstItem.seller : undefined;
  const shipping = order.shippingAddress;

  return {
    id: order.id,
    customerName: customer?.name || "Customer",
    customerPhone: customer?.phone || "-",
    customerEmail: customer?.email || "-",
    productName: firstItem?.name || "Product",
    productImage: firstItem?.image || FALLBACK_IMAGE,
    sellerName: sellerObj?.name || "Seller",
    sellerPhone: "-",
    sellerStore: sellerObj?.storeName || "-",
    marketer: order.couponCode || null,
    orderDate: order.createdAt,
    paymentStatus: mapPaymentStatus(order.payment?.status),
    orderStatus: order.status,
    trackingId: null,
    courierName: null,
    shippingAddress: {
      line1: shipping?.line1 || "-",
      line2: shipping?.line2,
      city: shipping?.city || "-",
      state: shipping?.state || "-",
      postalCode: shipping?.postalCode || "-",
      country: shipping?.country || "India",
    },
    subtotal: order.subtotal,
    shipping: order.shipping,
    couponDiscount: order.couponDiscount || 0,
    total: order.total,
    internalNotes: [],
    isResolved: order.status === "delivered" || order.status === "cancelled",
  };
};

const mapSeller = (seller: AdminUser): SupportSeller => ({
  id: seller.id,
  name: seller.name,
  email: seller.email,
  phone: seller.phone || "-",
  storeName: seller.storeName || "-",
  totalOrders: 0,
  totalRevenue: 0,
  status: "active",
  joinedAt: seller.createdAt || new Date().toISOString(),
});

const mapSummary = (summary: AdminSummary, orders: SupportOrder[], sellers: SupportSeller[], marketers: SupportMarketer[]): SupportDashboardSummary => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const totalOrdersToday = orders.filter((o) => {
    const date = new Date(o.orderDate);
    return date.toDateString() === today.toDateString();
  }).length;

  const revenueToday = orders
    .filter((o) => {
      const date = new Date(o.orderDate);
      return date.toDateString() === today.toDateString() && o.orderStatus !== "cancelled";
    })
    .reduce((acc, o) => acc + o.total, 0);

  const revenueThisMonth = orders
    .filter((o) => {
      const date = new Date(o.orderDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && o.orderStatus !== "cancelled";
    })
    .reduce((acc, o) => acc + o.total, 0);

  return {
    totalOrdersToday,
    pendingOrders: orders.filter((o) => o.orderStatus === "payment_pending" || o.orderStatus === "confirmed" || o.orderStatus === "packed").length,
    activeSellers: sellers.filter((s) => s.status === "active").length,
    totalMarketers: marketers.length,
    revenueToday,
    revenueThisMonth: revenueThisMonth || summary.totalRevenue,
    openTickets: 0,
  };
};

const ORDER_STATUSES: OrderStatus[] = ["payment_pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];
const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "pending", "failed", "refunded"];

const ORDER_STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  payment_pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle2 },
  packed: { label: "Packed", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: BoxIcon },
  shipped: { label: "Shipped", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle },
  returned: { label: "Returned", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", icon: RotateCcw },
};

const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  failed: { label: "Failed", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  refunded: { label: "Refunded", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
};

const TICKET_STATUS_META: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  in_progress: { label: "In Progress", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  closed: { label: "Closed", color: "text-green-700", bg: "bg-green-50 border-green-200" },
};

const PAGE_SIZE = 5;

type Tab = "dashboard" | "orders" | "sellers" | "marketers" | "tickets";

const SIDEBAR_ITEMS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "sellers", label: "Sellers", icon: Store },
  { key: "marketers", label: "Marketers", icon: Megaphone },
  { key: "tickets", label: "Tickets", icon: TicketCheck },
];

/* ═══════════════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ── Status Badge ─────────────────────────────────────────── */
function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${color} ${bg}`}>
      {label}
    </span>
  );
}

/* ── Skeleton Loader ──────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-secondary/50 ${className}`} />;
}

/* ── Empty State ──────────────────────────────────────────── */
function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-4">
        <Icon size={28} />
      </div>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{sub}</p>}
    </div>
  );
}

/* ── Pagination ───────────────────────────────────────────── */
function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(1)} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"><ChevronsLeft size={14} /></button>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft size={14} /></button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, idx, arr) => (
            <span key={p}>
              {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 rounded-lg text-xs font-medium ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
              >
                {p}
              </button>
            </span>
          ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"><ChevronRight size={14} /></button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"><ChevronsRight size={14} /></button>
      </div>
    </div>
  );
}

/* ── Modal / Drawer ───────────────────────────────────────── */
function Drawer({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`h-full bg-card border-l border-border shadow-2xl overflow-y-auto ${wide ? "w-full max-w-2xl" : "w-full max-w-lg"}`}
          >
            <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Modal (centered) ─────────────────────────────────────── */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/* ── Section animation ────────────────────────────────────── */
const sectionAnim = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

const SupportDashboard = () => {
  const { user, logout } = useAuth();

  /* ── state ──────────────────────────────── */
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // data
  const [orders, setOrders] = useState<SupportOrder[]>([]);
  const [sellers, setSellers] = useState<SupportSeller[]>([]);
  const [marketers, setMarketers] = useState<SupportMarketer[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [summary, setSummary] = useState<SupportDashboardSummary | null>(null);

  // order tab
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>("all");
  const [orderPage, setOrderPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<SupportOrder | null>(null);
  const [editTrackingId, setEditTrackingId] = useState("");
  const [editCourier, setEditCourier] = useState("");
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>("confirmed");
  const [newNote, setNewNote] = useState("");

  // seller tab
  const [sellerSearch, setSellerSearch] = useState("");
  const [sellerPage, setSellerPage] = useState(1);
  const [addSellerOpen, setAddSellerOpen] = useState(false);
  const [sellerForm, setSellerForm] = useState({ name: "", email: "", phone: "", storeName: "" });

  // marketer tab
  const [marketerSearch, setMarketerSearch] = useState("");
  const [marketerPage, setMarketerPage] = useState(1);
  const [addMarketerOpen, setAddMarketerOpen] = useState(false);
  const [marketerForm, setMarketerForm] = useState({ name: "", email: "", phone: "", commissionRate: "5" });
  const [editMarketer, setEditMarketer] = useState<SupportMarketer | null>(null);

  // ticket tab
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<"all" | TicketStatus>("all");
  const [ticketPage, setTicketPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [ticketNote, setTicketNote] = useState("");

  /* ── load live data ─────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);

        const [summaryRes, ordersRes, sellersRes, marketersRes] = await Promise.all([
          api.getAdminSummary(),
          api.getAdminOrders(),
          api.getAdminSellers(),
          api.getAdminMarketers(),
        ]);

        const mappedOrders = ordersRes.orders.map(mapAdminOrder);
        const mappedSellers = sellersRes.sellers.map(mapSeller);
        const mappedMarketers: SupportMarketer[] = marketersRes.marketers.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone || "-",
          commissionRate: m.stats?.totalOrders ? Math.round((m.stats.totalEarnings / Math.max(1, m.stats.totalOrders)) * 100) : 5,
          totalSales: m.stats?.totalEarnings ? m.stats.totalEarnings * 10 : 0,
          totalEarnings: m.stats?.totalEarnings || 0,
          linkedOrders: m.stats?.totalOrders || 0,
          isActive: true,
          joinedAt: m.createdAt || new Date().toISOString(),
        }));

        setOrders(mappedOrders);
        setSellers(mappedSellers);
        setMarketers(mappedMarketers);
        setTickets([]);
        setSummary(mapSummary(summaryRes.summary, mappedOrders, mappedSellers, mappedMarketers));
      } catch (error) {
        toast("Failed to load support dashboard", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  /* ── filtered / paginated orders ────────── */
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderStatusFilter !== "all") list = list.filter((o) => o.orderStatus === orderStatusFilter);
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.productName.toLowerCase().includes(q) ||
          o.sellerName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, orderSearch, orderStatusFilter]);
  const orderPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice((orderPage - 1) * PAGE_SIZE, orderPage * PAGE_SIZE);

  /* ── filtered / paginated sellers ───────── */
  const filteredSellers = useMemo(() => {
    if (!sellerSearch) return sellers;
    const q = sellerSearch.toLowerCase();
    return sellers.filter((s) => s.name.toLowerCase().includes(q) || s.storeName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [sellers, sellerSearch]);
  const sellerPages = Math.max(1, Math.ceil(filteredSellers.length / PAGE_SIZE));
  const pagedSellers = filteredSellers.slice((sellerPage - 1) * PAGE_SIZE, sellerPage * PAGE_SIZE);

  /* ── filtered / paginated marketers ─────── */
  const filteredMarketers = useMemo(() => {
    if (!marketerSearch) return marketers;
    const q = marketerSearch.toLowerCase();
    return marketers.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [marketers, marketerSearch]);
  const marketerPages = Math.max(1, Math.ceil(filteredMarketers.length / PAGE_SIZE));
  const pagedMarketers = filteredMarketers.slice((marketerPage - 1) * PAGE_SIZE, marketerPage * PAGE_SIZE);

  /* ── filtered / paginated tickets ───────── */
  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (ticketStatusFilter !== "all") list = list.filter((t) => t.status === ticketStatusFilter);
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      list = list.filter((t) => t.id.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
    }
    return list;
  }, [tickets, ticketSearch, ticketStatusFilter]);
  const ticketPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const pagedTickets = filteredTickets.slice((ticketPage - 1) * PAGE_SIZE, ticketPage * PAGE_SIZE);

  /* ── order drawer helpers ───────────────── */
  const openOrderDetail = (o: SupportOrder) => {
    setSelectedOrder(o);
    setEditTrackingId(o.trackingId || "");
    setEditCourier(o.courierName || "");
    setEditOrderStatus(o.orderStatus);
    setNewNote("");
  };

  const saveOrderChanges = async () => {
    if (!selectedOrder) return;
    try {
      await api.updateAdminOrder(selectedOrder.id, editOrderStatus === "returned" ? "cancelled" : editOrderStatus);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, orderStatus: editOrderStatus } : o)));
      setSelectedOrder(null);
      toast("Order updated");
    } catch (error) {
      toast("Failed to update order", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const markOrderResolved = async () => {
    if (!selectedOrder) return;
    try {
      await api.updateAdminOrder(selectedOrder.id, "delivered");
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, isResolved: true, orderStatus: "delivered" } : o)));
      setSelectedOrder(null);
      toast("Order marked as resolved");
    } catch (error) {
      toast("Failed to resolve order", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  /* ── seller helpers ─────────────────────── */
  const handleAddSeller = (e: FormEvent) => {
    e.preventDefault();
    toast("Use Admin Dashboard to add sellers", {
      description: "Support dashboard no longer creates temporary seller data.",
    });
  };

  const toggleSellerStatus = (_id: string) => {
    toast("Seller status change unavailable", {
      description: "No backend endpoint exists for seller suspend/activate yet.",
    });
  };

  /* ── marketer helpers ───────────────────── */
  const handleAddMarketer = (e: FormEvent) => {
    e.preventDefault();
    toast("Use Admin Dashboard to add marketers", {
      description: "Support dashboard no longer creates temporary marketer data.",
    });
  };

  const toggleMarketerActive = (_id: string) => {
    toast("Marketer status change unavailable", {
      description: "No backend endpoint exists for marketer activation yet.",
    });
  };

  const saveMarketerCommission = () => {
    if (!editMarketer) return;
    toast("Commission editing unavailable", {
      description: "No backend endpoint exists for commission updates yet.",
    });
    setEditMarketer(null);
  };

  /* ── ticket helpers ─────────────────────── */
  const openTicketDetail = (t: SupportTicket) => {
    setSelectedTicket(t);
    setReplyText("");
    setTicketNote("");
  };

  const sendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    const updated: SupportTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, { from: "support", text: replyText.trim(), at: new Date().toISOString() }],
      status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
      updatedAt: new Date().toISOString(),
    };
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setReplyText("");
    toast("Reply sent");
  };

  const addTicketNote = () => {
    if (!selectedTicket || !ticketNote.trim()) return;
    const updated: SupportTicket = {
      ...selectedTicket,
      internalNotes: [...selectedTicket.internalNotes, ticketNote.trim()],
      updatedAt: new Date().toISOString(),
    };
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setTicketNote("");
    toast("Note added");
  };

  const closeTicket = () => {
    if (!selectedTicket) return;
    const updated: SupportTicket = { ...selectedTicket, status: "closed", updatedAt: new Date().toISOString() };
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(null);
    toast("Ticket closed");
  };

  /* ── switch tab ─────────────────────────── */
  const switchTab = useCallback((t: Tab) => {
    setTab(t);
    setSidebarOpen(false);
  }, []);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-[#f8f6f3] dark:bg-background overflow-hidden">

      {/* ─── SIDEBAR ──────────────────────────────────────── */}
      {/* overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border/50 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">R</div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">Ratnamayuri</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Support Console</p>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                tab === key
                  ? "bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-800 shadow-sm dark:from-amber-900/20 dark:to-amber-800/10 dark:text-amber-300"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon size={17} />
              {label}
              {key === "tickets" && summary && summary.openTickets > 0 && (
                <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">{summary.openTickets}</span>
              )}
            </button>
          ))}
        </nav>

        {/* user */}
        <div className="border-t border-border/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
              {(user?.name || "S").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name || "Support"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN AREA ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* top bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-card border-b border-border/50 shrink-0">
          <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary"><Menu size={20} /></button>

          <div className="flex-1 flex items-center gap-2 max-w-md">
            <div className="flex items-center gap-2 flex-1 rounded-xl bg-[#f4f1ec] dark:bg-secondary/60 px-3 py-2">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && globalSearch.trim()) {
                    setOrderSearch(globalSearch.trim());
                    switchTab("orders");
                  }
                }}
                placeholder="Search orders, sellers, tickets…"
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
          </div>

          <button type="button" className="relative p-2 rounded-xl hover:bg-secondary text-muted-foreground">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </header>

        {/* content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">

            {/* ════════════ DASHBOARD TAB ════════════ */}
            {tab === "dashboard" && (
              <motion.div key="dashboard" variants={sectionAnim} initial="hidden" animate="visible" exit="exit">
                <h2 className="text-lg font-bold text-foreground mb-5">Dashboard Overview</h2>
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28" />)}
                  </div>
                ) : summary && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard label="Orders Today" value={summary.totalOrdersToday} icon={ShoppingCart} color="bg-blue-50 text-blue-600" />
                      <StatCard label="Pending Orders" value={summary.pendingOrders} icon={Clock} color="bg-amber-50 text-amber-600" />
                      <StatCard label="Active Sellers" value={summary.activeSellers} icon={Store} color="bg-green-50 text-green-600" />
                      <StatCard label="Total Marketers" value={summary.totalMarketers} icon={Megaphone} color="bg-purple-50 text-purple-600" />
                      <StatCard label="Revenue Today" value={formatCurrency(summary.revenueToday)} icon={IndianRupee} color="bg-emerald-50 text-emerald-600" />
                      <StatCard label="Revenue This Month" value={formatCurrency(summary.revenueThisMonth)} icon={TrendingUp} color="bg-cyan-50 text-cyan-600" />
                      <StatCard label="Open Tickets" value={summary.openTickets} icon={TicketCheck} color="bg-red-50 text-red-500" />
                      <StatCard label="Total Users" value={sellers.length + marketers.length} icon={Users} color="bg-indigo-50 text-indigo-600" sub="Sellers + Marketers" />
                    </div>

                    {/* recent activity */}
                    <div className="mt-6 rounded-2xl border border-border/50 bg-card p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((o) => (
                          <div key={o.id} className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0"><Package size={14} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground truncate"><span className="font-medium">{o.id}</span> — {o.customerName}</p>
                              <p className="text-xs text-muted-foreground">{o.productName}</p>
                            </div>
                            <StatusBadge {...ORDER_STATUS_META[o.orderStatus]} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ════════════ ORDERS TAB ════════════ */}
            {tab === "orders" && (
              <motion.div key="orders" variants={sectionAnim} initial="hidden" animate="visible" exit="exit">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <h2 className="text-lg font-bold text-foreground">Orders Management</h2>
                </div>

                {/* filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1 rounded-xl border border-border/60 bg-card px-3 py-2">
                    <Search size={14} className="text-muted-foreground" />
                    <input value={orderSearch} onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }} placeholder="Search by ID, customer, product, seller…" className="bg-transparent text-sm outline-none w-full" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <select value={orderStatusFilter} onChange={(e) => { setOrderStatusFilter(e.target.value as typeof orderStatusFilter); setOrderPage(1); }} className="bg-transparent text-sm outline-none">
                      <option value="all">All Statuses</option>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>)}
                    </select>
                  </div>
                </div>

                {/* table */}
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
                ) : filteredOrders.length === 0 ? (
                  <EmptyState icon={ShoppingCart} message="No orders found." sub="Try adjusting your search or filters." />
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 bg-[#faf8f5] dark:bg-secondary/30">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Customer</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Product</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Seller</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Date</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedOrders.map((order) => (
                            <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{order.id}<span className="block md:hidden text-xs text-muted-foreground mt-0.5">{order.customerName}</span></td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <p className="text-foreground">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground truncate max-w-[180px]">{order.productName}</td>
                              <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{order.sellerName}</td>
                              <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground whitespace-nowrap">{formatDate(order.orderDate)}</td>
                              <td className="px-4 py-3"><StatusBadge {...PAYMENT_STATUS_META[order.paymentStatus]} /></td>
                              <td className="px-4 py-3"><StatusBadge {...ORDER_STATUS_META[order.orderStatus]} /></td>
                              <td className="px-4 py-3 text-center">
                                <button type="button" onClick={() => openOrderDetail(order)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors" title="View Details">
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3">
                      <Pagination page={orderPage} totalPages={orderPages} onPageChange={setOrderPage} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════ SELLERS TAB ════════════ */}
            {tab === "sellers" && (
              <motion.div key="sellers" variants={sectionAnim} initial="hidden" animate="visible" exit="exit">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <h2 className="text-lg font-bold text-foreground">Sellers Management</h2>
                  <button type="button" onClick={() => setAddSellerOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus size={14} /> Add Seller
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 mb-4 max-w-md">
                  <Search size={14} className="text-muted-foreground" />
                  <input value={sellerSearch} onChange={(e) => { setSellerSearch(e.target.value); setSellerPage(1); }} placeholder="Search sellers…" className="bg-transparent text-sm outline-none w-full" />
                </div>

                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : filteredSellers.length === 0 ? (
                  <EmptyState icon={Store} message="No sellers found." />
                ) : (
                  <div className="space-y-3">
                    {pagedSellers.map((seller) => (
                      <div key={seller.id} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-foreground font-bold text-sm shrink-0">
                          {seller.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{seller.name}</p>
                            <StatusBadge label={seller.status === "active" ? "Active" : "Suspended"} color={seller.status === "active" ? "text-green-700" : "text-red-600"} bg={seller.status === "active" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{seller.storeName} · {seller.email} · {seller.phone}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{seller.totalOrders} orders · {formatCurrency(seller.totalRevenue)} revenue</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => toggleSellerStatus(seller.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${seller.status === "active" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                            {seller.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </div>
                    ))}
                    <Pagination page={sellerPage} totalPages={sellerPages} onPageChange={setSellerPage} />
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════ MARKETERS TAB ════════════ */}
            {tab === "marketers" && (
              <motion.div key="marketers" variants={sectionAnim} initial="hidden" animate="visible" exit="exit">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <h2 className="text-lg font-bold text-foreground">Marketers / Affiliates</h2>
                  <button type="button" onClick={() => setAddMarketerOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus size={14} /> Add Marketer
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 mb-4 max-w-md">
                  <Search size={14} className="text-muted-foreground" />
                  <input value={marketerSearch} onChange={(e) => { setMarketerSearch(e.target.value); setMarketerPage(1); }} placeholder="Search marketers…" className="bg-transparent text-sm outline-none w-full" />
                </div>

                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : filteredMarketers.length === 0 ? (
                  <EmptyState icon={Megaphone} message="No marketers found." />
                ) : (
                  <div className="space-y-3">
                    {pagedMarketers.map((m) => (
                      <div key={m.id} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{m.name}</p>
                            <StatusBadge label={m.isActive ? "Active" : "Inactive"} color={m.isActive ? "text-green-700" : "text-slate-500"} bg={m.isActive ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.email} · {m.phone}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Commission: <span className="font-semibold text-foreground">{m.commissionRate}%</span> ·
                            Sales: {formatCurrency(m.totalSales)} ·
                            Earned: {formatCurrency(m.totalEarnings)} ·
                            {m.linkedOrders} orders
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button type="button" onClick={() => setEditMarketer({ ...m })} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors">
                            <Pencil size={12} className="inline -mt-0.5 mr-1" /> Edit
                          </button>
                          <button type="button" onClick={() => toggleMarketerActive(m.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${m.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                            {m.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    ))}
                    <Pagination page={marketerPage} totalPages={marketerPages} onPageChange={setMarketerPage} />
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════ TICKETS TAB ════════════ */}
            {tab === "tickets" && (
              <motion.div key="tickets" variants={sectionAnim} initial="hidden" animate="visible" exit="exit">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <h2 className="text-lg font-bold text-foreground">Support Tickets</h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1 rounded-xl border border-border/60 bg-card px-3 py-2">
                    <Search size={14} className="text-muted-foreground" />
                    <input value={ticketSearch} onChange={(e) => { setTicketSearch(e.target.value); setTicketPage(1); }} placeholder="Search tickets…" className="bg-transparent text-sm outline-none w-full" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
                    <Filter size={14} className="text-muted-foreground" />
                    <select value={ticketStatusFilter} onChange={(e) => { setTicketStatusFilter(e.target.value as typeof ticketStatusFilter); setTicketPage(1); }} className="bg-transparent text-sm outline-none">
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
                ) : filteredTickets.length === 0 ? (
                  <EmptyState icon={TicketCheck} message="No tickets found." sub="All clear! No support tickets match your criteria." />
                ) : (
                  <div className="space-y-3">
                    {pagedTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => openTicketDetail(ticket)}
                        className="w-full text-left rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md hover:border-border transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                            <MessageSquare size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-muted-foreground">{ticket.id}</span>
                              <StatusBadge {...TICKET_STATUS_META[ticket.status]} />
                              <span className="text-[10px] text-muted-foreground capitalize border border-border/60 rounded-full px-2 py-0.5">{ticket.issueType}</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground mt-1">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ticket.customerName} · {ticket.relatedOrderId || "No order"} · {formatDateTime(ticket.updatedAt)}</p>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                        </div>
                      </button>
                    ))}
                    <Pagination page={ticketPage} totalPages={ticketPages} onPageChange={setTicketPage} />
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
         DRAWERS & MODALS
         ═══════════════════════════════════════════════════════ */}

      {/* ── Order Detail Drawer ───────────────────────────── */}
      <Drawer open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.id || ""}`} wide>
        {selectedOrder && (
          <div className="space-y-6">
            {/* customer & seller */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard title="Customer">
                <InfoLine label="Name" value={selectedOrder.customerName} />
                <InfoLine label="Phone" value={selectedOrder.customerPhone} />
                <InfoLine label="Email" value={selectedOrder.customerEmail} />
              </InfoCard>
              <InfoCard title="Seller">
                <InfoLine label="Name" value={selectedOrder.sellerName} />
                <InfoLine label="Phone" value={selectedOrder.sellerPhone} />
                <InfoLine label="Store" value={selectedOrder.sellerStore} />
              </InfoCard>
            </div>

            {/* product */}
            <InfoCard title="Product">
              <div className="flex items-center gap-3">
                <img src={selectedOrder.productImage} alt="" className="w-14 h-14 rounded-xl object-cover bg-secondary" />
                <p className="text-sm font-medium text-foreground">{selectedOrder.productName}</p>
              </div>
              {selectedOrder.marketer && <InfoLine label="Marketer" value={selectedOrder.marketer} />}
            </InfoCard>

            {/* shipping */}
            <InfoCard title="Shipping Address">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedOrder.shippingAddress.line1}{selectedOrder.shippingAddress.line2 ? `, ${selectedOrder.shippingAddress.line2}` : ""}<br />
                {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
              </p>
            </InfoCard>

            {/* payment */}
            <InfoCard title="Payment Breakdown">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Subtotal</span><span className="font-medium text-foreground text-right">{formatCurrency(selectedOrder.subtotal)}</span>
                <span className="text-muted-foreground">Shipping</span><span className="font-medium text-foreground text-right">{selectedOrder.shipping === 0 ? "FREE" : formatCurrency(selectedOrder.shipping)}</span>
                <span className="text-muted-foreground">Coupon Discount</span><span className="font-medium text-green-600 text-right">-{formatCurrency(selectedOrder.couponDiscount)}</span>
                <span className="font-semibold text-foreground border-t border-border/40 pt-1">Total</span><span className="font-bold text-foreground text-right border-t border-border/40 pt-1">{formatCurrency(selectedOrder.total)}</span>
              </div>
              <div className="mt-2">
                <StatusBadge {...PAYMENT_STATUS_META[selectedOrder.paymentStatus]} />
              </div>
            </InfoCard>

            {/* actions */}
            <InfoCard title="Update Order">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Order Status</label>
                  <select value={editOrderStatus} onChange={(e) => setEditOrderStatus(e.target.value as OrderStatus)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tracking ID</label>
                  <input value={editTrackingId} onChange={(e) => setEditTrackingId(e.target.value)} placeholder="e.g. DTDC-123456" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Courier Name</label>
                  <input value={editCourier} onChange={(e) => setEditCourier(e.target.value)} placeholder="e.g. Bluedart, DTDC, Delhivery" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Add Internal Note</label>
                  <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} placeholder="Internal note (not visible to customer)" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none" />
                </div>
              </div>
            </InfoCard>

            {/* existing notes */}
            {selectedOrder.internalNotes.length > 0 && (
              <InfoCard title="Internal Notes">
                <div className="space-y-2">
                  {selectedOrder.internalNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <StickyNote size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {/* buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={saveOrderChanges} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
              <button type="button" onClick={markOrderResolved} className="rounded-full border border-green-200 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors">
                Mark Resolved
              </button>
              <ConfirmDelete
                onConfirm={() => {
                  setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? { ...o, orderStatus: "cancelled" as OrderStatus } : o)));
                  setSelectedOrder(null);
                  toast("Order cancelled");
                }}
                title="Cancel this order?"
                description="The order will be marked as cancelled. This action may trigger a refund workflow."
                confirmLabel="Cancel Order"
              >
                <button type="button" className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  Cancel Order
                </button>
              </ConfirmDelete>
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Ticket Detail Drawer ──────────────────────────── */}
      <Drawer open={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={`Ticket ${selectedTicket?.id || ""}`} wide>
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge {...TICKET_STATUS_META[selectedTicket.status]} />
              <span className="text-[11px] text-muted-foreground capitalize border border-border/60 rounded-full px-2 py-0.5">{selectedTicket.issueType.replace("_", " ")}</span>
              {selectedTicket.relatedOrderId && <span className="text-[11px] text-muted-foreground">Order: {selectedTicket.relatedOrderId}</span>}
            </div>

            <InfoCard title="Customer">
              <InfoLine label="Name" value={selectedTicket.customerName} />
              <InfoLine label="Email" value={selectedTicket.customerEmail} />
            </InfoCard>

            {/* chat */}
            <div className="rounded-xl border border-border/50 bg-[#faf8f5] dark:bg-secondary/20 p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Conversation</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedTicket.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.from === "support" ? "justify-end" : ""}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.from === "support" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border/50 text-foreground rounded-bl-md"}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.from === "support" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatDateTime(msg.at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* reply box */}
              {selectedTicket.status !== "closed" && (
                <div className="flex items-end gap-2 mt-4">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} placeholder="Type your reply…" className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none" />
                  <button type="button" onClick={sendReply} disabled={!replyText.trim()} className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* internal notes */}
            <InfoCard title="Internal Notes">
              {selectedTicket.internalNotes.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {selectedTicket.internalNotes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <StickyNote size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{n}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">No internal notes yet.</p>
              )}
              <div className="flex items-end gap-2">
                <input value={ticketNote} onChange={(e) => setTicketNote(e.target.value)} placeholder="Add internal note…" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <button type="button" onClick={addTicketNote} disabled={!ticketNote.trim()} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-secondary transition-colors">
                  Add
                </button>
              </div>
            </InfoCard>

            {selectedTicket.status !== "closed" && (
              <button type="button" onClick={closeTicket} className="rounded-full border border-green-200 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors">
                Close Ticket
              </button>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Add Seller Modal ──────────────────────────────── */}
      <Modal open={addSellerOpen} onClose={() => setAddSellerOpen(false)} title="Add New Seller">
        <form onSubmit={handleAddSeller} className="space-y-3">
          <input value={sellerForm.name} onChange={(e) => setSellerForm((p) => ({ ...p, name: e.target.value }))} placeholder="Seller Name *" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input value={sellerForm.email} onChange={(e) => setSellerForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email *" type="email" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input value={sellerForm.phone} onChange={(e) => setSellerForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone *" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input value={sellerForm.storeName} onChange={(e) => setSellerForm((p) => ({ ...p, storeName: e.target.value }))} placeholder="Store Name *" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddSellerOpen(false)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Add Seller</button>
          </div>
        </form>
      </Modal>

      {/* ── Add Marketer Modal ────────────────────────────── */}
      <Modal open={addMarketerOpen} onClose={() => setAddMarketerOpen(false)} title="Add New Marketer">
        <form onSubmit={handleAddMarketer} className="space-y-3">
          <input value={marketerForm.name} onChange={(e) => setMarketerForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name *" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input value={marketerForm.email} onChange={(e) => setMarketerForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email *" type="email" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input value={marketerForm.phone} onChange={(e) => setMarketerForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone *" required className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <input value={marketerForm.commissionRate} onChange={(e) => setMarketerForm((p) => ({ ...p, commissionRate: e.target.value }))} placeholder="Commission %" type="number" min="1" max="100" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddMarketerOpen(false)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Add Marketer</button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Marketer Commission ──────────────────────── */}
      <Modal open={!!editMarketer} onClose={() => setEditMarketer(null)} title="Edit Commission">
        {editMarketer && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Editing commission for <span className="font-semibold text-foreground">{editMarketer.name}</span></p>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Commission Rate (%)</label>
              <input type="number" min="1" max="100" value={editMarketer.commissionRate} onChange={(e) => setEditMarketer({ ...editMarketer, commissionRate: Number(e.target.value) || 0 })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditMarketer(null)} className="rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition-colors">Cancel</button>
              <button type="button" onClick={saveMarketerCommission} className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">Save</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ── tiny sub-components ──────────────────────────────────── */

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[#faf8f5] dark:bg-secondary/20 p-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default SupportDashboard;
