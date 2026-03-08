import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { api, type Order } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { resolveProductImages } from "@/lib/product-images";
import { useCart } from "@/contexts/CartContext";
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  BoxIcon,
  RotateCcw,
  ExternalLink,
  Star,
  FileText,
  MapPin,
} from "lucide-react";
import { useState } from "react";

/* ── Helpers ────────────────────────────────────────────────── */

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

type StatusKey = Order["status"];

const STATUS_META: Record<StatusKey, { label: string; color: string; icon: React.ElementType }> = {
  payment_pending: { label: "Awaiting Payment",  color: "text-amber-600",  icon: Clock },
  confirmed:       { label: "Order Confirmed",    color: "text-blue-600",   icon: CheckCircle2 },
  packed:          { label: "Packed & Ready",      color: "text-indigo-600", icon: BoxIcon },
  shipped:         { label: "Shipped",             color: "text-purple-600", icon: Truck },
  delivered:       { label: "Delivered",           color: "text-green-600",  icon: CheckCircle2 },
  cancelled:       { label: "Cancelled",           color: "text-red-500",    icon: XCircle },
};

const resolveItemImage = (image?: string): string | undefined => {
  if (!image) return undefined;
  return resolveProductImages([image])[0];
};

/* ── Tracking Steps ───────────────────────────────────────────── */

