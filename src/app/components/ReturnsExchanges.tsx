import Link from "next/link";
import NavbarController from "./NavbarController";
import "../styles/terms-and-condition.css";

const sections = [
  ["Eligibility", <><p>We review exchange or replacement requests when an item arrives damaged, an incorrect article is delivered, or the delivered size differs from the order. Other exchange requests remain subject to approval and stock availability.</p><p><strong>Sale and promotional items are final sale</strong> unless they arrive damaged or incorrect.</p></>],
  ["Item condition", <p>The article must be unused, unworn and unwashed, with its original tags, accessories and packaging. Items showing wear, fragrance, alteration, washing or damage after delivery cannot be accepted.</p>],
  ["Report within 7 days", <p>Contact Zarya Style within seven days of delivery. Include your order number, a description of the issue, and clear photographs or an unboxing video showing the article and packaging.</p>],
  ["Exchange process", <ol><li>Contact us before sending the item.</li><li>Wait for confirmation and return instructions.</li><li>Pack the approved item securely and share its tracking details.</li><li>After inspection, we will confirm the replacement or another available resolution.</li></ol>],
  ["Shipping costs", <p>If Zarya Style sent a damaged, incorrect or wrong-size article, we will arrange an appropriate resolution. For an approved discretionary exchange, return and re-delivery charges may be payable by the customer. Parcels sent without approval may not be accepted.</p>],
  ["Refunds", <p>Approved refunds, where applicable, are returned through the original payment method. Processing time depends on the payment provider or bank. Cash-on-delivery orders will be resolved through an exchange or another method agreed with our team.</p>],
  ["Colour and presentation", <p>Colours may vary slightly because of lighting, photography and screen settings. Styling accessories shown in photographs are included only when expressly listed in the product description.</p>],
];

export default function ReturnsExchanges() {
  return <><NavbarController /><main className="pp-wrapper"><header className="pp-hero"><p className="pp-kicker">Customer Care</p><h1>Returns &amp; Exchanges</h1><p>Our policy for resolving eligible items purchased from Zarya Style within Pakistan.</p></header><div className="pp-notice"><strong>Before returning anything:</strong> contact our team and wait for approval.</div><div className="pp-sections">{sections.map(([heading, content]) => <section className="pp-row" key={heading as string}><div className="pp-left"><h2>{heading}</h2></div><div className="pp-right">{content}</div><div className="pp-divider" /></section>)}<section className="pp-row"><div className="pp-left"><h2>Contact us</h2></div><div className="pp-right"><p>Email <a href="mailto:infozaryastyle@gmail.com">infozaryastyle@gmail.com</a>, WhatsApp <a href="https://wa.me/923483935003">+92 348 3935003</a>, or use our <Link href="/contact-us">contact page</Link>.</p></div></section></div></main></>;
}
