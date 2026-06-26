import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Shield, Zap, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/authErrors";
import { resolveRedirectFromLocation } from "@/lib/authRedirect";

const RETURNING_KEY = "shpalljet:hasLoggedInBefore";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { user, loading: authLoading, signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = useMemo(() => resolveRedirectFromLocation(location), [location]);

  const isReturning = useMemo(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(RETURNING_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  const postingIntent = from === "/sell" || from.startsWith("/rides");

  useEffect(() => {
    if (isReturning) setIsSignUp(false);
  }, [isReturning]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [authLoading, user, from, navigate]);

  const markReturning = () => {
    try {
      localStorage.setItem(RETURNING_KEY, "1");
    } catch {
      /* noop */
    }
  };

  const showAuthError = (message: string) => {
    const text = translateAuthError(message, t);
    setFieldError(text);
    toast.error(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setFieldError(t("login.fullName") + " — " + t("sell.fillRequired"));
          setLoading(false);
          return;
        }
        const { data, error } = await signUp(email.trim(), password, displayName.trim());
        if (error) {
          showAuthError(error.message);
        } else if (data?.session) {
          markReturning();
          toast.success(t("login.welcomeSuccess"));
          navigate(from, { replace: true });
        } else {
          markReturning();
          toast.success(t("login.accountCreated"));
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          showAuthError(error.message);
        } else {
          markReturning();
          toast.success(t("login.signInSuccess"));
          navigate(from, { replace: true });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("login.errors.generic");
      showAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    setFieldError(null);
    try {
      markReturning();
      const { error } = await signInWithOAuth(provider, from);
      if (error) {
        showAuthError(error.message);
        setSocialLoading(null);
      }
      // Browser redirects on success; keep loading spinner until navigation.
    } catch (err: unknown) {
      showAuthError(err instanceof Error ? err.message : t("login.errors.generic"));
      setSocialLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const headline = isSignUp
    ? t("login.welcomeNew")
    : isReturning
      ? t("login.welcomeReturning")
      : t("login.welcomeNew");

  const inputBase =
    "pl-10 h-12 bg-secondary/40 border-white/10 transition-all duration-200 " +
    "focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:border-gold/40 " +
    "focus-visible:shadow-[0_0_12px_rgba(212,175,55,0.2)]";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="block text-center mb-6">
          <span className="font-display text-3xl font-bold text-gradient-gold">{t("common.appName")}</span>
        </Link>

        <div className="glass-card rounded-2xl p-6 shadow-gold space-y-6 border border-white/5">
          <div className="text-center space-y-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{headline}</h1>
            <p className="text-sm text-white/60">{t("login.valueProp")}</p>
          </div>

          {postingIntent && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-3 text-sm text-foreground/90">
              <Package className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <p>{from.startsWith("/rides") ? t("login.continueToPostRide") : t("login.continueToPost")}</p>
            </div>
          )}

          <div className="space-y-2.5">
            <Button
              variant="outline"
              className="w-full h-12 gap-3 font-medium border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
              onClick={() => handleSocialLogin("google")}
              disabled={!!socialLoading || loading}
            >
              {socialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {t("login.continueGoogle")}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 gap-3 font-medium border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
              onClick={() => handleSocialLogin("apple")}
              disabled={!!socialLoading || loading}
            >
              {socialLoading === "apple" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              {t("login.continueApple")}
            </Button>

            <p className="text-center text-[11px] text-white/40 pt-0.5">{t("login.socialSubtext")}</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[11px] text-white/50 lowercase tracking-wide">
                {t("login.orContinueEmail")}
              </span>
            </div>
          </div>

          <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
            {fieldError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2" role="alert">
                {fieldError}
              </p>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-white/70">
                  {t("login.fullName")}
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                  <Input
                    id="name"
                    placeholder={t("login.namePlaceholder")}
                    className={inputBase}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-white/70">
                {t("login.email")}
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  className={inputBase}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs text-white/70">
                  {t("login.password")}
                </Label>
                {!isSignUp && (
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-white/50 hover:text-gold transition-colors"
                  >
                    {t("login.forgotPassword")}
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={inputBase}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !!socialLoading}
              className="w-full h-12 mt-2 font-semibold text-primary-foreground bg-gradient-to-r from-gold to-yellow-500 hover:shadow-xl hover:shadow-gold/20 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 border-0 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("login.ctaContinue")}
                </>
              ) : (
                <>
                  {t("login.ctaContinue")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-[11px] text-white/50 pt-1">{t("login.activitySignal")}</p>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setFieldError(null); }}
              className="text-sm text-white/60 hover:text-gold transition-colors"
              disabled={loading || !!socialLoading}
            >
              {isSignUp ? t("login.haveAccount") : t("login.noAccount")}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-[11px] text-white/40">
          <Shield className="h-3 w-3" />
          <Zap className="h-3 w-3" />
          <span>{t("login.trustSignals")}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
