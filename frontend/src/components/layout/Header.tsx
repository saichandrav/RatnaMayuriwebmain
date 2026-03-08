import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';


const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount, cartIconRef, isCartBouncing } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs tracking-widest font-body">
        FREE SHIPPING ON ORDERS ABOVE ₹1,000
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-wider luxury-gradient-text">
              RatnaMayuri
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/products" className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">
              ALL COLLECTIONS
            </Link>
            <Link to="/products?category=jewellery" className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">
              JEWELLERY
            </Link>
            <Link to="/products?category=saree" className="text-sm font-medium tracking-wide text-foreground/80 hover:text-primary transition-colors">
              SAREES
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Desktop search */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder="Search jewellery, sarees..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <Search size={16} className="absolute left-3.5 text-muted-foreground" />
            </form>

            {/* Mobile search toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 text-foreground"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/orders"
                  className="inline-flex items-center px-3 py-2 rounded-full border border-border text-xs font-bold tracking-widest text-foreground/70 hover:text-primary transition-colors"
                >
                  ORDERS
                </Link>
                {user.role === 'seller' && (
                  <Link
                    to="/seller"
                    className="inline-flex items-center px-3 py-2 rounded-full border border-primary/30 text-xs font-bold tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    SELLER
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center px-3 py-2 rounded-full border border-primary/30 text-xs font-bold tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    ADMIN
                  </Link>
                )}
                {user.role === 'marketer' && (
                  <Link
                    to="/marketer"
                    className="inline-flex items-center px-3 py-2 rounded-full border border-primary/30 text-xs font-bold tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    MARKETER
                  </Link>
                )}
                {(user.role === 'support' || user.role === 'admin') && (
                  <Link
                    to="/support"
                    className="inline-flex items-center px-3 py-2 rounded-full border border-primary/30 text-xs font-bold tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    SUPPORT
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 rounded-full border border-border text-xs font-bold tracking-widest text-foreground/70 hover:text-primary transition-colors"
                >
                  LOGOUT
                </button>
                <Link to="/account" className="p-2 text-foreground/80 hover:text-primary transition-colors">
                  <User size={20} />
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center px-3 py-2  rounded-full border border-primary/40 text-xs font-bold tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                LOGIN
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2">
              <div ref={cartIconRef} className={isCartBouncing ? 'animate-cart-bounce' : ''}>
                <ShoppingBag size={20} className="text-foreground/80 hover:text-primary transition-colors" />
              </div>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 luxury-gradient text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border overflow-hidden"
          >
            <form onSubmit={handleSearch} className="container mx-auto px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jewellery, sarees..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border overflow-hidden bg-card"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link to="/products" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                ALL COLLECTIONS
              </Link>
              <Link to="/products?category=jewellery" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                JEWELLERY
              </Link>
              <Link to="/products?category=saree" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                SAREES
              </Link>
              {user ? (
                <>
                  <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                    ACCOUNT
                  </Link>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                    ORDERS
                  </Link>
                  {user.role === 'seller' && (
                    <Link to="/seller" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                      SELLER STUDIO
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                      ADMIN DASHBOARD
                    </Link>
                  )}
                  {user.role === 'marketer' && (
                    <Link to="/marketer" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                      MARKETER DASHBOARD
                    </Link>
                  )}
                  {(user.role === 'support' || user.role === 'admin') && (
                    <Link to="/support" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                      SUPPORT DASHBOARD
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="py-2 text-left text-sm font-medium tracking-wide text-foreground/80"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm font-medium tracking-wide text-foreground/80">
                  LOGIN
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;