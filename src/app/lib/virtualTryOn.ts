export type Garment = {
  id: string;
  label: string;
  image: string;
  shoulderSpan: number;
  shoulderY: number;
  hemY: number;
};

// Only prepared assets are eligible. Never overlay this dress on unrelated products.
export const PILOT_GARMENT: Garment = {
  id: "blue-floral-printed-maxi-with-organza-dupatta-2-piece",
  label: "Blue & ivory floral maxi",
  image: "/try-on/blue-floral-maxi.png",
  shoulderSpan: 0.32,
  shoulderY: 0.07,
  hemY: 0.96,
};

export function getTryOnGarment(product: { slug: string; title: string }): Garment | null {
  const configuredSlug = process.env.NEXT_PUBLIC_TRY_ON_PILOT_SLUG;
  // The catalog currently stores this product without the initial "b";
  // the existing homepage banner uses the complete spelling.
  const eligible = configuredSlug ? product.slug === configuredSlug
    : [PILOT_GARMENT.id, "lue-floral-printed-maxi-with-organza-dupatta-2-piece"].includes(product.slug);
  return eligible
    ? PILOT_GARMENT
    : null;
}

type Landmark = { x: number; y: number; visibility?: number };
export type GarmentPose = { x: number; y: number; width: number; height: number; angle: number; torso: number };

export function calculateGarmentPose(points: Landmark[], width: number, height: number): GarmentPose | null {
  const required = [11, 12, 23, 24].map((index) => points[index]);
  if (required.some((p) => !p || (p.visibility ?? 0) < 0.55 || !Number.isFinite(p.x) || !Number.isFinite(p.y))) return null;
  // Anatomical right is on the left of the unmirrored camera image.
  const [left, right, hipLeft, hipRight] = required;
  const x = (left.x + right.x) * width / 2;
  const y = (left.y + right.y) * height / 2;
  const dx = (left.x - right.x) * width;
  const dy = (left.y - right.y) * height;
  const shoulderWidth = Math.hypot(dx, dy);
  const torso = Math.hypot((hipLeft.x + hipRight.x) * width / 2 - x, (hipLeft.y + hipRight.y) * height / 2 - y);
  const angle = Math.atan2(dy, dx);
  if (torso < 30 || shoulderWidth < torso * 0.45 || Math.abs(angle) > 0.6) return null;
  const ankles = [points[27], points[28]];
  const fullBody = ankles.every((p) => p && (p.visibility ?? 0) > 0.6);
  const ankleLength = fullBody ? Math.hypot((ankles[0].x + ankles[1].x) * width / 2 - x, (ankles[0].y + ankles[1].y) * height / 2 - y) : torso * 2.8;
  return { x, y, width: shoulderWidth, height: Math.max(torso * 2.3, Math.min(torso * 3.5, ankleLength)), angle, torso };
}

export function smoothGarmentPose(previous: GarmentPose | null, next: GarmentPose, elapsedMs: number): GarmentPose {
  if (!previous) return next;
  const alpha = 1 - Math.exp(-Math.min(elapsedMs, 150) / 80);
  const mix = (a: number, b: number) => a + (b - a) * alpha;
  return { x: mix(previous.x, next.x), y: mix(previous.y, next.y), width: mix(previous.width, next.width), height: mix(previous.height, next.height), angle: mix(previous.angle, next.angle), torso: mix(previous.torso, next.torso) };
}
