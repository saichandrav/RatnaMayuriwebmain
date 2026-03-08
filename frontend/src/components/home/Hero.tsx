import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-jewellery.jpg';

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2070"
          alt="Luxury Indian bridal jewellery collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-36">
        <div className="max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-primary text-sm sm:text-base tracking-[0.3em] font-medium mb-4"
          >
            NEW COLLECTION 2026
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-background leading-tight mb-5"
          >
            Timeless Elegance,{' '}
            <span className="font-bold text-primary">Handcrafted</span> with Love
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-background/70 text-sm sm:text-base leading-relaxed mb-8 max-w-md"
          >
            Discover India's finest heritage jewellery and silk sarees from verified artisans. Every piece tells a story of tradition and craftsmanship.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              to="/products?category=jewellery"
              className="inline-flex items-center gap-2 px-6 py-3 luxury-gradient text-primary-foreground text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
            >
              Shop Jewellery <ArrowRight size={16} />
            </Link>
            <Link
              to="/products?category=saree"
              className="inline-flex items-center gap-2 px-6 py-3 bg-background/10 backdrop-blur-sm text-background text-sm font-semibold rounded-full border border-background/20 hover:bg-background/20 transition-all duration-300"
            >
              Explore Sarees
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;