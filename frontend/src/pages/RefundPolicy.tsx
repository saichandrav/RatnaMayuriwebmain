import Layout from "@/components/layout/Layout";

const RefundPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Return / Exchange Policy</h1>
        <div className="space-y-6 text-sm text-muted-foreground leading-7">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Eligibility for Return</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Merchandise can only be returned if it is damaged or defective.</li>
              <li>Returns must be requested within 7 days of delivery.</li>
              <li>Products must be unused, in original packaging, with unremoved tags and invoice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How to Return</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Call the helpdesk at 1800-212-4558 within 7 days (10:00 am - 5:30 pm IST, except Sundays).</li>
              <li>For damaged items accepted, contact 7569321052 or email suportratnamayuri@gmail.com within 7 days.</li>
              <li>Returns are collected by courier, and the original invoice is required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Conditions</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>No returns after 7 days.</li>
              <li>Returns will not be accepted without the original invoice.</li>
              <li>Customers are required to share a packing video when returning the shipment.</li>
              <li>For hygiene reasons, altered products cannot be returned.</li>
              <li>Refunds are initiated only after QC check and satisfactory results.</li>
              <li>Shipping and service charges will be deducted for returned orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Non-returnable Items</h2>
            <p>Custom Jewelry, special orders, Nose pin, Gold/Silver coins, Gift Cards, and customized products.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Refund Process</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Refunds are processed within 7 business days after the product is received.</li>
              <li>Refunds are issued to the original payment method.</li>
              <li>Credit card refunds may take longer due to bank processing time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Important Notes</h2>
            <p>
              Always check packaging before accepting delivery. If damaged, refuse delivery and contact customer service
              immediately.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
