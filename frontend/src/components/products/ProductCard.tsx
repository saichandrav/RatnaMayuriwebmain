import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product, CheckoutItem } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();
  const inCart = isInCart(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, e);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const checkoutItem: CheckoutItem = { product, quantity: 1 };
    navigate('/checkout/delivery', { state: { checkoutItem } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="group block bg-card rounded-lg overflow-hidden border border-border/50 hover-lift"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded">
              {discount}% OFF
            </span>
          )}
          {/* Cart / Buy Now button */}
          {inCart ? (
            <button
              onClick={handleBuyNow}
              className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-xs font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-105 active:scale-95"
              aria-label="Buy Now"
            >
              <Zap size={12} />
              Buy Now
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-2 right-2 w-10 h-10 luxury-gradient text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
              aria-label="Add to cart"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <Star size={12} className="fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-foreground">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <p className="text-[8px] text-muted-foreground tracking-wider uppercase mb-1">
            {product.seller.name}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;