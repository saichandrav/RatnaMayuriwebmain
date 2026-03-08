import Layout from "@/components/layout/Layout";

const ProductPricing = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Product Prices</h1>
        <div className="space-y-3 text-sm text-muted-foreground leading-7">
          <p>All product prices are clearly displayed on product cards, product detail pages, and checkout summary.</p>
          <p>The final payable amount is shown before payment confirmation.</p>
          <p>Any discount or coupon reduction is shown separately for full pricing transparency.</p>
          <p>No shipping charge is added to the order total.</p>
        </div>
      </div>
    </Layout>
  );
};

export default ProductPricing;
