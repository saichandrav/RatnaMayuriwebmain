import { AnimatePresence, motion } from "framer-motion";

interface CouponSuccessAnimationProps {
  visible: boolean;
  couponCode: string;
  discountRate: number;
  onDone?: () => void;
}

export const CouponSuccessAnimation: React.FC<CouponSuccessAnimationProps> = ({
  visible,
  couponCode,
  discountRate,
  onDone,
}) => {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] pointer-events-none flex items-start justify-center pt-20"
        >
          <motion.div
            initial={{ y: -24, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-green-500/30 bg-card shadow-lg px-4 py-3"
          >
            <p className="text-sm font-semibold text-green-600">Coupon applied 🎉</p>
            <p className="text-xs text-muted-foreground mt-1">
              {couponCode} · {discountRate}% discount added
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
