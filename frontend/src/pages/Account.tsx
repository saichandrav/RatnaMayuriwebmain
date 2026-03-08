import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  Award,
  ShoppingBag,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Shield,
  Lock,
  LogOut,
  Camera,
  X,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  BoxIcon,
  CalendarDays,
  Store,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Order, type AuthUser } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { resolveProductImages } from "@/lib/product-images";

/* ── helpers ────────────────────────────────────────────────── */

const formatCurrency = (v: number) => `₹${v.toLocaleString("en-IN")}`;

const formatDate = (v: string) =>
  new Date(v).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });

const STATUS_META: Record<
  Order["status"],
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  payment_pending: { label: "Awaiting Payment", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  confirmed: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
  packed: { label: "Packed", color: "text-indigo-600", bg: "bg-indigo-50", icon: BoxIcon },
  shipped: { label: "Shipped", color: "text-purple-600", bg: "bg-purple-50", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", icon: XCircle },
};

const resolveItemImage = (image?: string) => (image ? resolveProductImages([image])[0] : undefined);

const getInitials = (name?: string) =>
  (name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ── address type ───────────────────────────────────────────── */

interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

/* ── sidebar nav items ──────────────────────────────────────── */

type Section = "overview" | "personal" | "addresses" | "security" | "orders";

const NAV_ITEMS: { key: Section; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: UserIcon },
  { key: "personal", label: "Personal Info", icon: Mail },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "orders", label: "Order History", icon: Package },
  { key: "security", label: "Security", icon: Shield },
];

/* ── fade / slide animation ─────────────────────────────────── */

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

