import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { Ride } from "@/hooks/useRides";
import { isLeavingSoon, isPopularRoute, timeAgo, seatsBadgeVariant } from "@/lib/rideHelpers";
import { splitDeparture } from "@/lib/rideDetailFormat";

interface RideCardProps {
  ride: Ride;
  index?: number;
  variant?: "feed" | "compact";
}

const RideCard = ({ ride, index = 0, variant = "feed" }: RideCardProps) => {
  const { t } = useTranslation();
  const soon = isLeavingSoon(ride.departure_time);
  const popular = isPopularRoute(ride.from_city, ride.to_city);
  const seats = seatsBadgeVariant(ride.seats_available);
  const { shortDate, time } = splitDeparture(ride.departure_time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link to={`/rides/${ride.id}`} className="group block">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm transition-all duration-300 hover:border-primary/35 hover:shadow-md active:scale-[0.99]">
          {(soon || popular) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {soon && (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  {t("rides.leavingSoon", "Leaving soon")}
                </span>
              )}
              {popular && (
                <span className="inline-flex items-center gap-0.5 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  <Sparkles className="h-3 w-3" />
                  {t("rides.popularRoute", "Popular route")}
                </span>
              )}
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                <span className="truncate">{ride.from_city}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                <span className="truncate">{ride.to_city}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {shortDate} · {time}
                </span>
                {ride.driver_name && variant === "feed" && <span>· {ride.driver_name}</span>}
                {variant === "feed" && <span>· {timeAgo(ride.created_at)}</span>}
              </div>
              {variant === "feed" && ride.notes && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{ride.notes}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {ride.price != null && (
                <span className="rounded-full bg-primary px-2.5 py-1 text-sm font-bold text-primary-foreground shadow-sm">
                  €{Number(ride.price).toFixed(0)}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  seats.className || "border-border bg-secondary text-muted-foreground"
                }`}
              >
                <Users className="h-3 w-3" />
                {ride.seats_available}/{ride.seats_total}
              </span>
            </div>
          </div>

          {variant === "feed" && (
            <Button
              className="mt-3 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              tabIndex={-1}
            >
              {t("rides.viewRide", "View ride")}
            </Button>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default RideCard;
