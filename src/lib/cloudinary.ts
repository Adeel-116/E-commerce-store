const CLOUDINARY_IMAGE_UPLOAD =
  /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/i;

/** Add Cloudinary's automatic format and quality delivery transformations. */
export function optimizeCloudinaryUrl(url: string): string {
  const match = url.match(CLOUDINARY_IMAGE_UPLOAD);
  if (!match) return url;

  const [, uploadPrefix, assetPath] = match;
  const transformationPath = assetPath.split(/\/v\d+\//, 1)[0];
  const hasAutoFormat = /(?:^|[,/])f_auto(?:[,/]|$)/.test(transformationPath);
  const hasAutoQuality = /(?:^|[,/])q_auto(?:[,/]|$)/.test(transformationPath);
  const missing = [
    !hasAutoFormat && "f_auto",
    !hasAutoQuality && "q_auto",
  ].filter(Boolean);

  return missing.length
    ? `${uploadPrefix}${missing.join(",")}/${assetPath}`
    : url;
}

/** Normalize Cloudinary URLs anywhere inside a JSON API response. */
export function optimizeCloudinaryData<T>(value: T): T {
  if (typeof value === "string") return optimizeCloudinaryUrl(value) as T;
  if (Array.isArray(value)) return value.map(optimizeCloudinaryData) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, optimizeCloudinaryData(child)]),
    ) as T;
  }
  return value;
}
