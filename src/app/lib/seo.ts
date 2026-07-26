export const SITE_NAME = "Zarya Style";
export const SITE_URL = "https://zaryastyle.com";
export const SITE_DESCRIPTION =
  "Zarya Style is Pakistan's online destination for premium everyday and occasion wear — authentic, quality stitched and unstitched clothing featuring the latest trends for men and women.";

export const CONTACT_EMAIL = "infozaryastyle@gmail.com";
export const CONTACT_PHONE = "+923483935003";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/officialzaryastyle",
  facebook: "https://www.facebook.com/profile.php?id=61592224567912",
  tiktok: "https://www.tiktok.com/@zaryastyle",
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
