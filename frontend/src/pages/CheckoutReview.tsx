import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MapPin, Package, Check, Shield, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import type { CheckoutItem, ShippingAddress } from '@/lib/types';

/* ── Step indicator ───────────────────────────────────────────── */
const STEPS = ['Delivery', 'Review', 'Payment'] as const;
const CheckoutSteps = ({ current, onStepClick }: { current: 0 | 1 | 2; onStepClick?: (stepIndex: 0 | 1 | 2) => void }) => (
  <div className="flex items-center justify-center gap-1.5 sm:gap-4 mb-5 sm:mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onStepClick?.(i as 0 | 1 | 2)}
            disabled={!onStepClick || i === current}
            className={`inline-flex items-center gap-1 sm:gap-2 ${!onStepClick || i === current ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-colors ${
                i < current
                  ? 'bg-green-500 text-white'
                  : i === current
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < current ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : i + 1}
            </div>
            <span
              className={`text-[11px] sm:text-sm font-medium ${
                i <= current ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {step}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="w-4 sm:w-10 h-px bg-border mx-0.5 sm:mx-1" />
          )}
        </div>
      ))}
    </div>
);

const CheckoutReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutItem: CheckoutItem | undefined = location.state?.checkoutItem;
  const shippingAddress: ShippingAddress | undefined = location.state?.shippingAddress;

  if (!checkoutItem || !shippingAddress) {
    navigate('/products', { replace: true });
    return null;
  }

  const { product, quantity } = checkoutItem;
  const itemTotal = product.price * quantity;
  const shipping = itemTotal >= 5000 ? 0 : 20;
  const grandTotal = itemTotal + shipping;

  const handleStepClick = (stepIndex: 0 | 1 | 2) => {
    if (stepIndex === 0) {
      navigate('/checkout/delivery', { state: { checkoutItem, shippingAddress } });
      return;
    }
    if (stepIndex === 2) {
      navigate('/checkout/payment', { state: { checkoutItem, shippingAddress } });
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-28 lg:pb-12 max-w-5xl">
        <CheckoutSteps current={1} onStepClick={handleStepClick} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── Main Panel ── */}
          <div className="lg:col-span-2 space-y-5">
            <h1 className="text-2xl font-heading font-bold text-foreground">Review</h1>
            <p className="text-sm text-muted-foreground">Confirm your address and order details before payment.</p>

            {/* Delivery Address */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={15} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Delivering to</p>
                    <p className="text-sm font-semibold text-foreground">{shippingAddress.fullName}</p>
                    <p className="text-xs text-muted-foreground">{shippingAddress.phone}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {shippingAddress.line1}{shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''},{' '}
                      {shippingAddress.city}, {shippingAddress.state} – {shippingAddress.postalCode},{' '}
                      {shippingAddress.country}
                    </p>
                  </div>
                </div>
                <Link
                  to="/checkout/delivery"
                  state={{ checkoutItem }}
                  className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                >
                  <Pencil size={12} /> Change
                </Link>
              </div>
            </motion.div>

            {/* Product Item */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-card border border-border/50 rounded-xl p-5"
            >
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4">Item</p>
              <div className="flex gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-secondary shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground">{product.seller.name}</p>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 mt-0.5">{product.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    {discount > 0 && (
                      <span className="text-xs font-medium text-green-600">{discount}% off</span>
                    )}
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">Qty: {quantity}</span>
                    <span className="text-base font-bold text-foreground">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Price Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="bg-card border border-border/50 rounded-xl p-5"
            >
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4">Price Details</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span>₹{itemTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Charges</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <p className="text-[11px] text-green-600 font-medium">
                    You save ₹{((product.originalPrice! - product.price) * quantity).toLocaleString('en-IN')} on this order!
                  </p>
                )}
              </div>
            </motion.div>

            <button
              type="button"
              onClick={() => navigate('/checkout/payment', { state: { checkoutItem, shippingAddress } })}
              className="w-full sm:w-auto px-8 py-3.5 luxury-gradient text-primary-foreground font-semibold rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-[0.97]"
            >
              Continue to Payment
            </button>
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-card border border-border/50 rounded-xl p-5">
              <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Order Summary
              </h3>
              <div className="flex gap-3 mb-5">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{product.seller.name}</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2 mt-0.5">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Qty: {quantity}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{itemTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4">
                <Shield size={13} className="text-primary" />
                <span className="text-[11px] text-muted-foreground">Safe & Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutReview;