const TRACK_STEPS: { key: StatusKey; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "packed",    label: "Packed" },
  { key: "shipped",   label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const TrackingBar = ({ status }: { status: StatusKey }) => {
  if (status === "cancelled" || status === "payment_pending") return null;

  const currentIdx = TRACK_STEPS.findIndex((s) => s.key === status);
  if (currentIdx === -1) return null;

  return (
    <div className="w-full mt-3">
      {/* Circles + lines */}
      <div className="flex items-center w-full">
        {TRACK_STEPS.map((step, i) => {
          const done    = i <= currentIdx;
          const active  = i === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              {/* Dot */}
              <div
                className={`shrink-0 rounded-full transition-all duration-300
                  ${done
                    ? `bg-green-500 ${active ? "w-3 h-3 ring-4 ring-green-500/20" : "w-2.5 h-2.5"}`
                    : "w-2.5 h-2.5 bg-gray-200"
                  }`}
              />
              {/* Line */}
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

      {/* Labels */}
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

/* ── Cancelled Banner ────────────────────────────────────────── */
const CancelledBanner = () => (
  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
    <XCircle size={16} className="shrink-0" />
    <span className="font-medium">This order was cancelled.</span>
  </div>
);

/* ── Review Modal ─────────────────────────────────────────────── */

const ReviewModal = ({
  itemName,
  onClose,
}: {
  itemName: string;
  onClose: () => void;
}) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // TODO: wire up to backend review API
    setSubmitted(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
            <p className="font-semibold text-lg text-gray-800">Thank you!</p>
            <p className="text-sm text-gray-500 mt-1">Your review has been submitted.</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Write a Review</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-1">{itemName}</p>

            {/* Star rating */}
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      star <= (hovered || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>

            {/* Text area */}
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this product…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 rounded-full py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full py-2.5 text-sm font-semibold text-gray-900 transition-colors"
              >
                Submit Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────── */

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [reviewItem, setReviewItem] = useState<{ name: string; productId: string } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: api.getOrders,
    staleTime: 1000 * 60 * 5,
  });

  const orders: Order[] = data?.orders || [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 pb-28 lg:pb-12">

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Your Orders</h1>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20 text-red-500">
            Failed to load orders.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No orders yet</h2>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              When you place your first order, it will appear here.
            </p>
            <Link
              to="/products"
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-sm font-semibold rounded-full transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Orders list */}
        <div className="space-y-6 sm:space-y-8">
          {orders.map((order) => {
            const statusMeta = STATUS_META[order.status] || STATUS_META.confirmed;
            const StatusIcon = statusMeta.icon;
            const shipTo = order.shippingAddress?.name || user?.name || "—";

            return (
              <div
                key={order.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
              >
                {/* ── Top Summary Bar ── */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3.5 sm:py-4">
                  {/* Desktop row */}
                  <div className="hidden md:flex md:items-center md:justify-between text-sm">
                    <div className="flex flex-wrap gap-6 lg:gap-8">
                      <div>
                        <p className="text-gray-500 uppercase text-[10px] tracking-wider font-medium">
                          Order placed
                        </p>
                        <p className="font-medium text-gray-800 mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase text-[10px] tracking-wider font-medium">
                          Total
                        </p>
                        <p className="font-medium text-gray-800 mt-0.5">
                          ₹{order.total.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase text-[10px] tracking-wider font-medium">
                          Ship to
                        </p>
                        <p className="font-medium text-gray-800 mt-0.5">{shipTo}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-gray-400 text-xs">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <div className="flex gap-3 justify-end mt-1 text-sm">
                        <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline text-xs">
                          View order details
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link to={`/orders/${order.id}/invoice`} className="text-blue-600 hover:underline text-xs">
                          <span className="inline-flex items-center gap-1">
                            <FileText size={12} /> Invoice
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-gray-800">
                          ₹{order.total.toLocaleString("en-IN")}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600 text-xs">{shipTo}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline">Order details</Link>
                      <span className="text-gray-300">|</span>
                      <Link to={`/orders/${order.id}/invoice`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        <FileText size={11} /> Invoice
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ── Order Content ── */}
                <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">

                  {/* Status + Tracking */}
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusIcon size={18} className={statusMeta.color} />
                      <p className={`font-semibold text-base sm:text-lg ${statusMeta.color}`}>
                        {statusMeta.label}
                      </p>
                    </div>
                    <TrackingBar status={order.status} />
                    {order.status === "cancelled" && <CancelledBanner />}
                  </div>

                  {/* Delivery address (if available) */}
                  {order.shippingAddress?.line1 && (
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">
                      <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {[
                          order.shippingAddress.line1,
                          order.shippingAddress.line2,
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  {order.items.map((item, idx) => {
                    const resolvedImage = resolveItemImage(item.image);
                    return (
                      <div
                        key={`${order.id}-${item.product}-${idx}`}
                        className="flex gap-4 sm:gap-6"
                      >
                        {/* Product Image */}
                        <Link
                          to={`/product/${item.product}`}
                          className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
                        >
                          {resolvedImage ? (
                            <img
                              src={resolvedImage}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={24} className="text-gray-300" />
                          )}
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${item.product}`}
                            className="font-medium text-sm sm:text-base text-blue-700 hover:underline hover:text-blue-800 line-clamp-2 transition-colors"
                          >
                            {item.name}
                          </Link>

                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Qty: {item.quantity}
                          </p>

                          <p className="text-xs sm:text-sm text-gray-600 font-medium">
                            ₹{item.price.toLocaleString("en-IN")}
                            {item.quantity > 1 && (
                              <span className="text-gray-400 font-normal ml-1">
                                (₹{(item.price * item.quantity).toLocaleString("en-IN")} total)
                              </span>
                            )}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              onClick={() => navigate(`/product/${item.product}`)}
                              className="inline-flex items-center gap-1.5 border border-gray-200 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <RotateCcw size={12} />
                              Buy it again
                            </button>

                            <Link
                              to={`/product/${item.product}`}
                              className="inline-flex items-center gap-1.5 border border-gray-200 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ExternalLink size={12} />
                              View your item
                            </Link>

                            {order.status === "delivered" && (
                              <button
                                onClick={() => setReviewItem({ name: item.name, productId: item.product })}
                                className="inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-gray-900 transition-colors"
                              >
                                <Star size={12} />
                                Write a review
                              </button>
                            )}

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <ReviewModal
          itemName={reviewItem.name}
          onClose={() => setReviewItem(null)}
        />
      )}
    </Layout>
  );
};

export default Orders;