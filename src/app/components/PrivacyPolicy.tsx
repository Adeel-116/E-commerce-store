import React from "react";
import "../../app/styles/terms-and-condition.css";
import NavbarController from "./NavbarController";

const sections = [
  {
    heading: "Information We Collect",
    content: (
      <p>
        When you place an order or create an account, we collect details
        such as your name, phone number, email, and delivery address. We
        also collect basic browsing information (like pages visited) to
        improve your shopping experience.
      </p>
    ),
  },
  {
    heading: "How We Use Your Information",
    content: (
      <p>
        We use your information to process and deliver your orders, send
        order updates via SMS/WhatsApp/email, respond to your queries, and
        occasionally share offers or new arrivals. You can opt out of
        marketing messages at any time.
      </p>
    ),
  },
  {
    heading: "Payment Information",
    content: (
      <p>
        For online payments, your card/payment details are handled directly
        by our secure payment partner — we do not store your full card
        details on our servers. Cash on Delivery orders do not require any
        payment information upfront.
      </p>
    ),
  },
  {
    heading: "Sharing of Information",
    content: (
      <p>
        We share your order details only with our courier partners (to
        deliver your parcel) and payment providers (to process payment). We
        do not sell your personal information to third parties.
      </p>
    ),
  },
  {
    heading: "Cookies",
    content: (
      <p>
        We use cookies to keep you logged in, remember items in your cart,
        and understand how visitors use our website so we can improve it.
      </p>
    ),
  },
  {
    heading: "Your Choices",
    content: (
      <p>
        You can update your account details anytime by logging into your
        profile, or contact us to request correction or deletion of your
        personal information.
      </p>
    ),
  },
  {
    heading: "Security",
    content: (
      <p>
        We take reasonable measures to protect your information, but no
        online system is 100% secure. Please avoid sharing your account
        password with anyone.
      </p>
    ),
  },
  {
    heading: "Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy occasionally. Any changes will be
        posted on this page.
      </p>
    ),
  },
  {
    heading: "Contact Us",
    content: (
      <p>
        For any privacy-related questions, email us at{" "}
        <a href="mailto:infozaryastyle@gmail.com">infozaryastyle@gmail.com</a>.
      </p>
    ),
  },
];

const PrivacyPolicy = () => {
  return (
    <>
      <NavbarController />
      <div className="pp-wrapper">
        <div className="pp-hero">
          <h1>Privacy Policy</h1>
          <p>
            At Zarya Style, we respect your privacy. This policy explains
            what information we collect when you shop with us at
            zaryastyle.com, and how we use and protect it.
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

export default PrivacyPolicy;
