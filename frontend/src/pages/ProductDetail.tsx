import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingBag, Zap, Shield, BadgeCheck, Truck, Minus, Plus, Loader2, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import ImageGallery from '@/components/products/ImageGallery';
import { useCanReviewProduct, useProduct, useProductReviews, useProducts } from '@/hooks/use-products';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CheckoutItem } from '@/lib/types';
import { api } from '@/lib/api';
import { toast } from '@/components/ui/sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const { data: reviews = [], isLoading: isReviewsLoading } = useProductReviews(id);
  const { data: reviewEligibility } = useCanReviewProduct(id, Boolean(user));

  const reviewMutation = useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) => api.createProductReview(id || '', payload),
    onSuccess: async () => {
      setReviewRating(0);
      setReviewComment('');
      toast('Review submitted', { description: 'Thank you for sharing your feedback.' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['product', id] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['product-reviews', id] }),
        queryClient.invalidateQueries({ queryKey: ['product-can-review', id] }),
      ]);
    },
    onError: (error) => {
      toast('Unable to submit review', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">Loading product</h2>
          <p className="text-sm text-muted-foreground">Fetching the latest details.</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-heading font-bold mb-4">Product Not Found</h2>
          <Link to="/products" className="text-primary font-medium hover:underline">Browse products</Link>
        </div>
      </Layout>
    );
  }

  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    for (let i = 0; i < quantity; i++) {
      addToCart(product, i === 0 ? e : undefined);
    }
    window.setTimeout(() => setIsAddingToCart(false), 650);
  };

  const handleBuyNow = () => {
    const checkoutItem: CheckoutItem = { product, quantity };
    navigate('/checkout/delivery', { state: { checkoutItem } });
  };

  const handleSubmitReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) {
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      toast('Choose a rating', { description: 'Please select between 1 and 5 stars.' });
      return;
    }

    reviewMutation.mutate({
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className=""
          >
            <ImageGallery images={product.images} productName={product.name} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Seller */}
            <Link
              to={`/products?seller=${product.seller.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
            >
              <BadgeCheck size={14} className="text-primary" />
              {product.seller.name} · Verified Seller
            </Link>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground leading-snug mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-border'}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs font-semibold rounded">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Category & Sub */}
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-secondary-foreground capitalize">
                {product.category === 'saree' ? 'Sarees' : 'Jewellery'}
              </span>
              <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-secondary-foreground">
                {product.subCategory}
              </span>
            </div>
                        {/* Expected Delivery */}
            <div className="flex items-center gap-3 mt-5  borderrounded-lg px-4 py-3">
              <CalendarClock className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-xs text-green-9cd 00">Expected Delivery</p>
                <p className="text-sm font-semibold text-green-800">
                  {(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 10);
                    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
                  })()}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
            </div>

            {/* Add to Cart + Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:max-w-xl">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 luxury-gradient text-primary-foreground font-semibold rounded-full text-sm hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-[0.97]"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    {isInCart(product.id) ? 'Add More' : 'Add to Cart'}
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-semibold rounded-full text-md hover:shadow-lg hover:shadow-amber-400/30 transition-all duration-300 active:scale-[0.97]"
              >
                {/* <Zap size={18} /> */}
                Buy Now 
              </button>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border">
              <div className="flex flex-col items-center text-center gap-1">
                <Shield size={18} className="text-primary" />
                <span className="text-[10px] text-muted-foreground">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <BadgeCheck size={18} className="text-primary" />
                <span className="text-[10px] text-muted-foreground">Certified Authentic</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Truck size={18} className="text-primary" />
                <span className="text-[10px] text-muted-foreground">Free Shipping</span>
              </div>
            </div>


          </motion.div>
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-5">Ratings & Reviews</h3>

          {!user && (
            <p className="text-sm text-muted-foreground mb-6">
              <Link to="/login" className="text-primary hover:underline">Login</Link> to add a review after your order is confirmed.
            </p>
          )}

          {user && reviewEligibility?.canReview && (
            <form onSubmit={handleSubmitReview} className="border border-border rounded-xl p-4 sm:p-5 mb-8 space-y-4">
              <p className="text-sm font-medium text-foreground">Add your review</p>

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starNumber = i + 1;
                  return (
                    <button
                      type="button"
                      key={starNumber}
                      onClick={() => setReviewRating(starNumber)}
                      className="p-0.5"
                    >
                      <Star
                        size={20}
                        className={starNumber <= reviewRating ? 'fill-primary text-primary' : 'text-border'}
                      />
                    </button>
                  );
                })}
              </div>

              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Share your experience with this product"
                className="w-full min-h-28 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={500}
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{reviewComment.length}/500</span>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="inline-flex items-center justify-center px-5 py-2.5 luxury-gradient text-primary-foreground font-semibold rounded-full text-sm disabled:opacity-60"
                >
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {user && reviewEligibility?.hasReviewed && (
            <p className="text-sm text-muted-foreground mb-6">You have already submitted a review for this product.</p>
          )}

          {user && reviewEligibility && !reviewEligibility.hasEligibleOrder && !reviewEligibility.hasReviewed && (
            <p className="text-sm text-muted-foreground mb-6">
              You can add a review after purchasing this product and getting order confirmation.
            </p>
          )}

          {isReviewsLoading ? (
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.user.name}</p>
                      <div className="mt-1 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < review.rating ? 'fill-primary text-primary' : 'text-border'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl sm:text-2xl font-heading font-bold text-foreground mb-6">
              You May Also Like
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {isAddingToCart && (
          <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[1px] flex items-center justify-center px-4">
            <div className="">
              <Loader2 size={40} className="animate-spin text-primary" />
              {/* <div>
                <p className="text-sm font-semibold text-foreground">Adding to cart...</p>
                <p className="text-xs text-muted-foreground">Please wait a moment</p>
              </div> */}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;