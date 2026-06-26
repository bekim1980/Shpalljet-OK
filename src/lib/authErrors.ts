import type { TFunction } from "i18next";

/** Map common Supabase Auth messages to localized strings. */
export function translateAuthError(message: string, t: TFunction): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return t("login.errors.invalidCredentials");
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return t("login.errors.emailTaken");
  }
  if (m.includes("password") && m.includes("least")) {
    return t("login.errors.passwordTooShort");
  }
  if (m.includes("valid email") || m.includes("unable to validate email")) {
    return t("login.errors.invalidEmail");
  }
  if (m.includes("email not confirmed")) {
    return t("login.errors.emailNotConfirmed");
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return t("login.errors.rateLimit");
  }
  if (m.includes("network") || m.includes("fetch")) {
    return t("login.errors.network");
  }

  return message;
}
