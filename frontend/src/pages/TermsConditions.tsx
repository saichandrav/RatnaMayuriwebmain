import Layout from "@/components/layout/Layout";

const TermsConditions = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Terms & Conditions</h1>
        <div className="space-y-3 text-sm text-muted-foreground leading-7">
          <p>By using this website, you agree to provide accurate account and order information.</p>
          <p>All orders are subject to confirmation, availability, and successful payment verification.</p>
          <p>Product images are indicative; minor variation may occur for handcrafted products.</p>
          <p>Prices and offers may change at any time without prior notice.</p>
        </div>
      </div>
    </Layout>
  );
};

export default TermsConditions;
