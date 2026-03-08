import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import TrustBadges from '@/components/home/TrustBadges';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Categories />
      <FeaturedCollections />
      <FeaturedProducts />
      <TrustBadges />
    </Layout>
  );
};

export default Index;