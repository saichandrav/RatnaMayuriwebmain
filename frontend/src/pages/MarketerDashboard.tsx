import Layout from "@/components/layout/Layout";

const MarketerDashboard = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-12">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Marketer Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track coupon performance and commission payouts.</p>

        <div className="mt-6 rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          Coupon and commission analytics will appear here.
        </div>
      </div>
    </Layout>
  );
};

export default MarketerDashboard;
