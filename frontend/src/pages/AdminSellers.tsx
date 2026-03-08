import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const AdminSellers = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-12">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Sellers</h1>
        <p className="mt-2 text-sm text-muted-foreground">View and manage registered seller accounts.</p>

        <div className="mt-6 rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">Seller management data will appear here.</p>
          <Link to="/admin" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
            Back to admin dashboard
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AdminSellers;
