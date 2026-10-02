"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Download, RotateCcw, X } from "lucide-react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { calculateGarmentPose, smoothGarmentPose, type Garment, type GarmentPose } from "@/app/lib/virtualTryOn";
import "@/app/styles/VirtualTryOn.css";

type Phase = "idle" | "loading" | "live" | "error";
const DEFAULT_FIT = { width: 1, length: 1, offset: 0, opacity: 1 };

function cameraError(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Camera access was blocked. Allow camera access in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera was found. Connect a camera and try again.";
  if (name === "NotReadableError") return "Your camera is busy. Close other apps using it and try again.";
  return "The camera or body tracker could not start. Check your connection and try again.";
}

export default function VirtualTryOn({ garment, productTitle, onClose }: { garment: Garment; productTitle: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cleanupRef = useRef<() => void>(() => { });
  const aliveRef = useRef(true);
  const fitRef = useRef(DEFAULT_FIT);
  const [fit, setFit] = useState(DEFAULT_FIT);
  const [phase, setPhase] = useState<Phase>("idle");
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    aliveRef.current = true;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("lenis:stop"));
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const elements = Array.from(document.querySelectorAll<HTMLElement>(".vto-dialog button:not(:disabled), .vto-dialog input"));
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const onHide = () => {
      if (!document.hidden) return;
      cleanupRef.current();
      setPhase("idle");
      setTracking(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      aliveRef.current = false;
      cleanupRef.current();
      document.body.style.overflow = previousOverflow;
      window.dispatchEvent(new Event("lenis:start"));
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
      previousFocus?.focus();
    };
  }, [onClose]);

  const updateFit = (next: typeof DEFAULT_FIT) => { fitRef.current = next; setFit(next); };

  const start = async () => {
    cleanupRef.current();
    setPhase("loading");
    setError("");
    setTracking(false);
    setSaved(false);
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: PoseLandmarker | null = null;
    let frame = 0;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const cleanup = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      detector?.close();
      detector = null;
      if (video) { video.pause(); video.srcObject = null; }
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    };
    cleanupRef.current = cleanup;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access needs HTTPS or localhost. Open this site using a secure address.");
      }
      if (!video || !canvas) throw new Error("Preview is unavailable.");
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } } });
      if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;
      const image = new Image();
      image.src = garment.image;
      await image.decode();
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks("/try-on/wasm");
      if (cancelled) return;
      // CPU works on devices without WebGL; inference is capped at 20 frames/s.
      const created = await PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: "/try-on/pose_landmarker_lite.task", delegate: "CPU" }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.55, minPosePresenceConfidence: 0.55, minTrackingConfidence: 0.55 });
      if (cancelled) { created.close(); return; }
      detector = created;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser cannot display the try-on preview.");
      let lastTime = -1;
      let lastInference = 0;
      let smoothed: GarmentPose | null = null;
      let wasTracking = false;
      setPhase("live");
      const render = (timestamp: number) => {
        if (cancelled || !detector) return;
        try {
          if (video.readyState >= 2 && video.currentTime !== lastTime && timestamp - lastInference >= 50) {
            lastTime = video.currentTime;
            const elapsed = timestamp - lastInference;
            lastInference = timestamp;
            const result = detector.detectForVideo(video, timestamp);
            const pose = calculateGarmentPose(result.landmarks[0] ?? [], canvas.width, canvas.height);
            result.close();
            context.clearRect(0, 0, canvas.width, canvas.height);
            if (!!pose !== wasTracking) { wasTracking = !!pose; setTracking(wasTracking); }
            if (pose) {
              smoothed = smoothGarmentPose(smoothed, pose, elapsed);
              const currentFit = fitRef.current;
              const drawWidth = smoothed.width / garment.shoulderSpan * currentFit.width;
              const drawHeight = smoothed.height / (garment.hemY - garment.shoulderY) * currentFit.length;
              context.save();
              context.translate(smoothed.x, smoothed.y + currentFit.offset * smoothed.torso);
              context.rotate(smoothed.angle);
              context.globalAlpha = currentFit.opacity;
              context.drawImage(image, -drawWidth / 2, -garment.shoulderY * drawHeight, drawWidth, drawHeight);
              context.restore();
            } else smoothed = null;
          }
          frame = requestAnimationFrame(render);
        } catch (err) {
          cleanup();
          if (aliveRef.current) { setTracking(false); setPhase("error"); setError(cameraError(err)); }
        }
      };
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        if (cancelled) return;
        cleanup();
        if (aliveRef.current) { setTracking(false); setPhase("error"); setError("Camera disconnected. Reconnect it and try again."); }
      });
      frame = requestAnimationFrame(render);
    } catch (err) {
      if (cancelled) return;
      cleanup();
      if (aliveRef.current) {
        setPhase("error");
        setError(err instanceof Error && err.message.startsWith("Camera access needs") ? err.message : cameraError(err));
      }
    }
  };

  const savePhoto = () => {
    const video = videoRef.current;
    const overlay = canvasRef.current;
    if (!video || !overlay || !tracking) return;
    const photo = document.createElement("canvas");
    photo.width = overlay.width; photo.height = overlay.height;
    const ctx = photo.getContext("2d");
    if (!ctx) return;
    ctx.translate(photo.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, photo.width, photo.height);
    ctx.drawImage(overlay, 0, 0);
    photo.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `${garment.id}-try-on.png`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (aliveRef.current) setSaved(true);
    }, "image/png");
  };

  return createPortal(
    <div className="vto-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="vto-dialog" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="vto-title">
        <header className="vto-header"><div><span className="vto-eyebrow">YOUR VIRTUAL FITTING ROOM</span><h2 id="vto-title">{productTitle}</h2></div><button ref={closeRef} className="vto-icon-button" type="button" onClick={onClose} aria-label="Close try-on"><X size={22} /></button></header>
        <div className="vto-layout">
          <div className="vto-stage">
            <video ref={videoRef} className="vto-video" autoPlay muted playsInline aria-label="Live camera preview" />
            <canvas ref={canvasRef} className="vto-overlay" aria-hidden="true" />
            {phase !== "live" && <div className="vto-start-panel"><Camera size={40} /><h3>{phase === "loading" ? "Preparing your fitting room…" : "See it on you"}</h3><p>{phase === "error" ? error : "Use your camera to preview this maxi. Stand back so your shoulders, hips and feet are visible."}</p><button type="button" className="vto-primary" disabled={phase === "loading"} onClick={start}>{phase === "loading" ? "Starting camera & body tracking…" : phase === "error" ? "Try again" : "Allow camera & start"}</button></div>}
            {phase === "live" && <div className={`vto-status ${tracking ? "is-tracking" : ""}`} role="status">{tracking ? "Following your movement" : "Face the camera · step back to show shoulders & hips"}</div>}
          </div>
          <aside className="vto-controls"><span className="vto-eyebrow">FIRST PRODUCT PREVIEW</span><h3>Make it your fit</h3><p>Previewing {garment.label.toLowerCase()}. Face forward, keep your arms relaxed and move slowly in good light.</p>
            {([{ key: "width", label: "Garment width", min: 0.8, max: 1.25, step: 0.01 }, { key: "length", label: "Dress length", min: 0.8, max: 1.2, step: 0.01 }, { key: "offset", label: "Vertical position", min: -0.2, max: 0.2, step: 0.01 }, { key: "opacity", label: "Garment opacity", min: 0.65, max: 1, step: 0.01 }] as const).map(({ key, label, min, max, step }) => <label className="vto-slider" key={key}><span>{label}<output>{Math.round(fit[key] * 100)}%</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={fit[key]} onChange={(event) => updateFit({ ...fit, [key]: Number(event.target.value) })} /></label>)}
            <button type="button" className="vto-secondary" onClick={() => updateFit(DEFAULT_FIT)}><RotateCcw size={16} /> Reset fit</button>
            <button type="button" className="vto-primary" disabled={phase !== "live" || !tracking} onClick={savePhoto}><Download size={17} /> Save try-on photo</button>
            <p className="vto-note" role="status">{saved ? "Photo saved to your device." : "Your camera preview stays on this device. Photos are saved only when you choose."}</p>
            <p className="vto-note">This is a 2D style preview. It does not measure your size or simulate fabric, turning or sleeve movement.</p>
          </aside>
        </div>
      </section>
    </div>, document.body,
  );
}
