import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingBag, Plus, MapPin, Phone, Mail, User as UserIcon, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { api, type Order } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/lib/types";
import { toast } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import MultiImageUpload from "@/components/products/MultiImageUpload";
import { resolveProductImages } from "@/lib/product-images";

type Tab = "listings" | "orders";
type OrderCategoryTab = "new" | "shipped" | "other";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-amber-100 text-amber-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  payment_pending: "bg-gray-100 text-gray-500",
  pending: "bg-gray-100 text-gray-500",
  processing: "bg-amber-100 text-amber-700",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const emptyForm = {
  name: "",
  category: "jewellery",
  subCategory: "",
  price: "",
  originalPrice: "",
  description: "",
  stock: "",
  uploadedImages: [] as string[],
};

const SellerDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [activeOrderCategoryTab, setActiveOrderCategoryTab] = useState<OrderCategoryTab>("new");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, Order["status"]>>({});
  const [listingImageIndex, setListingImageIndex] = useState<Record<string, number>>({});
  const editorPanelRef = useRef<HTMLElement | null>(null);

  const moveListingImage = (productId: string, imageCount: number, direction: "prev" | "next") => {
    if (imageCount <= 1) return;

    setListingImageIndex(prev => {
      const current = prev[productId] ?? 0;
      const nextIndex = direction === "next"
        ? (current + 1) % imageCount
        : (current - 1 + imageCount) % imageCount;

      return { ...prev, [productId]: nextIndex };
    });
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["seller-products", user?.id],
    queryFn: () => api.getProducts({ seller: user?.id || "" }),
    enabled: Boolean(user?.id),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => api.getOrders(),
  });

  const orders = ordersData?.orders || [];
  const newOrderStatuses = new Set<Order["status"]>(["confirmed", "packed"]);
  const shippedOrderStatuses = new Set<Order["status"]>(["shipped", "delivered"]);
  const newOrders = orders.filter(order => newOrderStatuses.has(order.status));
  const shippedOrders = orders.filter(order => shippedOrderStatuses.has(order.status));
  const otherOrders = orders.filter(order => !newOrderStatuses.has(order.status) && !shippedOrderStatuses.has(order.status));
  const visibleOrders = activeOrderCategoryTab === "new"
    ? newOrders
    : activeOrderCategoryTab === "shipped"
    ? shippedOrders
    : otherOrders;

  const resetForm = () => {
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Product>) => api.createProduct(payload),
    onSuccess: () => {
      toast("Listing created", { description: "Your product is now live." });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      resetForm();
    },
    onError: error => {
      toast("Create failed", { description: error instanceof Error ? error.message : "Try again" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) => api.updateProduct(id, payload),
    onSuccess: () => {
      toast("Listing updated", { description: "Your changes are saved." });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      resetForm();
    },
    onError: error => {
      toast("Update failed", { description: error instanceof Error ? error.message : "Try again" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      toast("Listing removed", { description: "Product removed from storefront." });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    },
    onError: error => {
      toast("Delete failed", { description: error instanceof Error ? error.message : "Try again" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Order["status"] }) =>
      api.updateOrderStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      setPendingStatuses(prev => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      toast("Order updated", { description: `Status changed to ${variables.status}.` });
    },
    onError: error => {
      toast("Status update failed", { description: error instanceof Error ? error.message : "Try again" });
    },
  });

  const handleEdit = (product: Product) => {
    setIsPreparingEdit(true);
    setActiveTab("listings");

    window.setTimeout(() => {
      setEditing(product);
      setForm({
        name: product.name,
        category: product.category,
        subCategory: product.subCategory,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        description: product.description,
        stock: String(product.stock),
        uploadedImages: product.images.slice(0, 5),
      });
      setIsPreparingEdit(false);
      editorPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
  };

  const payload = useMemo(() => {
    const images = form.uploadedImages.map(url => url.trim()).filter(Boolean).slice(0, 5);

    return {
      name: form.name.trim(),
      category: form.category as Product["category"],
      subCategory: form.subCategory.trim(),
      price: Number(form.price || 0),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      description: form.description.trim(),
      stock: Number(form.stock || 0),
      images,
    };
  }, [form]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!payload.name || !payload.subCategory || !payload.description) {
      toast("Missing details", { description: "Fill all required fields." });
      return;
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleStatusSelection = (orderId: string, status: Order["status"]) => {
    setPendingStatuses(prev => ({ ...prev, [orderId]: status }));
  };

  const handleStatusUpdate = (orderId: string, currentStatus: Order["status"]) => {
    const nextStatus = pendingStatuses[orderId];
    if (!nextStatus || nextStatus === currentStatus) {
      return;
    }
    statusMutation.mutate({ id: orderId, status: nextStatus });
  };

  const renderOrderCard = (order: Order, variant: "new" | "shipped" | "other") => {
    const customer = typeof order.user === "object" ? order.user : null;
    const addr = (order as any).shippingAddress;
    const isExpanded = expandedOrder === order.id;
    const statusCls = STATUS_COLORS[order.status] || "bg-gray-100 text-gray-500";
    const selectedStatus = pendingStatuses[order.id] ?? order.status;
    const hasStatusChanged = selectedStatus !== order.status;
    const accentCls = variant === "new"
      ? "border-l-4 border-l-blue-500"
      : variant === "shipped"
      ? "border-l-4 border-l-purple-500"
      : "border-l-4 border-l-muted";

    return (
      <motion.div
        key={order.id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border/50 rounded-2xl overflow-hidden ${accentCls}`}
      >
        <button
          type="button"
          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
          className="w-full text-left p-3.5 sm:p-5 flex items-start sm:items-center gap-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Package size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">#{order.id.slice(-6)}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusCls}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 mt-1">
              {customer && <span className="text-xs text-muted-foreground">{customer.name}</span>}
              <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
              <span className="text-xs font-semibold text-foreground w-full sm:w-auto">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-border/40 pt-4">
                {customer && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</p>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                        <UserIcon size={13} className="text-primary shrink-0" />
                        {customer.name}
                      </span>
                      {customer.phone && (
                        <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors">
                          <Phone size={13} className="text-primary shrink-0" />
                          {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors truncate">
                          <Mail size={13} className="text-primary shrink-0" />
                          {customer.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {addr && addr.line1 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Address</p>
                    <div className="flex w-full items-start gap-2 bg-secondary/60 rounded-lg p-3">
                      <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                      <div className="text-sm text-foreground leading-relaxed">
                        {addr.name && <p className="font-medium">{addr.name}</p>}
                        {addr.phone && <p className="text-xs text-muted-foreground">{addr.phone}</p>}
                        <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                        <p>{addr.city}, {addr.state} – {addr.postalCode}</p>
                        {addr.country && <p className="text-xs text-muted-foreground">{addr.country}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items</p>
                  <div className="divide-y divide-border/40">
                    {order.items.map(item => {
                      const resolvedImage = item.image ? resolveProductImages([item.image])[0] : "";
                      return (
                      <div key={`${order.id}-${item.product}`} className="flex items-start sm:items-center gap-3 py-2.5 text-sm">
                        {resolvedImage && (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                            <img src={resolvedImage} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                        </div>
                        <span className="font-semibold text-foreground shrink-0 ml-auto text-xs sm:text-sm">
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div>
                    <p className="text-xs text-muted-foreground">Order Total</p>
                    <p className="text-lg font-bold text-foreground">₹{order.total.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs text-muted-foreground font-medium">Update status</label>
                    <select
                      value={selectedStatus}
                      onChange={event => handleStatusSelection(order.id, event.target.value as Order["status"])}
                      className="w-full sm:w-auto rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {hasStatusChanged && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(order.id, order.status)}
                        disabled={statusMutation.isPending}
                        className="w-full sm:w-auto rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
                      >
                        {statusMutation.isPending ? "Updating..." : "Update"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-12">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seller Studio</p>
          <h1 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-foreground">Welcome, {user?.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage listings and track orders in real time.</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl w-full sm:w-fit mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "listings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag size={16} />
            <span>Listings</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === "listings" ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"
            }`}>{products.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "orders"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={16} />
            <span>Orders</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === "orders" ? "bg-primary/10 text-primary" : "bg-muted-foreground/10"
            }`}>{orders.length}</span>
          </button>
        </div>

        {/* ───────── LISTINGS TAB ───────── */}
        {activeTab === "listings" && (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
            <aside ref={editorPanelRef} className="bg-card rounded-2xl border border-border/60 p-6 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  {editing ? "Edit listing" : "New listing"}
                </h2>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product name</label>
                  <input
                    value={form.name}
                    onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm"
                    placeholder="Royal Heritage Necklace"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                    <select
                      value={form.category}
                      onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="jewellery">Jewellery</option>
                      <option value="saree">Saree</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sub category</label>
                    <input
                      value={form.subCategory}
                      onChange={event => setForm(prev => ({ ...prev, subCategory: event.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                      placeholder="Bridal"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</label>
                    <input
                      value={form.price}
                      onChange={event => setForm(prev => ({ ...prev, price: event.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                      placeholder="4999"
                      type="number"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original</label>
                    <input
                      value={form.originalPrice}
                      onChange={event => setForm(prev => ({ ...prev, originalPrice: event.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                      placeholder="5999"
                      type="number"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                  <textarea
                    value={form.description}
                    onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm min-h-[120px]"
                    placeholder="Describe the craftsmanship, materials, and occasion."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock</label>
                    <input
                      value={form.stock}
                      onChange={event => setForm(prev => ({ ...prev, stock: event.target.value }))}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                      type="number"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product photos (optional)</label>
                    <MultiImageUpload
                      value={form.uploadedImages}
                      onChange={images => setForm(prev => ({ ...prev, uploadedImages: images.slice(0, 5) }))}
                      maxImages={5}
                    />
                    <p className="text-[11px] text-muted-foreground">Drag and drop photos or click to browse · Maximum 5 images</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full luxury-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editing ? "Update listing" : "Publish listing"}
                </button>
              </form>
            </aside>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-semibold text-foreground">Your listings</h2>
                <span className="text-xs text-muted-foreground">{products.length} active</span>
              </div>

              {isLoading ? (
                <div className="py-12 text-sm text-muted-foreground">Loading listings...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="bg-card rounded-2xl border border-border/60 p-4">
                      {(() => {
                        const resolvedImages = resolveProductImages(product.images || []);
                        const safeImages = resolvedImages.length ? resolvedImages : ["/placeholder.svg"];
                        const activeIndex = (listingImageIndex[product.id] ?? 0) % safeImages.length;

                        return (
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary mb-3">
                            <img
                              src={safeImages[activeIndex]}
                              alt={`${product.name} image ${activeIndex + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {safeImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => moveListingImage(product.id, safeImages.length, "prev")}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/65 transition-colors"
                                  aria-label={`Previous image for ${product.name}`}
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveListingImage(product.id, safeImages.length, "next")}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/65 transition-colors"
                                  aria-label={`Next image for ${product.name}`}
                                >
                                  <ChevronRight size={16} />
                                </button>
                                <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
                                  {activeIndex + 1}/{safeImages.length}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                      <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {product.category} · {product.subCategory}
                      </p>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="font-semibold">₹{product.price.toLocaleString("en-IN")}</span>
                        <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          disabled={isPreparingEdit}
                          className="flex-1 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary"
                        >
                          Edit
                        </button>
                        <ConfirmDelete
                          onConfirm={() => deleteMutation.mutate(product.id)}
                          title="Delete this product?"
                          description="This product will be permanently removed from your storefront."
                        >
                          <button
                            type="button"
                            className="flex-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-destructive hover:border-destructive"
                          >
                            Delete
                          </button>
                        </ConfirmDelete>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ───────── ORDERS TAB ───────── */}
        {activeTab === "orders" && (
          <div className="max-w-4xl">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total", count: orders.length, color: "bg-primary/10 text-primary" },
                { label: "Confirmed", count: orders.filter(o => o.status === "confirmed").length, color: "bg-blue-50 text-blue-600" },
                { label: "Shipped", count: orders.filter(o => o.status === "shipped").length, color: "bg-purple-50 text-purple-600" },
                { label: "Delivered", count: orders.filter(o => o.status === "delivered").length, color: "bg-green-50 text-green-600" },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border/50 rounded-xl p-3 sm:p-4 text-center">
                  <p className={`text-xl sm:text-2xl font-bold ${s.color.split(" ")[1]}`}>{s.count}</p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {orders.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-2xl p-10 text-center">
                <Package size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No orders yet. Orders will appear here once customers purchase your products.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:flex gap-1.5 p-1 bg-muted rounded-xl w-full sm:w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveOrderCategoryTab("new")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition-colors ${
                      activeOrderCategoryTab === "new" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    New Orders ({newOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveOrderCategoryTab("shipped")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition-colors ${
                      activeOrderCategoryTab === "shipped" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Shipped Orders ({shippedOrders.length})
                  </button>
                  {otherOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveOrderCategoryTab("other")}
                      className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-xs font-semibold text-center transition-colors ${
                        activeOrderCategoryTab === "other" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Other ({otherOrders.length})
                    </button>
                  )}
                </div>

                {visibleOrders.length === 0 ? (
                  <div className="border border-border/50 rounded-xl p-4 text-xs text-muted-foreground bg-card">
                    {activeOrderCategoryTab === "new"
                      ? "No new orders right now."
                      : activeOrderCategoryTab === "shipped"
                      ? "No shipped orders yet."
                      : "No other orders found."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleOrders.map(order =>
                      renderOrderCard(order, activeOrderCategoryTab === "new" ? "new" : activeOrderCategoryTab === "shipped" ? "shipped" : "other")
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isPreparingEdit && (
          <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[1px] flex items-center justify-center px-4">
            <div className="bg-card border border-border rounded-xl px-5 py-4 shadow-lg flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Opening editor…</p>
                <p className="text-xs text-muted-foreground">Preparing product details</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellerDashboard;
