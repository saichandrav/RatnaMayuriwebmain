import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const AdminSellerProfile = () => {
  const { id } = useParams();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24 lg:pb-12">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Seller Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Seller ID: {id}</p>

        <div className="mt-6 rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          Seller profile details and order history will appear here.
        </div>
      </div>
    </Layout>
  );
};

export default AdminSellerProfile;
