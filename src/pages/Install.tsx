import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Check, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";

interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }>; }

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream);
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === "accepted") setIsInstalled(true); setDeferredPrompt(null); };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-lg py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center"><Smartphone className="h-10 w-10 text-primary" /></div>
          <h1 className="font-display text-3xl font-bold">{t("install.title")}</h1>
          <p className="text-muted-foreground">{t("install.subtitle")}</p>
        </motion.div>

        {isInstalled ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-8 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"><Check className="h-8 w-8 text-primary" /></div>
            <h2 className="font-display text-xl font-semibold">{t("install.installed")}</h2>
            <p className="text-sm text-muted-foreground">{t("install.installedDesc")}</p>
          </motion.div>
        ) : deferredPrompt ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Button variant="gold" size="lg" className="w-full" onClick={handleInstall}><Download className="h-5 w-5 mr-2" />{t("install.installNow")}</Button>
          </motion.div>
        ) : isIos ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">{t("install.iosTitle")}</h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">1</span><span>{t("install.iosStep1")}</span></li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">2</span><span>{t("install.iosStep2")}</span></li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">3</span><span>{t("install.iosStep3")}</span></li>
            </ol>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("install.browserHint")}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {[
            { title: t("install.featureQuick"), desc: t("install.featureQuickDesc") },
            { title: t("install.featureOffline"), desc: t("install.featureOfflineDesc") },
            { title: t("install.featureNotifications"), desc: t("install.featureNotificationsDesc") },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Check className="h-5 w-5 text-primary" /></div>
              <div><p className="font-medium text-sm">{f.title}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Install;
