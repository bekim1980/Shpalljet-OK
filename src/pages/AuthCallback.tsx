import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { resolveSafeRedirect } from "@/lib/authRedirect";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      const params = new URLSearchParams(window.location.search);
      const redirect = resolveSafeRedirect(params.get("redirect"));
      const type = params.get("type");
      const code = params.get("code");
      const authError = params.get("error_description") || params.get("error");

      if (authError) {
        if (!cancelled) setError(authError);
        return;
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!cancelled) setError(exchangeError.message);
            return;
          }
        } else {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            if (!cancelled) setError(sessionError.message);
            return;
          }
          if (!session) {
            if (!cancelled) setError(t("authCallback.noSession"));
            return;
          }
        }

        if (cancelled) return;

        if (type === "recovery") {
          navigate("/reset-password", { replace: true });
          return;
        }

        navigate(redirect, { replace: true });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("authCallback.genericError"));
        }
      }
    }

    completeAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
        <h1 className="font-display text-xl font-semibold">{t("authCallback.failed")}</h1>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Button variant="gold" asChild>
          <Link to="/login">{t("common.login")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{t("authCallback.signingIn")}</p>
    </div>
  );
};

export default AuthCallback;
