"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import "../styles/zaryapreloader.css";
import { WORDMARK_PATHS } from "./zarya-wordmark-paths";

const MINIMUM_DISPLAY_MS = 3000;
const PRELOADER_INTERVAL_MS = 5 * 60 * 60 * 1000;
const SESSION_KEY = "zaryaPreloader";

export default function ZaryaPreloader({ children, waitForHero = false, alwaysShow = false }) {
  const overlay = useRef(null);
  const logo = useRef(null);
  const progress = useRef(null);
  const shouldAnimate = useRef(true);
  const [sessionChecked, setSessionChecked] = useState(alwaysShow);
  const [visible, setVisible] = useState(alwaysShow);

  useLayoutEffect(() => {
    if (alwaysShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-paint session gate prevents loader flicker
      setSessionChecked(true);
      return;
    }
    try {
      const lastShownAt = Number(window.sessionStorage.getItem(SESSION_KEY));
      const isWithinInterval = Number.isFinite(lastShownAt)
        && lastShownAt > 0
        && Date.now() - lastShownAt < PRELOADER_INTERVAL_MS;

      if (isWithinInterval) {
        shouldAnimate.current = false;
        setVisible(false);
        setSessionChecked(true);
        return;
      }
      window.sessionStorage.setItem(SESSION_KEY, String(Date.now()));
      setSessionChecked(true);
    } catch {
      // Storage can be unavailable in strict privacy modes; show the loader normally.
      setSessionChecked(true);
    }
  }, [alwaysShow]);

  useEffect(() => {
    if (!shouldAnimate.current) return;
    if (!overlay.current || !logo.current || !progress.current) return;
    const overlayNode = overlay.current;
    const logoNode = logo.current;
    const progressNode = progress.current;
    const previousOverflow = document.body.style.overflow;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    const logoPaths = Array.from(logoNode.querySelectorAll("path"));
    document.body.style.overflow = "hidden";

    logoPaths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        fill: "rgba(247, 242, 232, 0)",
        stroke: "#d0a44e",
        strokeWidth: 2,
        strokeDasharray: length,
        strokeDashoffset: reducedMotion ? 0 : length,
      });
    });

    const counter = { value: 0 };
    const updateCount = () => {
      progressNode.textContent = String(Math.round(counter.value));
      overlayNode.style.setProperty("--loader-progress", `${counter.value}%`);
    };

    const intro = gsap.timeline();
    intro
      .fromTo(logoNode, { autoAlpha: 0 }, {
        autoAlpha: 1, duration: reducedMotion ? 0 : 0.35, ease: "power1.out",
      })
      .to(logoPaths, {
        strokeDashoffset: 0,
        duration: reducedMotion ? 0 : 1.25,
        stagger: reducedMotion ? 0 : 0.045,
        ease: "power2.inOut",
      }, 0.12)
      .to(counter, {
        value: 92,
        duration: reducedMotion ? 0 : waitForHero ? 4.8 : 2.2,
        ease: "power1.out",
        onUpdate: updateCount,
      }, 0);

    let completed = false;
    let finishTimeline;
    let minimumTimer;
    const completeAnimation = () => {
      if (completed) return;
      completed = true;
      finishTimeline = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = previousOverflow;
          setVisible(false);
        },
      });
      finishTimeline
        .to(counter, { value: 100, duration: reducedMotion ? 0 : 0.75, ease: "power2.inOut", onUpdate: updateCount })
        .to(logoPaths, {
          fill: "#f7f2e8",
          stroke: "rgba(208, 164, 78, 0)",
          duration: reducedMotion ? 0 : 0.75,
          ease: "power2.inOut",
        }, "<")
        .to(overlayNode, { yPercent: -100, duration: reducedMotion ? 0 : 0.8, ease: "power3.inOut" }, ">+0.12");
    };
    const finishWhenMinimumTimeHasPassed = () => {
      const remaining = Math.max(0, MINIMUM_DISPLAY_MS - (performance.now() - startedAt));
      minimumTimer = window.setTimeout(completeAnimation, remaining);
    };

    if (waitForHero) {
      window.addEventListener("zarya:hero-ready", finishWhenMinimumTimeHasPassed, { once: true });
      if (document.documentElement.dataset.zaryaHeroReady === "true") finishWhenMinimumTimeHasPassed();
    } else intro.eventCallback("onComplete", finishWhenMinimumTimeHasPassed);

    // Avoid trapping the visitor if a remote banner fails to respond.
    const safetyTimer = window.setTimeout(finishWhenMinimumTimeHasPassed, waitForHero ? 12000 : 5000);

    return () => {
      intro.kill();
      finishTimeline?.kill();
      window.clearTimeout(minimumTimer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("zarya:hero-ready", finishWhenMinimumTimeHasPassed);
      document.body.style.overflow = previousOverflow;
    };
  }, [waitForHero, alwaysShow]);

  return (
    <>
      {children}
      {sessionChecked && visible && (
        <div className="zarya-loader" ref={overlay} role="status" aria-label="Loading Zarya Style">
          <div className="zarya-loader__eyebrow"><span>ZARYA STYLE</span><i aria-hidden="true" /><span>PAKISTAN</span></div>
          <div className="zarya-loader__center">
            <svg ref={logo} className="zarya-loader__logo" viewBox="0 0 5011 1050" role="img" aria-label="Zarya Style" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(65 815) scale(1 -1)">
                {WORDMARK_PATHS.map((path, index) => <path key={index} d={path.d} transform={path.transform} />)}
              </g>
            </svg>
            <p>EVERYDAY &amp; OCCASION WEAR</p>
          </div>
          <div className="zarya-loader__footer">
            <span className="zarya-loader__count"><span ref={progress}>0</span><small>%</small></span>
          </div>
          <div className="zarya-loader__rule" aria-hidden="true" />
        </div>
      )}
    </>
  );
}
