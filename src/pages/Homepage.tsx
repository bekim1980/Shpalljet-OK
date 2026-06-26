import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Store, Home, Briefcase, BriefcaseBusiness, Search, Car, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import TrendingSection from "@/components/TrendingSection";
import HomeCategoryCard from "@/components/HomeCategoryCard";
import { useVertical, type Vertical } from "@/contexts/VerticalContext";
import SEO from "@/components/SEO";
import { getSiteUrl } from "@/lib/siteUrl";

const verticalConfig: Record<
  Vertical,
  { icon: typeof Crown; gradient: string; accent: string; iconBox: string }
> = {
  luxe: {
    icon: Crown,
    gradient: "from-amber-950 via-amber-900/90 to-stone-950",
    accent: "from-amber-300/80 via-amber-400/60 to-transparent",
    iconBox: "bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/20",
  },
  market: {
    icon: Store,
    gradient: "from-slate-900 via-blue-950/95 to-black",
    accent: "from-blue-300/70 via-blue-400/50 to-transparent",
    iconBox: "bg-blue-400/15 text-blue-200 ring-1 ring-blue-300/20",
  },
  rent: {
    icon: Home,
    gradient: "from-emerald-950 via-emerald-900/90 to-stone-950",
    accent: "from-emerald-300/70 via-emerald-400/50 to-transparent",
    iconBox: "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20",
  },
  services: {
    icon: Briefcase,
    gradient: "from-violet-950 via-purple-900/90 to-stone-950",
    accent: "from-violet-300/70 via-violet-400/50 to-transparent",
    iconBox: "bg-violet-400/15 text-violet-200 ring-1 ring-violet-300/20",
  },
  jobs: {
    icon: BriefcaseBusiness,
    gradient: "from-rose-950 via-rose-900/90 to-stone-950",
    accent: "from-rose-300/70 via-rose-400/50 to-transparent",
    iconBox: "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20",
  },
};

const verticalKeys: Vertical[] = ["luxe", "market", "rent", "services", "jobs"];

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
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Shpalljet — Marketplace për Shqipëri, Kosovë, Maqedoni & Diasporë"
        description="Bli, shit, jep me qira dhe gjej shërbime, punë e udhëtime në një marketplace modern për shqiptarët kudo."
        canonical={`${getSiteUrl()}/`}
      />
      <Header />

      <section className="relative flex flex-1 flex-col overflow-hidden">
        <div className="absolute inset-0 bg-[hsl(0_0%_4%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(42_65%_55%/0.16),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_50%,hsl(220_50%_40%/0.06),transparent_50%)]" />
        <div className="absolute left-1/2 top-0 h-64 w-[min(100%,520px)] -translate-x-1/2 bg-[hsl(42,65%,55%/0.1)] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(42,65%,55%/0.25)] to-transparent" />

        <div className="relative container flex flex-1 flex-col justify-center py-10 sm:py-14 md:py-18">
          <div className="mx-auto mb-8 w-full max-w-2xl text-center sm:mb-10 md:mb-12">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-[hsl(var(--gold)/0.75)] sm:text-xs"
            >
              {t("homepage.brandName")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="font-display text-[2rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-[3.25rem]"
            >
              {t("homepage.title")
                .split(".")
                .filter(Boolean)
                .map((part, i, arr) => (
                  <span key={i}>
                    <span className={i === arr.length - 1 ? "text-gradient-gold" : undefined}>{part.trim()}</span>
                    {i < arr.length - 1 && <span className="text-white/25">.</span>}
                    {i < arr.length - 1 && " "}
                  </span>
                ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:mt-4 sm:text-base"
            >
              {t("homepage.subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-6 sm:mt-8"
            >
              <form onSubmit={handleSearch} className="mx-auto max-w-lg">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-[hsl(var(--gold))]" />
                  <input
                    type="search"
                    enterKeyHint="search"
                    placeholder={t("homepage.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="group h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.05] pl-11 pr-28 text-sm text-white placeholder:text-white/35 backdrop-blur-md transition-all focus:border-[hsl(var(--gold)/0.45)] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold)/0.2)] sm:h-[52px] sm:rounded-full sm:pr-32"
                  />
                  <button
                    type="submit"
                    disabled={searchQuery.trim().length < 2}
                    className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 items-center rounded-xl bg-gradient-gold px-4 text-xs font-semibold text-[hsl(0_0%_8%)] shadow-gold transition-all enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:right-2 sm:rounded-full sm:px-5"
                  >
                    {t("homepage.searchButton")}
                  </button>
                </div>
              </form>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-4">
                <Link
                  to="/sell"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.1)] px-5 text-sm font-semibold text-[hsl(var(--gold-light))] shadow-gold transition-all hover:bg-[hsl(var(--gold)/0.16)] active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  {t("homepage.postAd")}
                </Link>
                <Link
                  to="/browse?vertical=market"
                  onClick={() => setVertical("market")}
                  className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/75 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:scale-[0.98]"
                >
                  {t("homepage.browseMarket")}
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-4">
            {verticalKeys.map((v, i) => {
              const cfg = verticalConfig[v];
              return (
                <HomeCategoryCard
                  key={v}
                  href={`/browse?vertical=${v}`}
                  label={t(`homepage.verticals.${v}.label`)}
                  tagline={t(`homepage.verticals.${v}.tagline`)}
                  icon={cfg.icon}
                  gradient={cfg.gradient}
                  accent={cfg.accent}
                  iconBox={cfg.iconBox}
                  delay={0.28 + i * 0.05}
                  onClick={() => setVertical(v)}
                />
              );
            })}

            <HomeCategoryCard
              href="/rides"
              label={t("homepage.verticals.rides.label")}
              tagline={t("homepage.verticals.rides.tagline")}
              icon={Car}
              gradient="from-sky-950 via-sky-900/90 to-slate-950"
              accent="from-sky-300/70 via-sky-400/50 to-transparent"
              iconBox="bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/25"
              delay={0.28 + verticalKeys.length * 0.05}
              badge={t("homepage.ridesBadge")}
            />
          </div>
        </div>
      </section>

      <TrendingSection />

      <footer className="border-t border-border/50 py-6">
        <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
          <span className="font-display text-sm font-bold text-gradient-gold">{t("homepage.brandName")}</span>
          <div className="flex items-center gap-4">
            <Link to="/install" className="transition-colors hover:text-foreground">
              {t("homepage.installApp")}
            </Link>
            <p>{t("common.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
