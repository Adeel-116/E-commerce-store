import React from "react";
import "../styles/FooterTab.css";
import { Truck, ShieldCheck, UserRoundCheck } from "lucide-react";

const tabs = [
  {
    icon: <ShieldCheck />,
    title: "Why Choose Zarya Style",
    text: "Authentic, quality stitched and unstitched clothing for men and women.",
  },
  {
    icon: <UserRoundCheck />,
    title: "Availability 24/7",
    text: "Assisting by chat, email and phone",
  },
  {
    icon: <Truck />,
    title: "Shipping Across All Pakistan",
    text: "Free shipping on all orders. Delivered in 4–6 days.",
  },
];

const FooterTab = () => {
  return (
    <section className="info-tabs-section">
      <div className="info-tabs-container">
        {tabs.map((item, index) => (
          <div className="info-tab" key={index}>
            <div className="info-tab-icon">{item.icon}</div>

            <div className="info-tab-content">
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FooterTab;
