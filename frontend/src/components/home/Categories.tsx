import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gem, Sparkles } from 'lucide-react';
import productNecklace from '@/assets/product-necklace.jpg';
import productSaree from '@/assets/product-saree.jpg';

const categoryCards = [
  {
    title: 'Jewellery',
    subtitle: 'Gold · Diamond · Bridal · Temple',
    slug: 'jewellery',
    image: productNecklace,
    icon: Gem,
  },
  {
    title: 'Sarees',
    subtitle: 'Kanjeevaram · Banarasi · Silk · Cotton',
    slug: 'saree',
    image: productSaree,
    icon: Sparkles,
  },
];

const Categories = () => {
  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-2">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-sm">
            Explore our curated collections
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {categoryCards.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group relative block rounded-xl overflow-hidden aspect-[4/3] hover-lift"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <cat.icon size={18} className="text-primary" />
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-background">
                      {cat.title}
                    </h3>
                  </div>
                  <p className="text-background/70 text-xs sm:text-sm">{cat.subtitle}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;