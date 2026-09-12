"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "../styles/VideoSlider.css";

const videos = [
  { id: 1, src: "/videos/clothing-video-1.mp4" },
  { id: 2, src: "/videos/clothing-video-2.mp4" },
  { id: 3, src: "/videos/clothing-video-3.mp4" },
];

const REPEATS = 3;
const slides = Array.from({ length: videos.length * REPEATS }, (_, i) => ({
  instanceId: i,
  video: videos[i % videos.length],
}));

const VideoSlider = ({ title = "WATCH AND BUY" }: { title?: string }) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const [mutedIds, setMutedIds] = useState<Set<number>>(
    () => new Set(slides.map((s) => s.instanceId))
  );
  const [activeLogical, setActiveLogical] = useState(0);

  const VIDEO_WINDOW = 2;

  const syncActiveVideo = useCallback((swiper: SwiperType) => {
    const activeIndex = swiper.realIndex;
    slides.forEach((s) => {
      const el = videoRefs.current[s.instanceId];
      if (!el) return;

      const rawDistance = Math.abs(s.instanceId - activeIndex);
      const distance = Math.min(rawDistance, slides.length - rawDistance);
      const withinWindow = distance <= VIDEO_WINDOW;

      if (!withinWindow) {
        if (el.hasAttribute("src")) {
          el.pause();
          el.removeAttribute("src");
          el.load();
        }
        return;
      }

      if (el.getAttribute("src") !== s.video.src) {
        el.src = s.video.src;
        el.load();
      }

      if (s.instanceId === activeIndex) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
    setActiveLogical(activeIndex % videos.length);
  }, []);

  const toggleMute = useCallback((instanceId: number) => {
    const el = videoRefs.current[instanceId];
    if (!el) return;
    const nextMuted = !el.muted;
    el.muted = nextMuted;
    setMutedIds((prev) => {
      const next = new Set(prev);
      if (nextMuted) next.add(instanceId);
      else next.delete(instanceId);
      return next;
    });
  }, []);

  const dots = useMemo(() => videos.map((_, i) => i), []);

  return (
    <div className="vs-section">
      <div className="vs-section-header">
        <div className="vs-section-eyebrow">
          <span className="vs-section-eyebrow-line" />
          <p className="vs-section-eyebrow-text">Style In Motion</p>
          <span className="vs-section-eyebrow-line" />
        </div>
        <h2 className="vs-section-title">{title}</h2>
        <p className="vs-section-subtitle">
          See every drape and detail come to life, then shop the look in one tap.
        </p>
      </div>

      <div className="vs-wrapper">
        <Swiper
          modules={[Navigation]}
          centeredSlides
          loop
          speed={550}
          grabCursor
          slidesPerView="auto"
          spaceBetween={10}
          watchOverflow
          navigation={{ prevEl: ".vs-arrow-left", nextEl: ".vs-arrow-right" }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onInit={(swiper) => syncActiveVideo(swiper)}
          onSlideChange={(swiper) => syncActiveVideo(swiper)}
          className="vs-swiper"
        >
          {slides.map((s) => (
            <SwiperSlide key={s.instanceId}>
              <div className="vs-card">
                <video
                  ref={(el) => {
                    videoRefs.current[s.instanceId] = el;
                  }}
                  className="vs-video"
                  muted
                  loop
                  playsInline
                  preload="none"
                />
                <div className="vs-card-scrim" />
                <div className="vs-card-caption">
                  <span className="vs-card-caption-index">
                    {String((s.instanceId % videos.length) + 1).padStart(2, "0")}
                    <em>/{String(videos.length).padStart(2, "0")}</em>
                  </span>
                  <span className="vs-card-caption-text">Shop This Look</span>
                </div>
                <button
                  className="vs-mute-btn"
                  aria-label={mutedIds.has(s.instanceId) ? "Unmute video" : "Mute video"}
                  onClick={() => toggleMute(s.instanceId)}
                >
                  {mutedIds.has(s.instanceId) ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>
              </div>
            </SwiperSlide>
          ))}

          <button className="vs-arrow-button vs-arrow-left" aria-label="Previous">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button className="vs-arrow-button vs-arrow-right" aria-label="Next">
            <ChevronRight aria-hidden="true" />
          </button>

          <div className="vs-pagination">
            {dots.map((i) => (
              <button
                key={i}
                className={`vs-pagination-bullet${activeLogical === i ? " vs-pagination-bullet--active" : ""}`}
                aria-label={`Go to video ${i + 1}`}
                onClick={() => swiperRef.current?.slideToLoop(i)}
              />
            ))}
          </div>
        </Swiper>
      </div>
    </div>
  );
};

export default VideoSlider;
