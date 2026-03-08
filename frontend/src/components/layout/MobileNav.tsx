import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const MobileNav = () => {
  const location = useLocation();
  const { itemCount } = useCart();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Search, label: 'Browse' },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: itemCount },
    { to: '/login', icon: User, label: 'Account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to || (to === '/products' && location.pathname.startsWith('/product'));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {badge ? (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 luxury-gradient text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;