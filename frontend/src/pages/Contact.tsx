import Layout from "@/components/layout/Layout";

const Contact = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Contact</h1>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Email: suportratnamayuri@gmail.com</p>
          <p>Phone: +91 7569321052</p>
          <p>Address: Guntur, Andhra Pradesh, India</p>
          <p>Support Hours: Monday to Saturday, 10:00 AM to 7:00 PM</p>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
