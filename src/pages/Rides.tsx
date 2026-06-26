import { Link } from "react-router-dom";
import { MapPin, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import XhiroHeader from "@/components/xhiro/XhiroHeader";
import XhiroBottomNav from "@/components/xhiro/XhiroBottomNav";
import RideCard from "@/components/rides/RideCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRides } from "@/hooks/useRides";
import { useTranslation } from "react-i18next";

type RouteFilter = { from: string; to: string };

const QUICK_ROUTES: RouteFilter[] = [
  { from: "Prishtina", to: "Skopje" },
  { from: "Prishtina", to: "Tirana" },
  { from: "Prishtina", to: "Prizren" },
];

const cityMatch = (value: string, target: string) => {
  const v = value.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  const aliases: Record<string, string[]> = {
    prishtina: ["prishtina", "prishtinë", "pristina"],
    skopje: ["skopje", "shkup"],
    tirana: ["tirana", "tiranë"],
    prizren: ["prizren", "prizreni"],
  };
  const list = aliases[t] ?? [t];
  return list.some((a) => v.includes(a));
};

const isToday = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

export default function Rides() {
  const { rides, loading } = useRides();
  const { t } = useTranslation();
  const [routeFilter, setRouteFilter] = useState<RouteFilter | null>(null);
  const [todayOnly, setTodayOnly] = useState(false);

  const filtered = useMemo(() => {
    return rides.filter((r) => {
      if (routeFilter && !(cityMatch(r.from_city, routeFilter.from) && cityMatch(r.to_city, routeFilter.to))) return false;
      if (todayOnly && !isToday(r.departure_time)) return false;
      return true;
    });
  }, [rides, routeFilter, todayOnly]);

  const hasActiveFilter = routeFilter !== null || todayOnly;
  const isRouteActive = (r: RouteFilter) => routeFilter?.from === r.from && routeFilter?.to === r.to;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <XhiroHeader />
      <main className="max-w-md mx-auto px-4 pt-4">
        <div className="mb-4">
          <h1 className="font-display text-3xl font-bold leading-tight">
            {t("xhiro.feedTitle", "Find a ride")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("xhiro.feedSubtitle", "Intercity trips, posted by drivers like you.")}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setTodayOnly((v) => !v)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
              todayOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {t("rides.filterToday", "Today")}
          </button>
          {QUICK_ROUTES.map((r) => {
            const active = isRouteActive(r);
            return (
              <button
                key={`${r.from}-${r.to}`}
                onClick={() => setRouteFilter(active ? null : r)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-primary/50"
                }`}
              >
                {r.from} → {r.to}
              </button>
            );
          })}
          {hasActiveFilter && (
            <button
              onClick={() => {
                setRouteFilter(null);
                setTodayOnly(false);
              }}
              className="shrink-0 px-3 py-2 rounded-full text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              {t("common.clear", "Clear")}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-10 text-center mt-2">
            <MapPin className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold">
              {hasActiveFilter
                ? t("rides.noMatch", "No rides match these filters.")
                : t("rides.emptyTitle", "No rides yet.")}
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {hasActiveFilter
                ? t("rides.tryClear", "Try clearing filters or post a new trip.")
                : t("rides.emptySubtitle", "Be the first to post a trip.")}
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/rides/new">
                <Plus className="h-4 w-4 mr-1" />
                {t("rides.post", "Post ride")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {filtered.map((r, i) => (
              <RideCard key={r.id} ride={r} index={i} variant="feed" />
            ))}
          </div>
        )}
      </main>
      <XhiroBottomNav />
    </div>
  );
}
