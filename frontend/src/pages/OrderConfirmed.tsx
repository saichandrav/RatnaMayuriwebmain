import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, FileText, ArrowRight, MapPin, CreditCard, CalendarClock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import type { Order } from '@/lib/api';
import { resolveProductImages } from '@/lib/product-images';

const fmt = (v: string) =>
  new Date(v).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const resolveItemImage = (image?: string): string | undefined => {
  if (!image) return undefined;
  return resolveProductImages([image])[0];
};

const OrderConfirmed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order: Order | undefined = location.state?.order;

  if (!order) {
    navigate('/orders', { replace: true });
    return null;
  }

  const addr = order.shippingAddress;

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-start px-4 py-6 sm:py-10 pb-28 lg:pb-12">
        {/* ── Success Hero ── */}
        <motion.div
          className="flex flex-col items-center text-center max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Animated checkmark circle */}
          <motion.div
            className="relative mb-5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 250, damping: 12 }}
              >
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" strokeWidth={2} />
              </motion.div>
            </div>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-green-400"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>

          <motion.h1
            className="text-2xl sm:text-3xl font-heading font-bold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            Order Confirmed!
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base text-muted-foreground mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
          >
            Thank you for your purchase. Your order has been placed successfully.
          </motion.p>

          {/* Order ID badge */}
          <motion.div
            className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
          >
            <Package className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              Order #{order.id.slice(-8).toUpperCase()}
            </span>
          </motion.div>
        </motion.div>

        {/* ── Invoice Card ── */}
        <motion.div
          className="w-full max-w-lg mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Green header strip */}
            <div className="bg-green-600 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Order Summary</span>
              <span className="text-xs text-green-100">{fmt(order.createdAt)}</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-border">
              {order.items.map((item, idx) => {
                const img = resolveItemImage(item.image);
                const lineTotal = item.price * item.quantity;
                return (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {img ? (
                        <img src={img} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground shrink-0">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 bg-muted/30 border-t border-border space-y-1.5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping.toLocaleString('en-IN')}`}</span>
              </div>
              {order.couponDiscount && order.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>−₹{order.couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2 mt-2">
                <span>Total Paid</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Expected Delivery */}
            <div className="px-5 py-4 border-t border-border">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CalendarClock className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Expected Delivery</p>
                  <p className="text-sm font-bold text-green-800 mt-0.5">
                    {(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 10);
                      return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery & Payment Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-4 border-t border-border">
              {addr && (
                <div className="flex gap-2.5">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivering to</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{addr.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[addr.line1, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              {order.payment && (
                <div className="flex gap-2.5">
                  <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{order.payment.provider || 'Razorpay'}</p>
                    <p className="text-xs text-green-600 font-medium mt-0.5">Paid ✓</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div
          className="w-full max-w-lg mt-6 flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.35 }}
        >
          <Link
            to={`/orders/${order.id}/invoice`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4" />
            View Invoice
          </Link>
          <Link
            to={`/orders/${order.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-3 text-sm font-medium text-white transition-colors"
          >
            Track Order
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* ── Continue Shopping ── */}
        <motion.div
          className="mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.3 }}
        >
          <Link
            to="/products"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderConfirmed;
