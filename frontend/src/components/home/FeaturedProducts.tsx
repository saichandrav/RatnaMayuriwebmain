import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/use-products';

const FeaturedProducts = () => {
  const { data: products = [] } = useProducts({ featured: 'true' });
  const featured = products.filter(p => p.isFeatured).slice(0, 8);

  return (
    <section className="py-16 sm:py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
              Our Collection
            </h2>
            <p className="text-muted-foreground text-sm">
              Handpicked pieces loved by our customers
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-gold-dark transition-colors"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {featured.length === 0 ? (
            <div className="col-span-full text-center text-sm text-muted-foreground">
              Featured pieces are loading.
            </div>
          ) : (
            featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))
          )}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 luxury-gradient text-primary-foreground text-sm font-semibold rounded-full"
          >
            View All Products <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;