/* ═══════════════════════════════════════════════════════════════
   ACCOUNT PAGE
   ═══════════════════════════════════════════════════════════════ */

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── state ───────────────────────────────── */
  const [section, setSection] = useState<Section>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // edit-profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [editSaving, setEditSaving] = useState(false);

  // address form
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  // change password (UI only)
  const [pwdOpen, setPwdOpen] = useState(false);

  /* ── saved addresses (localStorage) ──────── */
  const ADDR_KEY = `ratnamayuri_addresses_${user?.id || "anon"}`;

  const readAddresses = useCallback((): SavedAddress[] => {
    try {
      return JSON.parse(localStorage.getItem(ADDR_KEY) || "[]");
    } catch {
      return [];
    }
  }, [ADDR_KEY]);

  const [addresses, setAddresses] = useState<SavedAddress[]>(() => readAddresses());

  const persistAddresses = useCallback(
    (next: SavedAddress[]) => {
      setAddresses(next);
      localStorage.setItem(ADDR_KEY, JSON.stringify(next));
    },
    [ADDR_KEY],
  );

  /* ── load data ─────────────────────────── */
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const [meRes, ordRes] = await Promise.all([api.getUserProfile(), api.getOrders()]);
        if (!alive) return;
        setProfile(meRes.user);
        setOrders(ordRes.orders);
      } catch {
        /* silently fallback to auth context */
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const displayUser = profile || user;

  /* ── overview stats ────────────────────── */
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    return { totalOrders, delivered, wishlist: 0, rewards: 0 };
  }, [orders]);

  /* ── edit profile ──────────────────────── */
  const openEdit = () => {
    setEditForm({ name: displayUser?.name || "", phone: displayUser?.phone || "" });
    setEditOpen(true);
  };
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await api.updateProfile({ name: editForm.name, phone: editForm.phone });
      setProfile(res.user);
      toast("Profile updated");
      setEditOpen(false);
    } catch (err) {
      toast("Update failed", { description: err instanceof Error ? err.message : "Try again." });
    } finally {
      setEditSaving(false);
    }
  };

  /* ── address helpers ───────────────────── */
  const addAddress = (e: FormEvent) => {
    e.preventDefault();
    const next: SavedAddress = {
      id: crypto.randomUUID(),
      ...addressForm,
      isDefault: addresses.length === 0,
    };
    persistAddresses([...addresses, next]);
    setAddressForm({ label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" });
    setAddressFormOpen(false);
    toast("Address saved");
  };
  const removeAddress = (id: string) => {
    const filtered = addresses.filter((a) => a.id !== id);
    if (filtered.length && !filtered.some((a) => a.isDefault)) filtered[0].isDefault = true;
    persistAddresses(filtered);
    toast("Address removed");
  };
  const setDefault = (id: string) => {
    persistAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    toast("Default address updated");
  };

  /* ── recent orders (last 5) ────────────── */
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  /* ── member since ──────────────────────── */
  const memberSince = displayUser && "createdAt" in displayUser && (displayUser as Record<string, unknown>).createdAt
    ? formatDate((displayUser as Record<string, unknown>).createdAt as string)
    : "—";

  /* ── switch section on nav click ───────── */
  const go = (s: Section) => {
    setSection(s);
    setMobileNavOpen(false);
  };

  /* ── skeleton ──────────────────────────── */
  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-secondary/60 ${className}`} />
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-28 lg:pb-14">

        {/* ─── PROFILE HEADER ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-[#faf6f1] via-card to-[#fdf8f3] dark:from-card dark:via-card dark:to-card overflow-hidden"
        >
          {/* decorative gold line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-300/70 via-yellow-400/80 to-amber-300/70" />

          <div className="px-5 py-7 sm:px-8 sm:py-9 flex flex-col sm:flex-row items-center gap-5 sm:gap-7">
            {/* avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-200/70 flex items-center justify-center text-2xl sm:text-3xl font-heading font-bold text-amber-700 select-none shadow-sm">
                {getInitials(displayUser?.name)}
              </div>
              <button
                type="button"
                onClick={openEdit}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border border-border shadow flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                aria-label="Edit profile picture"
              >
                <Camera size={14} />
              </button>
            </div>

            {/* name / meta */}
            <div className="flex-1 text-center sm:text-left">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-40 mx-auto sm:mx-0 mb-2" />
                  <Skeleton className="h-4 w-56 mx-auto sm:mx-0" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground leading-tight">
                    {displayUser?.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1"><Mail size={13} /> {displayUser?.email}</span>
                    {displayUser?.phone && (
                      <span className="inline-flex items-center gap-1"><Phone size={13} /> {displayUser.phone}</span>
                    )}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground/70 flex items-center justify-center sm:justify-start gap-1">
                    <CalendarDays size={12} /> Member since {memberSince}
                    {displayUser?.role === "seller" && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        <Store size={10} /> Seller
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>

            {/* edit button */}
            <button
              type="button"
              onClick={openEdit}
              className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold tracking-wider text-foreground/80 hover:bg-secondary hover:text-primary transition-colors"
            >
              <Pencil size={13} className="inline -mt-0.5 mr-1.5" />
              Edit Profile
            </button>
          </div>
        </motion.div>

        {/* ─── MAIN GRID ──────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          {/* ── Sidebar ────────────────────────────────────── */}
          {/* mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="lg:hidden flex items-center justify-between w-full rounded-2xl border border-border/50 bg-card px-5 py-3.5 text-sm font-semibold text-foreground"
          >
            {NAV_ITEMS.find((n) => n.key === section)?.label}
            <ChevronRight size={16} className={`transition-transform ${mobileNavOpen ? "rotate-90" : ""}`} />
          </button>

          <aside className={`${mobileNavOpen ? "block" : "hidden"} lg:block`}>
            <nav className="rounded-2xl border border-border/50 bg-card p-2 space-y-0.5 sticky top-28">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => go(key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    section === key
                      ? "bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-800 dark:from-amber-900/20 dark:to-amber-800/10 dark:text-amber-300"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}

              <div className="pt-2 px-2">
                <button
                  type="button"
                  onClick={() => { logout(); navigate("/"); }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            </nav>
          </aside>

          {/* ── Content Area ──────────────────────────────── */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {/* ============ OVERVIEW ============ */}
              {section === "overview" && (
                <motion.div key="overview" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">

                  {/* stat cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Total Orders", value: stats.totalOrders, icon: Package, color: "text-blue-600 bg-blue-50" },
                      { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
                      { label: "Wishlist", value: stats.wishlist, icon: Heart, color: "text-pink-600 bg-pink-50" },
                      { label: "Reward Points", value: stats.rewards, icon: Award, color: "text-amber-600 bg-amber-50" },
                    ].map((card) => (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => card.label.includes("Order") || card.label.includes("Deliver") ? go("orders") : undefined}
                        className="rounded-2xl border border-border/50 bg-card p-5 text-left hover:shadow-md hover:border-border transition-all group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color} mb-3`}>
                          <card.icon size={18} />
                        </div>
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{card.value}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                      </button>
                    ))}
                  </div>

                  {/* quick-info card */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6">
                    <h3 className="text-base font-semibold text-foreground mb-4">Quick Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <InfoRow icon={UserIcon} label="Full Name" value={displayUser?.name} loading={isLoading} />
                      <InfoRow icon={Mail} label="Email" value={displayUser?.email} loading={isLoading} />
                      <InfoRow icon={Phone} label="Phone" value={displayUser?.phone || "—"} loading={isLoading} />
                      <InfoRow icon={MapPin} label="Addresses" value={`${addresses.length} saved`} loading={isLoading} />
                    </div>
                  </div>

                  {/* recent orders preview */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-foreground">Recent Orders</h3>
                      <button type="button" onClick={() => go("orders")} className="text-xs font-semibold text-primary hover:underline">
                        View All
                      </button>
                    </div>
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : recentOrders.length === 0 ? (
                      <EmptyState icon={ShoppingBag} message="No orders yet." sub="Your recent purchases will appear here." />
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <OrderRow key={order.id} order={order} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* seller shortcut */}
                  {displayUser?.role === "seller" && (
                    <Link
                      to="/seller"
                      className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-100/40 p-5 group hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-200/70 flex items-center justify-center text-amber-700">
                          <Store size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Seller Studio</p>
                          <p className="text-xs text-muted-foreground">Manage listings, stock & orders</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  )}
                </motion.div>
              )}

              {/* ============ PERSONAL INFO ============ */}
              {section === "personal" && (
                <motion.div key="personal" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <SectionHeader title="Personal Information" sub="Your account details." action="Edit" onAction={openEdit} />

                  <div className="rounded-2xl border border-border/50 bg-card divide-y divide-border/40">
                    {[
                      { label: "Full Name", value: displayUser?.name, icon: UserIcon },
                      { label: "Email Address", value: displayUser?.email, icon: Mail },
                      { label: "Phone Number", value: displayUser?.phone || "Not provided", icon: Phone },
                      { label: "Role", value: displayUser?.role, icon: Shield, capitalize: true },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-4 px-6 py-4">
                        <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground">
                          <row.icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{row.label}</p>
                          {isLoading ? (
                            <Skeleton className="h-4 w-40 mt-1" />
                          ) : (
                            <p className={`text-sm font-medium text-foreground truncate ${row.capitalize ? "capitalize" : ""}`}>
                              {row.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ============ ADDRESSES ============ */}
              {section === "addresses" && (
                <motion.div key="addresses" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <SectionHeader
                    title="Saved Addresses"
                    sub="Manage your delivery addresses."
                    action="+ Add Address"
                    onAction={() => setAddressFormOpen(true)}
                  />

                  {addressFormOpen && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={addAddress}
                      className="rounded-2xl border border-primary/30 bg-card p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">New Address</h4>
                        <button type="button" onClick={() => setAddressFormOpen(false)} className="text-muted-foreground hover:text-foreground">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={addressForm.label}
                          onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))}
                          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                        >
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                        <input value={addressForm.line1} onChange={(e) => setAddressForm((p) => ({ ...p, line1: e.target.value }))} placeholder="Address Line 1 *" required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <input value={addressForm.line2} onChange={(e) => setAddressForm((p) => ({ ...p, line2: e.target.value }))} placeholder="Address Line 2" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <input value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} placeholder="City *" required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <input value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} placeholder="State *" required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <input value={addressForm.postalCode} onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))} placeholder="Postal Code *" required className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                      </div>
                      <button type="submit" className="rounded-full luxury-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                        Save Address
                      </button>
                    </motion.form>
                  )}

                  {addresses.length === 0 && !addressFormOpen ? (
                    <EmptyState icon={MapPin} message="No saved addresses." sub="Add a delivery address to speed up checkout." />
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center text-muted-foreground shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-foreground">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                              {addr.city}, {addr.state} {addr.postalCode}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!addr.isDefault && (
                              <button type="button" onClick={() => setDefault(addr.id)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                                Set Default
                              </button>
                            )}
                            <ConfirmDelete onConfirm={() => removeAddress(addr.id)} title="Remove address?" description="This address will be permanently deleted.">
                              <button type="button" className="rounded-full border border-destructive/40 p-2 text-destructive hover:bg-destructive/10 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </ConfirmDelete>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ============ ORDERS ============ */}
              {section === "orders" && (
                <motion.div key="orders" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <SectionHeader title="Order History" sub="Browse all your past and ongoing orders." />

                  {isLoading ? (
                    <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                  ) : orders.length === 0 ? (
                    <EmptyState icon={ShoppingBag} message="No orders yet." sub="When you make a purchase it will appear here." />
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <OrderRow key={order.id} order={order} full />
                      ))}
                      <div className="text-center pt-2">
                        <Link to="/orders" className="text-xs font-semibold text-primary hover:underline">
                          View detailed order page →
                        </Link>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ============ SECURITY ============ */}
              {section === "security" && (
                <motion.div key="security" variants={sectionVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <SectionHeader title="Security" sub="Keep your account safe." />

                  {/* change password */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground">
                          <Lock size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Password</p>
                          <p className="text-xs text-muted-foreground">Last changed: Unknown</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPwdOpen(!pwdOpen)}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/80 hover:text-primary hover:border-primary transition-colors"
                      >
                        Change
                      </button>
                    </div>
                    {pwdOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-5 space-y-3 max-w-md">
                        <input type="password" placeholder="Current password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <input type="password" placeholder="New password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <input type="password" placeholder="Confirm new password" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
                        <button type="button" onClick={() => { toast("Password change is not yet implemented on the backend."); setPwdOpen(false); }} className="rounded-full luxury-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                          Update Password
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* 2FA toggle (UI only) */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => toast("Two-factor authentication coming soon.")} className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                      Enable
                    </button>
                  </div>

                  {/* login activity */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Recent Login Activity</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Current session</span>
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground/60">Full login history coming soon.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── EDIT PROFILE MODAL ───────────────────────────── */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setEditOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-heading font-semibold text-foreground">Edit Profile</h3>
                <button type="button" onClick={() => setEditOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={(e) => void saveProfile(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 ..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-foreground/80 hover:bg-secondary transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={editSaving} className="rounded-full luxury-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                    {editSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

/* ── Sub-components ──────────────────────────────────────────── */

function SectionHeader({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-heading font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 sm:mt-0 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, loading }: { icon: React.ElementType; label: string; value?: string; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} className="text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <div className="animate-pulse h-4 w-32 rounded bg-secondary/60 mt-0.5" />
        ) : (
          <p className="text-sm font-medium text-foreground truncate">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message, sub }: { icon: React.ElementType; message: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/20 py-14 px-6 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
        <Icon size={24} />
      </div>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function OrderRow({ order, full = false }: { order: Order; full?: boolean }) {
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;
  const firstItem = order.items[0];
  const img = resolveItemImage(firstItem?.image);

  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 hover:shadow-md hover:border-border transition-all group"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-secondary overflow-hidden shrink-0">
        {img ? (
          <img src={img} alt={firstItem?.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {firstItem?.name || "Order"}{order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">#{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color} ${meta.bg}`}>
            <StatusIcon size={10} /> {meta.label}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-foreground">{formatCurrency(order.total)}</p>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors ml-auto mt-1" />
      </div>
    </Link>
  );
}

export default Account;
