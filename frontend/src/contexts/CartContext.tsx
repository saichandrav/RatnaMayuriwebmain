import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { Product, CartItem, FlyingItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, event?: React.MouseEvent) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  flyingItems: FlyingItem[];
  removeFlyingItem: (id: number) => void;
  cartIconRef: React.RefObject<HTMLDivElement>;
  isCartBouncing: boolean;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const cartIconRef = useRef<HTMLDivElement>(null!);

  const addToCart = useCallback((product: Product, event?: React.MouseEvent) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Trigger flying animation
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const newFlyingItem: FlyingItem = {
        id: Date.now() + Math.random(),
        image: product.images[0],
        startX: rect.left + rect.width / 2,
        startY: rect.top + rect.height / 2,
      };
      setFlyingItems(prev => [...prev, newFlyingItem]);
    }

    // Trigger cart bounce
    setIsCartBouncing(true);
    setTimeout(() => setIsCartBouncing(false), 400);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const removeFlyingItem = useCallback((id: number) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId);
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      itemCount, total, flyingItems, removeFlyingItem, cartIconRef, isCartBouncing, isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};