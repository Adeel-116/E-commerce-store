/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const compiled = ts.transpileModule(fs.readFileSync("src/app/lib/virtualTryOn.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, process: { env: {} } };
vm.runInNewContext(compiled, context);
const { calculateGarmentPose, smoothGarmentPose, getTryOnGarment, PILOT_GARMENT } = context.exports;

function pose() {
  const points = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  points[12] = { x: 0.35, y: 0.2, visibility: 0.99 };
  points[11] = { x: 0.65, y: 0.2, visibility: 0.99 };
  points[23] = { x: 0.6, y: 0.5, visibility: 0.99 };
  points[24] = { x: 0.4, y: 0.5, visibility: 0.99 };
  return points;
}

test("front-facing shoulders produce upright pixel geometry, with inferred full dress length", () => {
  const p = calculateGarmentPose(pose(), 1000, 1000);
  assert.equal(p.x, 500);
  assert.equal(p.y, 200);
  assert.ok(Math.abs(p.width - 300) < 0.001);
  assert.equal(p.height, 840);
  assert.equal(p.angle, 0);
});

test("visible ankles anchor hem; unreliable, sideways and missing bodies hide overlay", () => {
  const points = pose();
  points[27] = { x: 0.6, y: 0.92, visibility: 0.99 };
  points[28] = { x: 0.4, y: 0.92, visibility: 0.99 };
  assert.equal(calculateGarmentPose(points, 1000, 1000).height, 720);
  points[12].visibility = 0.2;
  assert.equal(calculateGarmentPose(points, 1000, 1000), null);
  assert.equal(calculateGarmentPose([], 1000, 1000), null);
  const sideways = pose();
  sideways[11].x = 0.42;
  assert.equal(calculateGarmentPose(sideways, 1000, 1000), null);
});

test("tilted shoulders rotate the garment and temporal smoothing damps movement", () => {
  const points = pose();
  const first = calculateGarmentPose(points, 1000, 1000);
  points[11].y += 0.05;
  const next = calculateGarmentPose(points, 1000, 1000);
  assert.ok(next.angle > 0 && next.angle < 0.6);
  const smooth = smoothGarmentPose(first, next, 50);
  assert.ok(smooth.angle > first.angle && smooth.angle < next.angle);
  assert.equal(smoothGarmentPose(null, next, 50), next);
});

test("only the exact pilot product is eligible, with an explicit slug override", () => {
  assert.equal(getTryOnGarment({ slug: PILOT_GARMENT.id, title: "Maxi" }), PILOT_GARMENT);
  assert.equal(getTryOnGarment({ slug: "another-maxi", title: "Blue floral maxi" }), null);
  context.process.env.NEXT_PUBLIC_TRY_ON_PILOT_SLUG = "configured-product";
  assert.equal(getTryOnGarment({ slug: "configured-product", title: "Maxi" }), PILOT_GARMENT);
});
