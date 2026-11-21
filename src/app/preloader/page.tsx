"use client";

import { useState } from "react";
import Link from "next/link";
import ZaryaPreloader from "../components/ZaryaPreloader";
import "../styles/preloader-preview.css";

export default function PreloaderPreviewPage() {
  const [previewKey, setPreviewKey] = useState(0);

  return (
    <ZaryaPreloader key={previewKey} alwaysShow>
      <main className="preloader-preview">
        <div className="preloader-preview__panel">
          <p className="preloader-preview__eyebrow">Development preview</p>
          <h1>Zarya preloader</h1>
          <p>
            Review the animation, spacing, colors, typography, and responsive
            behavior here without the storefront interface behind it.
          </p>
          <div className="preloader-preview__actions">
            <button type="button" onClick={() => setPreviewKey((key) => key + 1)}>
              Replay preloader
            </button>
            <Link href="/">Return to storefront</Link>
          </div>
        </div>
      </main>
    </ZaryaPreloader>
  );
}
