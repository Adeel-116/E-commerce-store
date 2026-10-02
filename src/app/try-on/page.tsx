"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Camera } from "lucide-react";
import { PILOT_GARMENT } from "@/app/lib/virtualTryOn";
import "@/app/styles/VirtualTryOn.css";

const VirtualTryOn = dynamic(() => import("@/app/components/VirtualTryOn"), { ssr: false });

export default function TryOnPreview() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <main className="vto-demo"><div className="vto-demo-card">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="vto-demo-image" src={PILOT_GARMENT.image} alt="Transparent blue-and-ivory floral maxi try-on garment" />
    <div><span className="vto-eyebrow">ZARYA STYLE · VIRTUAL TRY-ON</span><h1>A new way to find your look.</h1><p>Try our first maxi in your own live camera preview. The dress follows your body as you move.</p><button type="button" className="vto-launch" onClick={() => setOpen(true)}><Camera size={18} /> Try It On</button><p>For the best preview, stand facing the camera with your full body visible. This is a style preview; check the product size guide for measurements.</p><Link href="/shop?category=maxi">Explore the maxi collection →</Link></div>
  </div>{open && <VirtualTryOn garment={PILOT_GARMENT} productTitle={PILOT_GARMENT.label} onClose={close} />}</main>;
}
