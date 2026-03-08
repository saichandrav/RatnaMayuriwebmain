import { type FormEvent, useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type AdminSummary, type AdminUser, type Order } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

const ORDER_STATUSES: Order["status"][] = ["payment_pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sellers, setSellers] = useState<AdminUser[]>([]);
  const [marketers, setMarketers] = useState<Array<AdminUser & { stats?: { totalCoupons: number; activeCoupons: number; totalOrders: number; totalEarnings: number; pendingPayout: number } }>>([]);

  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<string, Order["status"]>>({});

  const [sellerForm, setSellerForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    phone: "",
  });

  const [marketerForm, setMarketerForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    couponCode: "",
    commissionRate: "5",
  });

  const [supportTeam, setSupportTeam] = useState<AdminUser[]>([]);
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const loadDashboardData = async (refreshOnly = false) => {
    try {
      if (refreshOnly) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [summaryRes, ordersRes, usersRes, sellersRes, marketersRes, supportRes] = await Promise.all([
        api.getAdminSummary(),
        api.getAdminOrders(),
        api.getAdminUsers(),
        api.getAdminSellers(),
        api.getAdminMarketers(),
        api.getAdminSupportTeam(),
      ]);

      setSummary(summaryRes.summary);
      setOrders(ordersRes.orders);
      setUsers(usersRes.users);
      setSellers(sellersRes.sellers);
      setMarketers(marketersRes.marketers);
      setSupportTeam(supportRes.members);
      setOrderStatusDrafts(
        ordersRes.orders.reduce<Record<string, Order["status"]>>((acc, order) => {
          acc[order.id] = order.status;
          return acc;
        }, {})
      );
    } catch (error) {
      toast("Failed to load admin dashboard", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const revenuePerOrder = useMemo(() => {
    if (!summary || summary.totalOrders === 0) {
      return 0;
    }
    return summary.totalRevenue / summary.totalOrders;
  }, [summary]);

  const handleUpdateOrder = async (orderId: string) => {
    const nextStatus = orderStatusDrafts[orderId];
    try {
      await api.updateAdminOrder(orderId, nextStatus);
      setOrders(prev => prev.map(order => (order.id === orderId ? { ...order, status: nextStatus } : order)));
      toast("Order updated", { description: `Status changed to ${nextStatus.replace("_", " ")}.` });
    } catch (error) {
      toast("Order update failed", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.deleteAdminOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast("Order deleted", { description: "Order has been removed." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Order delete failed", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleCreateSeller = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.createAdminSeller({
        name: sellerForm.name,
        email: sellerForm.email,
        password: sellerForm.password,
        storeName: sellerForm.storeName,
        phone: sellerForm.phone,
      });
      setSellerForm({ name: "", email: "", password: "", storeName: "", phone: "" });
      toast("Seller added", { description: "New seller account created." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Failed to add seller", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleDeleteSeller = async (id: string) => {
    try {
      await api.deleteAdminSeller(id);
      toast("Seller removed", { description: "Seller account deleted." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Failed to remove seller", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleCreateMarketer = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.createAdminMarketer({
        name: marketerForm.name,
        email: marketerForm.email,
        password: marketerForm.password,
        phone: marketerForm.phone,
        couponCode: marketerForm.couponCode,
        commissionRate: Number(marketerForm.commissionRate) || 5,
      });
      setMarketerForm({ name: "", email: "", password: "", phone: "", couponCode: "", commissionRate: "5" });
      toast("Marketer added", { description: "New marketer account created." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Failed to add marketer", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleDeleteMarketer = async (id: string) => {
    try {
      await api.deleteAdminMarketer(id);
      toast("Marketer removed", { description: "Marketer account deleted." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Failed to remove marketer", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleCreateSupportMember = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await api.createAdminSupportMember({
        name: supportForm.name,
        email: supportForm.email,
        password: supportForm.password,
        phone: supportForm.phone,
      });
      setSupportForm({ name: "", email: "", password: "", phone: "" });
      toast("Support member added", { description: "New support team member created." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Failed to add support member", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  const handleDeleteSupportMember = async (id: string) => {
    try {
      await api.deleteAdminSupportMember(id);
      toast("Support member removed", { description: "Support team member deleted." });
      void loadDashboardData(true);
    } catch (error) {
      toast("Failed to remove support member", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage orders, users, revenue, marketers, and sellers.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboardData(true)}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">Loading dashboard...</div>
        ) : (
          <Tabs defaultValue="overview" className="mt-6">
            <div className="overflow-x-auto pb-2">
              <TabsList className="w-max min-w-full sm:min-w-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="marketers">Marketers</TabsTrigger>
                <TabsTrigger value="sellers">Sellers</TabsTrigger>
                <TabsTrigger value="support">Support Team</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(summary?.totalRevenue || 0)}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{summary?.totalOrders || 0}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{summary?.totalUsers || 0}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-xs text-muted-foreground">Revenue / Order</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(revenuePerOrder)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card p-5">
                <h3 className="text-base font-semibold text-foreground">Users by Role</h3>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="text-muted-foreground">Admins</p>
                    <p className="font-semibold text-foreground">{summary?.usersByRole?.admin || 0}</p>
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="text-muted-foreground">Sellers</p>
                    <p className="font-semibold text-foreground">{summary?.usersByRole?.seller || 0}</p>
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="text-muted-foreground">Marketers</p>
                    <p className="font-semibold text-foreground">{summary?.usersByRole?.marketer || 0}</p>
                  </div>
                  <div className="rounded-lg bg-secondary px-3 py-2">
                    <p className="text-muted-foreground">Customers</p>
                    <p className="font-semibold text-foreground">{summary?.usersByRole?.customer || 0}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">No orders found.</div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Order #{order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground mt-1">Total: {formatCurrency(order.total)}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={orderStatusDrafts[order.id] || order.status}
                          onChange={event => setOrderStatusDrafts(prev => ({ ...prev, [order.id]: event.target.value as Order["status"] }))}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                        >
                          {ORDER_STATUSES.map(status => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleUpdateOrder(order.id)}
                          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                        >
                          Save
                        </button>
                        <ConfirmDelete
                          onConfirm={() => void handleDeleteOrder(order.id)}
                          title="Delete this order?"
                          description="This order will be permanently removed. This action cannot be undone."
                        >
                          <button
                            type="button"
                            className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Delete
                          </button>
                        </ConfirmDelete>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-3">
              {users.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">No users found.</div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-right">
                      <p className="capitalize">Role: {user.role}</p>
                      {user.phone ? <p>Phone: {user.phone}</p> : null}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="marketers" className="space-y-4">
              <form onSubmit={handleCreateMarketer} className="rounded-xl border border-border/60 bg-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  value={marketerForm.name}
                  onChange={event => setMarketerForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Name"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={marketerForm.email}
                  onChange={event => setMarketerForm(prev => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={marketerForm.password}
                  onChange={event => setMarketerForm(prev => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  type="password"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={marketerForm.phone}
                  onChange={event => setMarketerForm(prev => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={marketerForm.couponCode}
                  onChange={event => setMarketerForm(prev => ({ ...prev, couponCode: event.target.value.toUpperCase() }))}
                  placeholder="Coupon Code"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={marketerForm.commissionRate}
                  onChange={event => setMarketerForm(prev => ({ ...prev, commissionRate: event.target.value }))}
                  placeholder="Commission %"
                  type="number"
                  min="1"
                  max="100"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="sm:col-span-2 lg:col-span-3 rounded-full luxury-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                  Add Marketer
                </button>
              </form>

              {marketers.map(marketer => (
                <div key={marketer.id} className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{marketer.name}</p>
                    <p className="text-xs text-muted-foreground">{marketer.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earnings: {formatCurrency(marketer.stats?.totalEarnings || 0)} · Pending: {formatCurrency(marketer.stats?.pendingPayout || 0)}
                    </p>
                  </div>
                  <ConfirmDelete
                    onConfirm={() => void handleDeleteMarketer(marketer.id)}
                    title="Delete this marketer?"
                    description="This marketer and all associated coupons &amp; commissions will be permanently removed."
                  >
                    <button
                      type="button"
                      className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </ConfirmDelete>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="sellers" className="space-y-4">
              <form onSubmit={handleCreateSeller} className="rounded-xl border border-border/60 bg-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  value={sellerForm.name}
                  onChange={event => setSellerForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Name"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={sellerForm.email}
                  onChange={event => setSellerForm(prev => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={sellerForm.password}
                  onChange={event => setSellerForm(prev => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  type="password"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={sellerForm.storeName}
                  onChange={event => setSellerForm(prev => ({ ...prev, storeName: event.target.value }))}
                  placeholder="Store Name"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={sellerForm.phone}
                  onChange={event => setSellerForm(prev => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="sm:col-span-2 lg:col-span-1 rounded-full luxury-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                  Add Seller
                </button>
              </form>

              {sellers.map(seller => (
                <div key={seller.id} className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{seller.name}</p>
                    <p className="text-xs text-muted-foreground">{seller.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Store: {seller.storeName || "-"}</p>
                  </div>
                  <ConfirmDelete
                    onConfirm={() => void handleDeleteSeller(seller.id)}
                    title="Delete this seller?"
                    description="This seller and all their products will be permanently removed."
                  >
                    <button
                      type="button"
                      className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Delete
                    </button>
                  </ConfirmDelete>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <form onSubmit={handleCreateSupportMember} className="rounded-xl border border-border/60 bg-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  value={supportForm.name}
                  onChange={event => setSupportForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Name"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={supportForm.email}
                  onChange={event => setSupportForm(prev => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={supportForm.password}
                  onChange={event => setSupportForm(prev => ({ ...prev, password: event.target.value }))}
                  placeholder="Password"
                  type="password"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  required
                />
                <input
                  value={supportForm.phone}
                  onChange={event => setSupportForm(prev => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <button type="submit" className="sm:col-span-2 lg:col-span-4 rounded-full luxury-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                  Add Support Member
                </button>
              </form>

              {supportTeam.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">No support team members found.</div>
              ) : (
                supportTeam.map(member => (
                  <div key={member.id} className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      {member.phone && <p className="text-xs text-muted-foreground mt-0.5">Phone: {member.phone}</p>}
                    </div>
                    <ConfirmDelete
                      onConfirm={() => void handleDeleteSupportMember(member.id)}
                      title="Remove this support member?"
                      description="This support team member will be permanently removed and will lose access to the support console."
                    >
                      <button
                        type="button"
                        className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    </ConfirmDelete>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
