import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Check, ChevronDown, ChevronUp, Package, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';
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

/* ── Default empty address ────────────────────────────────────── */
const emptyAddress: ShippingAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

const CheckoutDelivery = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutItem: CheckoutItem | undefined = location.state?.checkoutItem;

  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<'saved' | 'new'>('new');
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load saved address from user profile on mount
  useEffect(() => {
    let mounted = true;
    api.getUserProfile()
      .then(({ user }) => {
        if (!mounted) return;
        const addr = user.address;
        if (addr && addr.line1) {
          const saved: ShippingAddress = {
            fullName: user.name || '',
            phone: user.phone || '',
            line1: addr.line1 || '',
            line2: addr.line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            postalCode: addr.postalCode || '',
            country: addr.country || 'India',
          };
          setSavedAddress(saved);
          setSelectedAddress('saved');
        } else {
          setShowForm(true);
        }
      })
      .catch(() => {
        if (mounted) setShowForm(true);
      })
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });
    return () => { mounted = false; };
  }, []);

  // Redirect if navigated without state
  if (!checkoutItem) {
    navigate('/products', { replace: true });
    return null;
  }

  const { product, quantity } = checkoutItem;
  const itemTotal = product.price * quantity;
  const shipping = itemTotal >= 5000 ? 0 : 20;

  const validate = () => {
    const e: Partial<ShippingAddress> = {};
    if (!address.fullName.trim()) e.fullName = 'Required';
    if (!address.phone.trim()) e.phone = 'Required';
    if (!address.line1.trim()) e.line1 = 'Required';
    if (!address.city.trim()) e.city = 'Required';
    if (!address.state.trim()) e.state = 'Required';
    if (!address.postalCode.trim()) e.postalCode = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (selectedAddress === 'new') {
      if (!validate()) return;
      const shippingAddress = { ...address };
      setSavedAddress(shippingAddress);
      navigate('/checkout/review', { state: { checkoutItem, shippingAddress } });
    } else if (savedAddress) {
      navigate('/checkout/review', { state: { checkoutItem, shippingAddress: savedAddress } });
    }
  };

  const handleEditDefaultAddress = () => {
    if (!savedAddress) return;
    setAddress({ ...savedAddress });
    setSelectedAddress('new');
    setShowForm(true);
    setErrors({});
  };

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const inputCls = (field: keyof ShippingAddress) =>
    `w-full px-3 py-2.5 text-sm bg-background border rounded-lg outline-none transition-colors focus:border-primary text-foreground placeholder:text-muted-foreground ${errors[field] ? 'border-destructive' : 'border-border'
    }`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-28 lg:pb-12 max-w-5xl">
        <CheckoutSteps current={0} />

        {loadingProfile ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading saved address...
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── Address Panel ── */}
          <div className="lg:col-span-2 space-y-4">
            <h1 className="text-2xl font-heading font-bold text-foreground">Delivery</h1>
            <p className="text-sm text-muted-foreground">Where should we deliver your order?</p>

            {/* Saved address card */}
            {savedAddress && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${selectedAddress === 'saved'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                  }`}
                onClick={() => setSelectedAddress('saved')}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddress === 'saved' ? 'border-primary' : 'border-border'
                  }`}>
                  {selectedAddress === 'saved' && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{savedAddress.fullName}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">Default</span>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleEditDefaultAddress();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{savedAddress.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {savedAddress.line1}{savedAddress.line2 ? `, ${savedAddress.line2}` : ''},{' '}
                    {savedAddress.city}, {savedAddress.state} – {savedAddress.postalCode}
                  </p>
                </div>
                <MapPin size={16} className="text-primary shrink-0" />
              </motion.div>
            )}

            {/* Add new address toggle */}
            <button
              type="button"
              onClick={() => { setShowForm(v => !v); setSelectedAddress('new'); }}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
              {savedAddress ? 'Use a different address' : 'Add delivery address'}
              {showForm && <ChevronDown size={16} className="ml-auto" />}
            </button>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card border border-border/60 rounded-xl p-5 space-y-4">
                    {/* Row 1: Full Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          placeholder="YOUR NAME"
                          value={address.fullName}
                          onChange={e => handleChange('fullName', e.target.value)}
                          className={inputCls('fullName')}
                        />
                        {errors.fullName && <p className="text-[11px] text-destructive mt-1">{errors.fullName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Phone Number *</label>
                        <input
                          type="tel"
                          placeholder="XXXXXXXXXX"
                          value={address.phone}
                          onChange={e => handleChange('phone', e.target.value)}
                          className={inputCls('phone')}
                        />
                        {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* Address Line 1 */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Address Line 1 *</label>
                      <input
                        type="text"
                        placeholder="Flat / House no., Building, Street"
                        value={address.line1}
                        onChange={e => handleChange('line1', e.target.value)}
                        className={inputCls('line1')}
                      />
                      {errors.line1 && <p className="text-[11px] text-destructive mt-1">{errors.line1}</p>}
                    </div>

                    {/* Address Line 2 */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1.5">Address Line 2 <span className="text-muted-foreground">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="Area, Colony, Landmark"
                        value={address.line2}
                        onChange={e => handleChange('line2', e.target.value)}
                        className={inputCls('line2')}
                      />
                    </div>

                    {/* City + State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">City *</label>
                        <input
                          type="text"
                          placeholder="Hyderabad"
                          value={address.city}
                          onChange={e => handleChange('city', e.target.value)}
                          className={inputCls('city')}
                        />
                        {errors.city && <p className="text-[11px] text-destructive mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">State *</label>
                        <input
                          type="text"
                          placeholder="Telangana"
                          value={address.state}
                          onChange={e => handleChange('state', e.target.value)}
                          className={inputCls('state')}
                        />
                        {errors.state && <p className="text-[11px] text-destructive mt-1">{errors.state}</p>}
                      </div>
                    </div>

                    {/* Postal Code + Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Postal Code *</label>
                        <input
                          type="text"
                          placeholder="500001"
                          value={address.postalCode}
                          onChange={e => handleChange('postalCode', e.target.value)}
                          className={inputCls('postalCode')}
                        />
                        {errors.postalCode && <p className="text-[11px] text-destructive mt-1">{errors.postalCode}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Country</label>
                        <input
                          type="text"
                          value={address.country}
                          onChange={e => handleChange('country', e.target.value)}
                          className={inputCls('country')}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedAddress === 'new' && !showForm}
              className="w-full sm:w-auto px-8 py-3 luxury-gradient text-primary-foreground font-semibold rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Review
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
                  <span>₹{(itemTotal + shipping).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
};

export default CheckoutDelivery;
