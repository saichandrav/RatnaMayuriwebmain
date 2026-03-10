import Layout from "@/components/layout/Layout";
import SEO from "@/components/SEO";

const AboutUs = () => {
  return (
    <Layout>
      <SEO
        title="About Us"
        description="RatnaMayuri is an Indian fashion marketplace focused on handcrafted jewellery and heritage sarees from trusted sellers and artisans."
        canonical="https://ratnamayuri.live/about-us"
      />
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">About Us</h1>
        <p className="text-sm text-muted-foreground leading-7 mb-4">
          RatnaMayuri is an Indian fashion marketplace focused on handcrafted jewellery and heritage sarees.
          We work with trusted sellers and artisans to bring authentic products to customers with transparent pricing.
        </p>
        <p className="text-sm text-muted-foreground leading-7">
          Our goal is simple: quality products, secure checkout, clear communication, and dependable customer support.
        </p>
      </div>
    </Layout>
  );
};

export default AboutUs;
