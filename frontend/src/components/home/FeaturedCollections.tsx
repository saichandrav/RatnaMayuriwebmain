import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const collections = [
  {
    title: 'Layered Luxe',
    subtitle: 'Stack it. Style it. Own it.',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&q=80&w=1200',
    link: '/products?category=jewellery&style=layered',
    span: 'large',
  },
  {
    title: 'Ethnic Glow',
    subtitle: 'Tradition with a twist.',
    image:
      'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&q=80&w=800',
    link: '/products?category=jewellery&style=ethnic',
    span: 'small',
  },
  {
    title: 'Diamond Whisper',
    subtitle: 'Delicate shine. Big impression.',
    image:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
    link: '/products?category=jewellery&style=diamond',
    span: 'small',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: 'easeOut' as const },
  }),
};

const FeaturedCollections = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[hsl(var(--ivory))]">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground tracking-wide uppercase mb-3">
            Featured Jewellery Collections
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            A selection of jewellery designs across categories
          </p>
        </motion.div>

        {/* ──────── Grid ──────── */}
        {/* Mobile: single column, Tablet+: two‑column bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-3 max-w-6xl mx-auto">
          {/* Large card – left column, spans 2 rows on md+ */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="md:row-span-2"
          >
            <Link
              to={collections[0].link}
              className="group relative block w-full h-full min-h-[360px] sm:min-h-[420px] md:min-h-full rounded-md overflow-hidden shadow-lg"
            >
              <img
                src={collections[0].image}
                alt={collections[0].title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              {/* gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

              {/* text */}
              <div className="absolute inset-0 flex flex-col justify-end items-start p-6 sm:p-8 lg:p-10">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-white tracking-wider uppercase drop-shadow-lg">
                  {collections[0].title}
                </h3>
                <p className="text-white/80 text-sm sm:text-base mt-1 italic drop-shadow">
                  {collections[0].subtitle}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary bg-white/90 backdrop-blur px-4 py-2 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Right column cards */}
          {collections.slice(1).map((col, idx) => (
            <motion.div
              key={col.title}
              custom={idx + 1}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Link
                to={col.link}
                className="group relative block w-full rounded-md overflow-hidden shadow-lg aspect-[4/3] sm:aspect-[16/10] md:aspect-auto md:h-full md:min-h-[200px]"
              >
                <img
                  src={col.image}
                  alt={col.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* text – positioned bottom‑right to match the screenshot */}
                <div className="absolute bottom-0 right-0 p-5 sm:p-6 text-right">
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-wider uppercase drop-shadow-lg">
                    {col.title}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm mt-0.5 italic drop-shadow">
                    {col.subtitle}
                  </p>
                </div>

                {/* hover CTA */}
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-white/90 backdrop-blur px-3 py-1.5 rounded-full opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  Explore <ArrowRight size={12} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
