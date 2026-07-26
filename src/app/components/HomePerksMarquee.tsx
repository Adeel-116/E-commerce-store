import { Truck, Gift, Award, ShieldCheck } from "lucide-react";
import "../styles/HomePerksMarquee.css";
import { FREE_SHIPPING_THRESHOLD } from "../lib/shipping";

const PERKS = [
  {
    icon: Truck,
    text: "Delivery in 5–8 Days Across All Pakistan",
  },
  {
    icon: ShieldCheck,
    text: `Free Shipping on Orders Over Rs. ${FREE_SHIPPING_THRESHOLD.toLocaleString("en-PK")}`,
  },
  {
    icon: Gift,
    text: "Weekly Rewards & Free Gifts for Subscribers",
  },
  {
    icon: Award,
    text: "Authentic, Quality-Checked Clothing",
  },
];

export default function HomePerksMarquee() {
  const track = [...PERKS, ...PERKS, ...PERKS];

  return (
    <section className="home-perks-marquee" aria-label="Shopping perks">
      <div className="home-perks-marquee__track">
        {track.map((perk, index) => {
          const Icon = perk.icon;
          return (
            <span className="home-perks-marquee__item" key={index}>
              <Icon className="home-perks-marquee__icon" size={18} />
              {perk.text}
            </span>
          );
        })}
      </div>
    </section>
  );
}
