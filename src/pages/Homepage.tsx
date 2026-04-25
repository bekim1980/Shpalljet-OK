import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Store, Home, Briefcase, ArrowRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import TrendingSection from "@/components/TrendingSection";
import { useVertical, type Vertical } from "@/contexts/VerticalContext";

const verticalIcons: Record<Vertical, { icon: React.ElementType; gradient: string; iconBg: string }> = {
  luxe: { icon: Crown, gradient: "from-amber-950 via-amber-900/80 to-stone-950", iconBg: "bg-amber-400/15 text-amber-400" },
  market: { icon: Store, gradient: "from-blue-950 via-blue-900/80 to-slate-950", iconBg: "bg-blue-400/15 text-blue-400" },
  rent: { icon: Home, gradient: "from-emerald-950 via-emerald-900/80 to-gray-950", iconBg: "bg-emerald-400/15 text-emerald-400" },
  services: { icon: Briefcase, gradient: "from-violet-950 via-purple-900/80 to-gray-950", iconBg: "bg-violet-400/15 text-violet-400" },
};

const verticalKeys: Vertical[] = ["luxe", "market", "rent", "services"];

const Homepage = () => {
  const { setVertical } = useVertical();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden flex-1 flex flex-col">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(42,30%,8%)] via-background to-[hsl(42,20%,6%)]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(42,65%,55%/0.06)] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[hsl(42,50%,40%/0.04)] rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(42,65%,55%/0.2)] to-transparent" />

        <div className="relative container flex-1 flex flex-col justify-center py-12 md:py-20">
          <div className="text-center space-y-4 mb-8 md:mb-10">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tracking-[0.3em] uppercase text-muted-foreground font-medium"
            >
              <span className="text-4xl md:text-6xl font-display font-bold text-gradient-gold tracking-wide">{t("homepage.brandName")}</span>
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl md:text-5xl font-bold leading-tight"
            >
              {t("homepage.title")}
              <span className="block text-gradient-gold">{t("homepage.highlight")}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-muted-foreground text-sm md:text-base max-w-md mx-auto"
            >
              {t("homepage.subtitle")}
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleSearch}
              className="max-w-lg mx-auto mt-2"
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder={t("homepage.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-full bg-card/60 backdrop-blur-md border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all text-sm"
                />
                {searchQuery.trim().length >= 2 && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    {t("homepage.searchButton")}
                  </button>
                )}
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-4 flex justify-center"
            >
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-base md:text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
              >
                <span className="text-xl">+</span>
                {t("homepage.postAd", "Posto Shpallje")}
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
            {verticalKeys.map((v, i) => {
              const cfg = verticalIcons[v];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={v}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08, duration: 0.45 }}
                >
                  <Link
                    to="/browse"
                    onClick={() => setVertical(v)}
                    className={`block relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.gradient} p-6 md:p-8 aspect-[2/1] sm:aspect-[4/3] flex flex-col justify-between group transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/30 border border-white/[0.06]`}
                  >
                    <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                    <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl ${cfg.iconBg} flex items-center justify-center`}>
                      <Icon className="h-7 w-7 md:h-8 md:w-8" />
                    </div>
                    <div className="relative mt-auto">
                      <h3 className="font-display text-xl md:text-3xl font-bold text-white tracking-wide">
                        {t(`homepage.verticals.${v}.label`)}
                      </h3>
                      <p className="text-sm md:text-base text-white/50 mt-1">{t(`homepage.verticals.${v}.tagline`)}</p>
                    </div>
                    <ArrowRight className="absolute bottom-6 right-6 md:bottom-8 md:right-8 h-5 w-5 md:h-6 md:w-6 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <TrendingSection />

      <footer className="border-t border-border/50 py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="font-display text-gradient-gold font-bold text-sm">{t("homepage.brandName")}</span>
          <div className="flex items-center gap-4">
            <Link to="/install" className="hover:text-foreground transition-colors">{t("homepage.installApp")}</Link>
            <p>{t("common.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
