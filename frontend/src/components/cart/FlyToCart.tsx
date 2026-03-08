import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';

const FlyToCart = () => {
  const { flyingItems, removeFlyingItem, cartIconRef } = useCart();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {flyingItems.map(item => {
          const cartRect = cartIconRef.current?.getBoundingClientRect();
          const endX = cartRect ? cartRect.left + cartRect.width / 2 - 20 : window.innerWidth - 50;
          const endY = cartRect ? cartRect.top + cartRect.height / 2 - 20 : 30;

          return (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX - 20,
                y: item.startY - 20,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                x: endX,
                y: endY,
                scale: 0.15,
                opacity: 0.6,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.65,
                ease: [0.25, 0.8, 0.25, 1],
              }}
              onAnimationComplete={() => removeFlyingItem(item.id)}
              className="absolute w-10 h-10 rounded-full overflow-hidden shadow-xl border-2 border-primary"
            >
              <img
                src={item.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default FlyToCart;