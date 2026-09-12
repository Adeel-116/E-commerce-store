import Link from "next/link";
import NavbarController from "./NavbarController";
import "../styles/terms-and-condition.css";

const sections = [
  ["Order processing", <p>Orders are reviewed and prepared after successful placement and any required confirmation. Processing normally takes 1–2 business days. Sales, launches and public holidays may require additional time.</p>],
  ["Delivery within Pakistan", <p>Standard delivery usually takes 5–8 business days after processing, depending on the destination and courier network. The current standard charge shown across our store is Rs. 140; the final charge displayed at checkout will apply.</p>],
  ["Order tracking", <p>When tracking is available, it is shared through the contact details provided at checkout. Please ensure your phone number and delivery address are complete and accurate.</p>],
  ["Delivery attempts", <p>The courier may contact you before delivery. If delivery fails because the recipient is unavailable, the address is incomplete, or the parcel is refused, re-delivery charges may apply.</p>],
  ["Delays", <p>Delivery dates are estimates rather than guarantees. Zarya Style is not responsible for delays caused by courier disruption, weather, public holidays, security conditions, incorrect customer details or other circumstances outside our reasonable control.</p>],
  ["Inspection on arrival", <p>Please inspect the parcel promptly. If it is damaged, incorrect or incomplete, contact us within seven days and retain the original packaging. See our <Link href="/returns-and-exchanges">Returns &amp; Exchanges Policy</Link> for the claim process.</p>],
];

export default function ShippingPolicy() {
  return <><NavbarController /><main className="pp-wrapper"><header className="pp-hero"><p className="pp-kicker">Customer Care</p><h1>Shipping Policy</h1><p>How Zarya Style processes and delivers orders within Pakistan.</p></header><div className="pp-sections">{sections.map(([heading, content]) => <section className="pp-row" key={heading as string}><div className="pp-left"><h2>{heading}</h2></div><div className="pp-right">{content}</div><div className="pp-divider" /></section>)}<section className="pp-row"><div className="pp-left"><h2>Need help?</h2></div><div className="pp-right"><p>Email <a href="mailto:infozaryastyle@gmail.com">infozaryastyle@gmail.com</a>, WhatsApp <a href="https://wa.me/923483935003">+92 348 3935003</a>, or visit our <Link href="/contact-us">contact page</Link>.</p></div></section></div></main></>;
}
