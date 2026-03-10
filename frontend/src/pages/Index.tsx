import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import FeaturedCollections from '@/components/home/FeaturedCollections';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import TrustBadges from '@/components/home/TrustBadges';
import SEO from '@/components/SEO';

const Index = () => {
  return (
    <Layout>
      <SEO
        title="Luxury Jewellery & Premium Silk Sarees"
        description="Shop handcrafted luxury jewellery and premium silk sarees at Ratnamayuri. Perfect for bridal, temple jewellery, weddings and festive collections."
        keywords="Ratnamayuri, jewellery, silk sarees, bridal jewellery, temple jewellery, Indian jewellery online"
        canonical="https://ratnamayuri.live/"
      />
      <Hero />
      <Categories />
      <FeaturedCollections />
      <FeaturedProducts />
      <TrustBadges />
    </Layout>
  );
};

export default Index;
