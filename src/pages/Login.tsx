import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = (location.state as { from?: string })?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (isSignUp) { const { error } = await signUp(email, password, displayName); if (error) { toast.error(error.message); } else { toast.success(t("login.accountCreated")); } } else { const { error } = await signIn(email, password); if (error) { toast.error(error.message); } else { navigate(from, { replace: true }); } }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (result.redirected) return; if (result.error) { toast.error(result.error.message); } else { navigate(from, { replace: true }); } } catch (err: any) { toast.error(err?.message || "Error"); }
    setSocialLoading(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-8"><span className="font-display text-3xl font-bold text-gradient-gold">{t("common.appName")}</span></Link>
        <div className="glass-card rounded-xl p-6 shadow-gold space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-display text-xl font-semibold">{isSignUp ? t("login.createAccount") : t("login.welcomeBack")}</h1>
            <p className="text-sm text-muted-foreground">{isSignUp ? t("login.joinMarket") : t("login.signInToAccount")}</p>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-11 gap-3 font-medium border-border/60 hover:bg-secondary/60" onClick={() => handleSocialLogin("google")} disabled={!!socialLoading || loading}>
              {socialLoading === "google" ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>)}
              {t("login.continueGoogle")}
            </Button>
            <Button variant="outline" className="w-full h-11 gap-3 font-medium border-border/60 hover:bg-secondary/60" onClick={() => handleSocialLogin("apple")} disabled={!!socialLoading || loading}>
              {socialLoading === "apple" ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>)}
              {t("login.continueApple")}
            </Button>
          </div>
          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span></div></div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {isSignUp && (<div className="space-y-2"><Label htmlFor="name">{t("login.fullName")}</Label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="name" placeholder={t("login.namePlaceholder")} className="pl-9 bg-secondary/50" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></div></div>)}
            <div className="space-y-2"><Label htmlFor="email">{t("login.email")}</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" placeholder={t("login.emailPlaceholder")} className="pl-9 bg-secondary/50" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
            <div className="space-y-2"><Label htmlFor="password">{t("login.password")}</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" placeholder="••••••••" className="pl-9 bg-secondary/50" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div></div>
            <Button variant="gold" className="w-full" type="submit" disabled={loading || !!socialLoading}>{loading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<>{isSignUp ? t("login.signUpButton") : t("login.loginButton")}<ArrowRight className="ml-2 h-4 w-4" /></>)}</Button>
          </form>
          <div className="text-center"><button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-muted-foreground hover:text-primary transition-colors">{isSignUp ? t("login.haveAccount") : t("login.noAccount")}</button></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
