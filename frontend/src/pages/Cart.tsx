import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDelete } from '@/components/ui/confirm-delete';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, total, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center pb-28 lg:pb-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-muted-foreground mb-6">Discover our exquisite collections and find something you love.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 luxury-gradient text-primary-foreground text-sm font-semibold rounded-full"
          >
            Start Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  const shipping = total >= 5000 ? 0 : 20;
  const grandTotal = total + shipping;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    const primaryCheckoutItem = items[0]
      ? { product: items[0].product, quantity: items[0].quantity }
      : undefined;

    if (!primaryCheckoutItem) {
      return;
    }

    navigate('/checkout/delivery', {
      state: {
        checkoutItem: primaryCheckoutItem,
      },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-28 lg:pb-12">
        <Link to="/products" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-8">
          Shopping Cart ({itemCount} {itemCount === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map(({ product, quantity }) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="flex gap-4 p-4 bg-card rounded-xl border border-border/50"
                >
                  <Link to={`/product/${product.id}`} className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-secondary shrink-0">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{product.seller.name}</p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-medium">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-foreground">
                          ₹{(product.price * quantity).toLocaleString('en-IN')}
                        </span>
                        <ConfirmDelete
                          onConfirm={() => removeFromCart(product.id)}
                          title="Remove from cart?"
                          description="This item will be removed from your cart."
                          confirmLabel="Remove"
                        >
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </ConfirmDelete>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-card rounded-xl border border-border/50 p-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-semibold text-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 luxury-gradient text-primary-foreground font-semibold rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
              >
                Proceed to Checkout
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4">
                <Shield size={14} className="text-primary" />
                <span className="text-[11px] text-muted-foreground">Secure checkout · 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;