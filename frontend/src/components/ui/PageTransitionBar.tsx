import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useNavigationLoader } from "@/contexts/NavigationLoaderContext";

const PageTransitionBar = () => {
  const location = useLocation();
  const { isNavigating, start, stop } = useNavigationLoader();

  useEffect(() => {
    start();
    const timeout = setTimeout(() => stop(), 250);
    return () => clearTimeout(timeout);
  }, [location.pathname, start, stop]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          key="page-transition-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-[100] h-1 origin-left luxury-gradient"
        />
      )}
    </AnimatePresence>
  );
};

export default PageTransitionBar;
