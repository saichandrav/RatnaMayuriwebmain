import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { api, type Order } from "@/lib/api";
import { resolveProductImages } from "@/lib/product-images";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  BoxIcon,
  XCircle,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";

/* ── Helpers ────────────────────────────────────────────────── */

const fmt = (v: string) =>
  new Date(v).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const fmtTime = (v: string) =>
  new Date(v).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type StatusKey = Order["status"];

const STATUS_META: Record<StatusKey, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  payment_pending: { label: "Awaiting Payment", color: "text-amber-700",   bg: "bg-amber-50",   icon: Clock },
  confirmed:       { label: "Confirmed",        color: "text-blue-700",    bg: "bg-blue-50",    icon: CheckCircle2 },
  packed:          { label: "Packed",            color: "text-indigo-700",  bg: "bg-indigo-50",  icon: BoxIcon },
  shipped:         { label: "Shipped",           color: "text-purple-700",  bg: "bg-purple-50",  icon: Truck },
  delivered:       { label: "Delivered",         color: "text-green-700",   bg: "bg-green-50",   icon: CheckCircle2 },
  cancelled:       { label: "Cancelled",         color: "text-red-700",     bg: "bg-red-50",     icon: XCircle },
};

const TRACK_STEPS: { key: StatusKey; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "packed",    label: "Packed" },
  { key: "shipped",   label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const resolveItemImage = (image?: string): string | undefined => {
  if (!image) return undefined;
  return resolveProductImages([image])[0];
};

/* ── Tracking Bar (reuse same minimal style) ─────────────────── */

const TrackingBar = ({ status }: { status: StatusKey }) => {
  if (status === "cancelled" || status === "payment_pending") return null;
  const currentIdx = TRACK_STEPS.findIndex((s) => s.key === status);
  if (currentIdx === -1) return null;

  return (
    <div className="w-full mt-4">
      <div className="flex items-center w-full">
        {TRACK_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div
                className={`shrink-0 rounded-full transition-all duration-300 ${
                  done
                    ? `bg-green-500 ${active ? "w-3 h-3 ring-4 ring-green-500/20" : "w-2.5 h-2.5"}`
                    : "w-2.5 h-2.5 bg-gray-200"
                }`}
              />
              {i < TRACK_STEPS.length - 1 && (
                <div className="flex-1 h-[2px] mx-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 rounded-full"
                    style={{ width: i < currentIdx ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex w-full mt-1.5">
        {TRACK_STEPS.map((step, i) => (
          <div
            key={step.key + "-l"}
            className="flex-1 last:flex-none"
            style={{ textAlign: i === 0 ? "left" : i === TRACK_STEPS.length - 1 ? "right" : "center" }}
          >
            <span className={`text-[10px] font-medium ${i <= currentIdx ? "text-green-600" : "text-gray-400"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Page ────────────────────────────────────────────────────── */

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.getOrder(id!),
    enabled: !!id,
  });

  const order: Order | undefined = data?.order;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 pb-28 lg:pb-12">
        {/* Back link */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20 text-red-500">Failed to load order details.</div>
        )}

        {order && (() => {
          const meta = STATUS_META[order.status] || STATUS_META.confirmed;
          const StatusIcon = meta.icon;
          const addr = order.shippingAddress;

          return (
            <div className="space-y-6">
              {/* ── Header ── */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">Placed on {fmt(order.createdAt)}</p>
                </div>
                <Link
                  to={`/orders/${order.id}/invoice`}
                  className="inline-flex items-center gap-1.5 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors self-start"
                >
                  <FileText size={14} />
                  View Invoice
                </Link>
              </div>

              {/* ── Status + Tracking ── */}
              <div className="border border-gray-200 rounded-xl bg-white p-5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                    <StatusIcon size={18} className={meta.color} />
                  </div>
                  <p className={`font-semibold text-base ${meta.color}`}>{meta.label}</p>
                </div>
                <TrackingBar status={order.status} />

                {/* Timeline */}
                {order.tracking && order.tracking.length > 0 && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity</p>
                    <div className="space-y-3">
                      {[...order.tracking].reverse().map((entry, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                          <div>
                            <p className="text-gray-800 font-medium">{entry.message || entry.status}</p>
                            <p className="text-xs text-gray-400">{fmtTime(entry.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Items ── */}
              <div className="border border-gray-200 rounded-xl bg-white p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Items ({order.items.length})
                </p>
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, idx) => {
                    const img = resolveItemImage(item.image);
                    return (
                      <div key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <Link
                          to={`/product/${item.product}`}
                          className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                        >
                          {img ? (
                            <img src={img} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-gray-300" />
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.product}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-700 line-clamp-2 transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400">₹{item.price.toLocaleString("en-IN")} each</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Summary row ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment summary */}
                <div className="border border-gray-200 rounded-xl bg-white p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Payment Summary
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-800">₹{order.subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="text-gray-800">
                        {order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`}
                      </span>
                    </div>
                    {order.couponDiscount && order.couponDiscount > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Discount{order.couponCode && <span className="text-xs ml-1">({order.couponCode})</span>}
                        </span>
                        <span className="text-green-600">−₹{order.couponDiscount.toLocaleString("en-IN")}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₹{order.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Payment method */}
                  {order.payment && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <CreditCard size={14} />
                      <span className="capitalize">{order.payment.provider || "Online"}</span>
                      {order.payment.status === "paid" && (
                        <span className="ml-auto text-green-600 font-medium">Paid</span>
                      )}
                      {order.payment.status === "failed" && (
                        <span className="ml-auto text-red-500 font-medium">Failed</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipping address */}
                <div className="border border-gray-200 rounded-xl bg-white p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Shipping Address
                  </p>
                  {addr?.line1 ? (
                    <div className="flex gap-2 text-sm text-gray-700">
                      <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        {addr.name && <p className="font-medium text-gray-900">{addr.name}</p>}
                        {addr.phone && <p className="text-xs text-gray-500">{addr.phone}</p>}
                        <p className="mt-1">
                          {[addr.line1, addr.line2, addr.city, addr.state, addr.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {addr.country && <p className="text-xs text-gray-400 mt-0.5">{addr.country}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No address on file</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
};

export default OrderDetail;
