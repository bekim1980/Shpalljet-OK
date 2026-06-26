/** Blocks open redirects and auth-loop paths. */
export function resolveSafeRedirect(candidate: string | null | undefined): string {
  if (!candidate || typeof candidate !== "string") return "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  if (candidate.startsWith("/login") || candidate.startsWith("/auth/callback")) return "/";
  return candidate;
}

export function resolveRedirectFromLocation(location: {
  state: unknown;
  search: string;
}): string {
  const stateFrom = (location.state as { from?: string } | null)?.from;
  const queryFrom = new URLSearchParams(location.search).get("redirect");
  return resolveSafeRedirect(stateFrom || queryFrom || "/");
}

/** OAuth / email confirmation callback URL with optional post-auth redirect. */
export function buildAuthCallbackUrl(returnTo: string, type?: "recovery"): string {
  const safe = resolveSafeRedirect(returnTo);
  const params = new URLSearchParams();
  if (safe !== "/") params.set("redirect", safe);
  if (type) params.set("type", type);
  const qs = params.toString();
  return `${window.location.origin}/auth/callback${qs ? `?${qs}` : ""}`;
}
