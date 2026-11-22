import { Truck, PackageCheck, BadgeCheck, Gift } from "lucide-react";
import "../styles/HomePerksMarquee.css";

const PERKS: { icon: typeof Gift; text: string; code?: string }[] = [
  {
    icon: Gift,
    text: "Free Shipping & Gift on Orders Above PKR 8,000",
  },
  {
    icon: Truck,
    text: "Rs 140 Standard Delivery All Over Pakistan",
  },
  {
    icon: PackageCheck,
    text: "Cash on Delivery Available",
  },
  {
    icon: BadgeCheck,
    text: "100% Authentic & Premium Quality",
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
              {perk.code && (
                <span className="home-perks-marquee__code">{perk.code}</span>
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
}
