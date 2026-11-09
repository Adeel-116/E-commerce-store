"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  useEffect(() => {
    const stop = () => lenisRef.current?.stop();
    const start = () => lenisRef.current?.start();
    window.addEventListener("lenis:stop", stop);
    window.addEventListener("lenis:start", start);
    return () => {
      window.removeEventListener("lenis:stop", stop);
      window.removeEventListener("lenis:start", start);
    };
  }, []);

  return <>{children}</>;
}
