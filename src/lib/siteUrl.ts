const DEFAULT_SITE_URL = "https://cozy-connect-shop.vercel.app";

/** Production site URL for SEO and static fallbacks. */
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_URL;
}
