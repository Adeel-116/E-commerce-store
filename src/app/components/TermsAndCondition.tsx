import React from "react";
import "../../app/styles/terms-and-condition.css";
import NavbarController from "./NavbarController";

const sections = [
  {
    heading: "Using Our Website",
    content: (
      <p>
        By placing an order on zaryastyle.com you confirm the details you
        provide (name, phone number, address) are accurate. We reserve the
        right to refuse or cancel any order — for example in case of pricing
        errors, suspected fraud, or stock unavailability.
      </p>
    ),
  },
  {
    heading: "Pricing & Products",
    content: (
      <p>
        All prices are listed in PKR and may change without prior notice.
        We try our best to show accurate product photos and descriptions,
        but actual color may vary slightly due to screen settings and
        lighting.
      </p>
    ),
  },
  {
    heading: "Orders & Payment",
    content: (
      <p>
        We accept Cash on Delivery (COD) as well as online payments through
        our secure checkout. Orders are confirmed once payment is verified
        (for prepaid orders) or once your COD order is placed successfully.
        We may call or message you to confirm your order before dispatch.
      </p>
    ),
  },
  {
    heading: "Shipping & Delivery",
    content: (
      <p>
        Orders are dispatched within 1–2 business days and typically
        delivered within 5–8 business days across Pakistan, depending on
        your city and courier availability. Delivery timelines are
        estimates, not guarantees.
      </p>
    ),
  },
  {
    heading: "Exchange & Return Policy",
    content: (
      <p>
        We offer a 7-day replacement policy from the date of delivery for
        size or genuine quality issues. Items must be unused, unwashed, and
        in original packaging with tags attached. Please see our Shipping
        and Returns section on the product page, or contact us to start an
        exchange.
      </p>
    ),
  },
  {
    heading: "Promo Codes",
    content: (
      <p>
        Promo codes are valid only on eligible products and cannot be
        combined with other offers unless stated otherwise. We may modify or
        withdraw any promo code at our discretion.
      </p>
    ),
  },
  {
    heading: "Account & Website Use",
    content: (
      <p>
        You agree not to misuse the website — including attempting
        unauthorized access, submitting false information, or using the
        site for any unlawful purpose. We may suspend accounts that violate
        these terms.
      </p>
    ),
  },
  {
    heading: "Limitation of Liability",
    content: (
      <p>
        We are not liable for delays or issues caused by courier services,
        incorrect address details provided by the customer, or events beyond
        our reasonable control.
      </p>
    ),
  },
  {
    heading: "Changes to These Terms",
    content: (
      <p>
        We may update these Terms from time to time. Continued use of the
        website after changes are posted means you accept the updated
        Terms.
      </p>
    ),
  },
  {
    heading: "Contact Us",
    content: (
      <p>
        Questions about these Terms? Reach us at{" "}
        <a href="mailto:infozaryastyle@gmail.com">infozaryastyle@gmail.com</a>.
      </p>
    ),
  },
];

const TermsAndCondition = () => {
  return (
    <>
      <NavbarController />
      <div className="pp-wrapper">
        <div className="pp-hero">
          <h1>Terms &amp; Conditions</h1>
          <p>
            Welcome to Zarya Style. These Terms &amp; Conditions govern your
            use of zaryastyle.com and any purchases you make with us. By
            using our website, you agree to the terms below.
          </p>
        </div>

        <div className="pp-sections">
          {sections.map((section, index) => (
            <div key={index} className="pp-row">
              <div className="pp-left">
                <h2>{section.heading}</h2>
              </div>
              <div className="pp-right">{section.content}</div>
              <div className="pp-divider" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TermsAndCondition;
