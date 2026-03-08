import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { api, type Order } from "@/lib/api";
import { resolveProductImages } from "@/lib/product-images";
import { ArrowLeft, Printer, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ── Helpers ────────────────────────────────────────────────── */

const fmt = (v: string) =>
  new Date(v).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const resolveItemImage = (image?: string): string | undefined => {
  if (!image) return undefined;
  return resolveProductImages([image])[0];
};

/* ── Page ────────────────────────────────────────────────────── */

const OrderInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.getOrder(id!),
    enabled: !!id,
  });

  const order: Order | undefined = data?.order;

  const handlePrint = () => window.print();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 pb-28 lg:pb-12">
        {/* Nav bar (hidden on print) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            to={`/orders/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Order
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20 text-red-500">Failed to load invoice.</div>
        )}

        {order && (() => {
          const addr = order.shippingAddress;
          const buyerName = addr?.name || (typeof order.user === "object" ? order.user?.name : undefined) || user?.name || "—";
          const buyerPhone = addr?.phone || (typeof order.user === "object" ? order.user?.phone : undefined) || "";

          return (
            <div className="border border-gray-200 rounded-xl bg-white print:border-none print:shadow-none">
              {/* ── Invoice Header ── */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">INVOICE</h1>
                    <p className="text-xs text-gray-400 mt-0.5">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-sm text-right sm:text-right">
                    <p className="text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-800">{fmt(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* ── Addresses ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 sm:px-8 py-5">
                {/* Sold by */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Sold by
                  </p>
                  <p className="text-sm font-medium text-gray-800">Saichandra Store</p>
                  <p className="text-xs text-gray-500 mt-0.5">India</p>
                </div>

                {/* Bill to */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Bill to
                  </p>
                  <p className="text-sm font-medium text-gray-800">{buyerName}</p>
                  {buyerPhone && <p className="text-xs text-gray-500">{buyerPhone}</p>}
                  {addr?.line1 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[addr.line1, addr.line2, addr.city, addr.state, addr.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Items Table ── */}
              <div className="px-6 sm:px-8 pb-1">
                {/* Header */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => {
                    const img = resolveItemImage(item.image);
                    const lineTotal = item.price * item.quantity;

                    return (
                      <div key={idx} className="py-3 sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
                        {/* Name + image */}
                        <div className="col-span-6 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                            {img ? (
                              <img src={img} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={14} className="text-gray-300" />
                            )}
                          </div>
                          <span className="text-sm text-gray-800 line-clamp-1">{item.name}</span>
                        </div>

                        {/* Mobile row */}
                        <div className="sm:hidden flex justify-between mt-1 text-xs text-gray-500">
                          <span>₹{item.price.toLocaleString("en-IN")} × {item.quantity}</span>
                          <span className="font-medium text-gray-800">₹{lineTotal.toLocaleString("en-IN")}</span>
                        </div>

                        {/* Desktop columns */}
                        <div className="hidden sm:block col-span-2 text-sm text-gray-600 text-right">
                          ₹{item.price.toLocaleString("en-IN")}
                        </div>
                        <div className="hidden sm:block col-span-2 text-sm text-gray-600 text-center">
                          {item.quantity}
                        </div>
                        <div className="hidden sm:block col-span-2 text-sm font-medium text-gray-900 text-right">
                          ₹{lineTotal.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Totals ── */}
              <div className="px-6 sm:px-8 py-5 border-t border-gray-100">
                <div className="max-w-xs ml-auto space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`}</span>
                  </div>
                  {order.couponDiscount && order.couponDiscount > 0 ? (
                    <div className="flex justify-between text-green-600">
                      <span>Discount{order.couponCode && ` (${order.couponCode})`}</span>
                      <span>−₹{order.couponDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total</span>
                    <span>₹{order.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="px-6 sm:px-8 py-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Payment via{" "}
                  <span className="capitalize">{order.payment?.provider || "Online"}</span>
                  {order.payment?.status === "paid" && " — Paid"}
                </p>
                <p className="text-[10px] text-gray-300 mt-1">Thank you for your purchase!</p>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
};

export default OrderInvoice;
