import Layout from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-4">Privacy Policy</h1>
        <div className="space-y-6 text-sm text-muted-foreground leading-7">
          <p>
            We value your privacy and handle your personal information with utmost confidentiality. We will not share
            your information with any third party for marketing purposes.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What Information Do We Collect From You?</h2>
            <p>
              We have access only to information you provide willingly. This may include name, e-mail address,
              delivery address, office or residential address, telephone number, and mobile number when placing
              orders, signing up for e-newsletters, entering competitions, or giving feedback.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How Will We Use It?</h2>
            <p>
              We use personal information to fulfil orders and communicate when necessary. We may contact you about
              news and offers, or to inform you about important website or terms updates. You can opt out of
              promotional communication anytime by email or by using the unsubscribe option in emails.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Will We Share Your Personal Information With Anyone Else?</h2>
            <p>
              We do not share your personal details with other companies for their marketing purposes. Payments are
              processed by trusted third-party providers operating under non-disclosure agreements and secure
              certifications.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How Long Will We Keep Your Information?</h2>
            <p>
              We retain personal information only as long as needed to complete your request, fulfill an order, or
              respond to your queries.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What Are Cookies and How Do We Use Them?</h2>
            <p>
              Cookies help us recognize you, retain shopping basket items, speed up checkout, and improve your
              browsing experience. Cookies may also be used for anonymous website statistics and ad effectiveness
              tracking.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Trustworthy Privacy Practices</h2>
            <p>
              By using our services, you agree to receive transactional, promotional, and commercial communication
              related to your activity and orders. You can request us to stop promotional/commercial communications at
              any time.
            </p>
            <p className="mt-3">
              Certain orders may be refused or cancelled due to stock limits, pricing errors, or fraud/risk checks. If
              cancellation happens after payment, the amount is returned to the original payment method.
            </p>
            <p className="mt-3">
              Ready-to-ship orders may be cancelled only before dispatch. Refunds for such cancellations are processed
              to the original payment method within 10 business days after deducting applicable payment gateway service
              charges (typically 0.5% to 4%, based on payment method).
            </p>
            <p className="mt-3">
              Gold coins, bars, and solitaire orders cannot be cancelled. If fraud alerts/disputes/chargebacks are
              received before dispatch or delivery, applicable gateway charges will be deducted. No refunds are issued
              once the product has been delivered.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Support Contact</h2>
            <p>
              For damaged items accepted, contact within 7 days at 7569321052 or suportratnamayuri@gmail.com.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
