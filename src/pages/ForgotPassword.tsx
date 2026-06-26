import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/authErrors";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPasswordForEmail } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await resetPasswordForEmail(email.trim());
      if (error) {
        toast.error(translateAuthError(error.message, t));
      } else {
        setSent(true);
        toast.success(t("forgotPassword.emailSent"));
      }
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="font-display text-2xl font-semibold tracking-tight">{t("forgotPassword.title")}</h1>
            <p className="text-sm text-white/60">{t("forgotPassword.subtitle")}</p>
          </div>

          {sent ? (
            <p className="text-sm text-center text-foreground/90">{t("forgotPassword.checkInbox")}</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-white/70">
                  {t("login.email")}
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("login.emailPlaceholder")}
                    className="pl-10 h-12 bg-secondary/40 border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-semibold"
                variant="gold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("forgotPassword.submit")}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-gold transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
