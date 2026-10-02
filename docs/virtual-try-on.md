# First maxi virtual try-on

Open `/try-on` to test independently of the catalog, or open
`/shop/lue-floral-printed-maxi-with-organza-dupatta-2-piece` and click **Try It On · Live camera**.
The existing banner's spelling with `blue-` is also recognized. Only this prepared product is enabled.

Click **Allow camera & start**, allow camera access, and stand facing the camera with
shoulders, hips and ideally feet visible. Adjust width, length or vertical position if
needed. **Save try-on photo** downloads a mirrored PNG. Closing the dialog, leaving
the page or hiding the tab stops the camera. Camera permissions require localhost or
HTTPS; an HTTP LAN address cannot request camera access in ordinary browsers.

The feature uses locally hosted MediaPipe Pose Landmarker Lite (0.10.32 runtime),
one transparent garment, a mirrored camera/canvas pair, shoulder rotation, hip/ankle
length estimation and temporal smoothing. Tracking runs at most 20 times per second.
There are no camera uploads or AI API keys. Camera and tracking start only after a
customer presses the start button. Missing/low-confidence landmarks and sideways
poses hide the garment. Camera permission errors, disconnection and initialization
failures have retry paths.

This is a front-facing **2D style preview**, not size measurement or fabric simulation.
Sleeves do not articulate and hands are not masked in front of the garment. The
dupatta is deliberately excluded from this initial dress overlay. One product/one
color is prepared; changing catalog colors does not create new transparent assets.
Review the reconstructed garment's print/cut against the real product before release.

## Assets

- `public/try-on/blue-floral-maxi.png`: 1024 × 1536 PNG with real alpha transparency.
- `public/try-on/pose_landmarker_lite.task`: Google model, downloaded from
  `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`.
- `public/try-on/wasm/`: runtime files copied from the pinned
  `@mediapipe/tasks-vision@0.10.32` dependency. When upgrading the dependency, copy
  its `wasm` folder here too. The dependency is Apache-2.0 licensed.

The garment was created with the built-in imagegen tool from
`output/imagegen/references/blue-maxi.jpeg`. Prompt:

> Use case: background-extraction. Asset type: transparent PNG garment for front-facing live virtual try-on. Edit target: the supplied model photo. Isolate and reconstruct ONLY the blue-and-ivory floral long-sleeved maxi dress. Remove person, head, neck, hands, skin, shoes, dupatta/scarf, and entire scene. Preserve the original ivory fabric, blue floral vine print, blue ornamental sleeve borders, square neckline and scalloped blue hem border accurately. Reconstruct parts hidden by hands/scarf. Arrange as a symmetrical straight-on invisible mannequin garment: shoulders level, both long sleeves hanging slightly outward/downwards, narrow fitted bodice, naturally flared floor-length skirt. Complete garment centered, shoulders near 10% height, hem near 94%, widest hem within 90% width. Realistic fabric folds, no mannequin visible, no external shadows, no text. Genuine transparent alpha background, including inside neckline and gaps between sleeves and bodice; fabric itself opaque. Portrait composition.

## Product mapping and further products

`src/app/lib/virtualTryOn.ts` holds the explicit pilot product mapping and asset anchors.
If the same product's slug changes, set `NEXT_PUBLIC_TRY_ON_PILOT_SLUG` to its new
slug and restart/rebuild Next.js. This setting changes the mapping, not the garment.
For another product, prepare its own transparent image and anchor measurements,
then extend the registry. Do not enable unrelated products using this dress asset.

## Checks

Run `node --test tests/virtualTryOn.test.cjs`, `npx tsc --noEmit`, and
`npx eslint src/app/components/VirtualTryOn.tsx src/app/lib/virtualTryOn.ts src/app/try-on/page.tsx`.
Browser validation should cover starting/tracking, photo downloads, fit adjustments,
permission denial/retry, mobile layout, Escape/focus, camera shutdown and reopening.
Google's API reference: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js

Completed validation: TypeScript and targeted ESLint pass; all four geometry/product
mapping tests pass. Chromium checks with a simulated webcam exercised the actual
MediaPipe model and verified rendered garment pixels, fit controls, PNG download,
camera-track shutdown, reopening, tab hiding, Escape/focus restoration, permission
denial/retry UI, mobile width and the actual catalog product's try-on dialog.
Physical-camera fit and appearance still need review on your devices. The browser
checks used Next.js Webpack development mode after a Turbopack cache error; the
production build has not been run.
