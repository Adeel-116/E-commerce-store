const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const code = ts.transpileModule(fs.readFileSync(require.resolve("../src/lib/cloudinary.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(code, { exports: exportsObject });
const { optimizeCloudinaryUrl } = exportsObject;

test("frontend normalization preserves backend delivery URLs", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/c_limit,w_360/v123/products/maxi.jpg";
  assert.equal(optimizeCloudinaryUrl(url), url);
});
test("non Cloudinary image URLs remain unchanged", () => {
  for (const url of ["/category-maxi.avif", "https://example.com/image.jpg"]) assert.equal(optimizeCloudinaryUrl(url), url);
});
