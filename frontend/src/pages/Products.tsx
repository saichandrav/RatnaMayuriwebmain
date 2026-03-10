import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { categories } from '../data/products';
import { useProducts } from '@/hooks/use-products';
import SEO from '@/components/SEO';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');

  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const subCategoryFilter = searchParams.get('sub') || '';
  const sellerFilter = searchParams.get('seller') || '';

  const { data: products = [], isLoading } = useProducts();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q) ||
          p.seller.name.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }

    if (subCategoryFilter) {
      result = result.filter(p => p.subCategory.toLowerCase() === subCategoryFilter.toLowerCase());
    }

    if (sellerFilter) {
      result = result.filter(p => p.seller.id === sellerFilter);
    }

    switch (sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [products, searchQuery, categoryFilter, subCategoryFilter, sellerFilter, sort]);

  const activeCategory = categories.find(c => c.id === categoryFilter);

  const clearFilter = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
  };

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next);
  };

  const updateSearchParams = (updater: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    setSearchParams(next);
  };

  const sellers = useMemo(() => {
    const sellerMap = new Map<string, { id: string; name: string }>();
    products.forEach(product => {
      if (!sellerMap.has(product.seller.id)) {
        sellerMap.set(product.seller.id, product.seller);
      }
    });
    return Array.from(sellerMap.values());
  }, [products]);

  const sellerInfo = sellerFilter ? sellers.find(s => s.id === sellerFilter) : null;

  return (
    <Layout>
      <SEO
        title="Browse Products"
        description="Explore our collection of handcrafted jewellery, silk sarees, and traditional Indian fashion at Ratnamayuri."
        keywords="buy jewellery online, silk sarees, bridal jewellery, temple jewellery, Indian fashion"
        canonical="https://ratnamayuri.live/products"
      />
      <div className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          {categoryFilter ? (
            <>
              <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
              <span>/</span>
              <span className="text-foreground capitalize">{categoryFilter === 'saree' ? 'Sarees' : 'Jewellery'}</span>
            </>
          ) : (
            <span className="text-foreground">All Products</span>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6">
          {sellerInfo ? (
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{sellerInfo.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">Verified Seller · {filteredProducts.length} products</p>
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : categoryFilter
                  ? categoryFilter === 'saree' ? 'Sarees Collection' : 'Jewellery Collection'
                  : 'All Collections'}
            </h1>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() =>
              updateSearchParams(next => {
                next.delete('category');
                next.delete('sub');
              })
            }
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              !categoryFilter ? 'luxury-gradient text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-border'
            }`}
          >
            All 
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() =>
                updateSearchParams(next => {
                  next.set('category', cat.id);
                  next.delete('sub');
                })
              }
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id ? 'luxury-gradient text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sub-category chips */}
        {activeCategory && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {activeCategory.subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setFilter('sub', sub)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  subCategoryFilter.toLowerCase() === sub.toLowerCase()
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
                
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Active filters & Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <span className="trust-badge text-xs">
                "{searchQuery}" <button onClick={() => clearFilter('search')}><X size={12} /></button>
              </span>
            )}
            {sellerFilter && sellerInfo && (
              <span className="trust-badge text-xs">
                {sellerInfo.name} <button onClick={() => clearFilter('seller')}><X size={12} /></button>
              </span>
            )}
            <span className="text-xs text-muted-foreground">{filteredProducts.length} products</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-lg text-xs font-medium"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-8 py-2 bg-secondary rounded-lg text-xs font-medium text-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-28 space-y-6">
              <div>
                <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Sellers</h4>
                <div className="space-y-2">
                  {sellers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => sellerFilter === s.id ? clearFilter('seller') : setFilter('seller', s.id)}
                      className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${
                        sellerFilter === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-20">
                <p className="text-lg font-heading text-foreground mb-2">Loading products</p>
                <p className="text-sm text-muted-foreground">Fetching the latest collections.</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg font-heading text-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search</p>
                <Link to="/products" className="text-sm text-primary font-medium hover:underline">
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Sheet */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-foreground/40 z-50 lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto lg:hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading text-lg font-bold">Filters</h3>
                  <button onClick={() => setIsFilterOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <h4 className="font-heading text-sm font-semibold">Sellers</h4>
                  {sellers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (sellerFilter === s.id) {
                          clearFilter('seller');
                        } else {
                          setFilter('seller', s.id);
                        }
                        setIsFilterOpen(false);
                      }}
                      className={`block w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                        sellerFilter === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Products;
