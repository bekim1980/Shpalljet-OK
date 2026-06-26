import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/authErrors";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("login.errors.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("resetPassword.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast.error(translateAuthError(error.message, t));
      } else {
        toast.success(t("resetPassword.success"));
        navigate("/", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="block text-center mb-6">
          <span className="font-display text-3xl font-bold text-gradient-gold">{t("common.appName")}</span>
        </Link>

        <div className="glass-card rounded-2xl p-6 shadow-gold space-y-6 border border-white/5">
          <div className="text-center space-y-1.5">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t("resetPassword.title")}</h1>
            <p className="text-sm text-white/60">{t("resetPassword.subtitle")}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-white/70">
                {t("resetPassword.newPassword")}
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 h-12 bg-secondary/40 border-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs text-white/70">
                {t("resetPassword.confirmPassword")}
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  className="pl-10 h-12 bg-secondary/40 border-white/10"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 font-semibold" variant="gold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("resetPassword.submit")}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
