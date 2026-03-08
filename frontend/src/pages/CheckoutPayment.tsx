import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Check, Shield, Package, Tag, MapPin, CreditCard, Pencil, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import type { CheckoutItem, ShippingAddress } from '@/lib/types';
import { api } from '@/lib/api';

/* ── Step indicator ───────────────────────────── */
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

/* ── Coupon codes ───────────────────────────── */
const DEMO_COUPONS: Record<string, number> = {
  SAVE10: 10,
  SAVE20: 20,
  LUXURY15: 15,
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  prefill: { name: string; contact: string };
  theme: { color: string };
}

const loadRazorpay = (): Promise<boolean> =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { removeFromCart } = useCart();

  const checkoutItem: CheckoutItem | undefined = location.state?.checkoutItem;
  const shippingAddress: ShippingAddress | undefined = location.state?.shippingAddress;

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const couponInputRef = useRef<HTMLInputElement>(null);

  if (!checkoutItem || !shippingAddress) {
    navigate('/products', { replace: true });
    return null;
  }

  const { product, quantity } = checkoutItem;
  const itemTotal = product.price * quantity;
  const shipping = 0;
  const couponSavings = appliedCoupon
    ? Math.round((itemTotal * appliedCoupon.discount) / 100)
    : 0;
  const grandTotal = itemTotal + shipping - couponSavings;

  const handleStepClick = (stepIndex: 0 | 1 | 2) => {
    if (stepIndex === 0) {
      navigate('/checkout/delivery', { state: { checkoutItem, shippingAddress } });
      return;
    }
    if (stepIndex === 1) {
      navigate('/checkout/review', { state: { checkoutItem, shippingAddress } });
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const discountRate = DEMO_COUPONS[code];
    if (discountRate) {
      setAppliedCoupon({ code, discount: discountRate });
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code.');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      const paymentOrder = await api.createRazorpayOrder(
        [{ productId: product.id, quantity }],
        appliedCoupon?.code,
        shippingAddress as unknown as Record<string, string>
      );

      const loaded = await loadRazorpay();
      if (!loaded) return;

      const options: RazorpayOptions = {
        key: paymentOrder.keyId,
        amount: paymentOrder.razorpayOrder.amount,
        currency: paymentOrder.razorpayOrder.currency,
        name: 'Saichandra',
        description: product.name,
        image: product.images[0],
        order_id: paymentOrder.razorpayOrder.id,
        handler: async response => {
          await api.verifyRazorpayPayment({
            orderId: paymentOrder.order.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          removeFromCart(product.id);
          navigate('/orders', { replace: true });
        },
        prefill: {
          name: shippingAddress.fullName,
          contact: shippingAddress.phone,
        },
        theme: { color: '#7c3aed' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-28 lg:pb-12 max-w-5xl">
        <CheckoutSteps current={2} onStepClick={handleStepClick} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── MAIN COLUMN ──────────────────────── */}
          <motion.div
            className="lg:col-span-2 space-y-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Payment</h1>
              <p className="text-sm text-muted-foreground mt-1">Review details and complete your order securely.</p>
            </div>

            {/* Delivery card */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Delivering to</p>
                    <p className="text-sm text-foreground font-medium mt-0.5 truncate">
                      {shippingAddress.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {shippingAddress.line1}, {shippingAddress.city}
                    </p>
                  </div>
                </div>
                <Link
                  to="/checkout/delivery"
                  state={{ checkoutItem, shippingAddress }}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Change
                </Link>
              </div>
            </div>

            {/* Coupon card */}
            <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Apply Coupon</p>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-accent rounded-lg px-4 py-3">
                  <span className="text-sm font-semibold text-accent-foreground">
                    {appliedCoupon.code} applied
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      ref={couponInputRef}
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Enter coupon code"
                      className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 border border-input rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 sm:px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive mt-2">{couponError}</p>
                  )}

                </div>
              )}
            </div>

            {/* Pay button (mobile: visible here, desktop: hidden) */}
              <div className="lg:hidden">
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3.5 luxury-gradient text-primary-foreground rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay ₹{grandTotal.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* ── SIDEBAR ──────────────────────────── */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div className="bg-card rounded-xl border border-border/50 p-4 sm:p-5 lg:sticky lg:top-28">
              <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Order Summary
              </h3>

              {/* Product row */}
              <div className="flex gap-3 pb-4 border-b border-border">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Qty: {quantity}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    ₹{itemTotal.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2.5 mt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{itemTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-accent-foreground">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground font-bold text-base pt-2 border-t border-border">
                  <span>Total</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Pay button (desktop only) */}
              <div className="hidden lg:block mt-5">
                <button
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 luxury-gradient text-primary-foreground rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opening Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay ₹{grandTotal.toLocaleString('en-IN')}
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                Secure checkout powered by Razorpay
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPayment;
