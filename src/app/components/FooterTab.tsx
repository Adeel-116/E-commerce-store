import React from "react";
import "../styles/FooterTab.css";
import { Truck, ShieldCheck, UserRoundCheck, CreditCard } from "lucide-react";

const tabs = [
  {
    icon: <ShieldCheck />,
    title: "Why Choose Monk Perfume",
    text: "Monk Scents offers authentic niche and designer perfumes for men and women, featuring rare and luxurious scents from around the world.",
  },
  {
    icon: <UserRoundCheck />,
    title: "Availability 24/7",
    text: "Assisting by chat, email and phone",
  },
  {
  
    icon: <Truck />,
    title: "Convenient Shipping on All Orders",
    text: "We prioritize getting your order to you fast.",
  },
  
  
  {
    icon: <CreditCard />,
    title: "Secured Payment Options",
    text: "Visa, Discover, Mastercard, Amex, G Pay and Apple Pay",
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
