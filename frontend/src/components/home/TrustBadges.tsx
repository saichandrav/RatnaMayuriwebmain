import { Shield, BadgeCheck, Truck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const badges = [
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% encrypted transactions',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Sellers',
    description: 'Every artisan is certified',
  },
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders above ₹5,000',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '15-day hassle-free returns',
  },
];

const TrustBadges = () => {
  return (
    <section className="py-12 sm:py-16 bg-background border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                <badge.icon size={22} className="text-primary" />
              </div>
              <h4 className="text-sm font-heading font-semibold text-foreground">{badge.title}</h4>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;