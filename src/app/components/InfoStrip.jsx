import { MessageCircle, Gift, ShieldCheck } from "lucide-react";
import "../styles/home-below-strip.css"

const stripItems = [
  {
    icon: <MessageCircle />,
    title: "Free scent matching",
    text: "Chat, call or email we help you find the right bottle, 24/7.",
  },
  {
    icon: <Gift />,
    title: "Gift-wrapped, always",
    text: "Every order arrives ready to give no extra charge.",
  },
  {
    icon: <ShieldCheck />,
    title: "100% authentic",
    text: "Every bottle sealed, sourced and verified before it ships.",
  },
];

const InfoStrip = () => {
  return (
    <>
      <section className="info-strip">
        <div className="info-strip-container">
          {stripItems.map((item, index) => (
            <div className="info-strip-item" key={index}>
              <div className="info-strip-icon">{item.icon}</div>

              <div className="info-strip-content">
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        :root {
          --color-maroon: var(--brandgreen);
          --color-gold: var(--gold-soft);
          --color-white: var(--brandcream);
          --color-soft-text: rgba(255, 255, 242, 0.78);
        }

        .info-strip {
          width: 100%;
          background-color: var(--color-maroon);
          padding: 34px 20px;
        }

        .info-strip-container {
          max-width: 1220px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 42px;
        }

        .info-strip-item {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          min-width: 0;
        }

        .info-strip-icon {
          color: var(--color-gold);
          flex-shrink: 0;
          margin-top: 3px;
        }

        .info-strip-icon svg {
          width: 28px;
          height: 28px;
          stroke-width: 1.8;
        }

        .info-strip-content h4 {
          margin: 0 0 6px;
          color: var(--color-white);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
        }

        .info-strip-content p {
          margin: 0;
          color: var(--color-soft-text);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.35;
        }

        @media (max-width: 900px) {
          .info-strip {
            padding: 28px 20px;
          }

          .info-strip-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }
        }

        @media (max-width: 767px) {
          .info-strip {
            display: none;
          }
        }

        @media (max-width: 480px) {
          // .info-strip-item {
          //   gap: 14px;
          // }

          .info-strip-icon svg {
            width: 18px;
            height: 18px;
            position:relative;
            top:4px;
          }

          .info-strip-content h4 {
            font-size: 10px !important;
          }

          .info-strip-content p {
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
};

export default InfoStrip;