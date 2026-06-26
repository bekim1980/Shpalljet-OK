import {
  Bookmark,
  Flag,
  MessageCircle,
  Share2,
  Ticket,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { Ride } from "@/hooks/useRides";
import { splitDeparture } from "@/lib/rideDetailFormat";
import { seatsBadgeVariant } from "@/lib/rideHelpers";
import ReportDialog from "@/components/ReportDialog";

export interface RideBookingPanelProps {
  ride: Ride;
  isOwn: boolean;
  isSaved: boolean;
  contacting: boolean;
  user: { id: string } | null;
  onReserve: () => void;
  onContact: () => void;
  onShare: () => void;
  onToggleSave: () => void;
  className?: string;
  layout?: "sidebar" | "inline" | "sticky";
}

const RideBookingPanel = ({
  ride,
  isOwn,
  isSaved,
  contacting,
  user,
  onReserve,
  onContact,
  onShare,
  onToggleSave,
  className = "",
  layout = "sidebar",
}: RideBookingPanelProps) => {
  const { t } = useTranslation();
  const { date, time } = splitDeparture(ride.departure_time);
  const seats = seatsBadgeVariant(ride.seats_available);

  if (isOwn) return null;

  const shell =
    layout === "sticky"
      ? "border-t border-border bg-background/95 p-3 backdrop-blur-md"
      : "rounded-2xl border border-border/60 bg-card/90 p-5 shadow-lg backdrop-blur-sm";

  return (
    <div className={className}>
      <div className={shell}>
        {layout !== "sticky" && (
          <div className="mb-4 space-y-2 border-b border-border/40 pb-4">
            {ride.price != null && (
              <p className="font-display text-3xl font-bold tracking-tight text-primary">
                €{Number(ride.price).toFixed(0)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {t("rides.perSeat", "per seat")}
                </span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">{date}</p>
            <p className="text-sm font-medium">{time}</p>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                seats.className || "border-border bg-secondary text-muted-foreground"
              }`}
            >
              {ride.seats_available} / {ride.seats_total} {t("rides.seatsAvailable", "seats available")}
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          <Button
            size="lg"
            className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-md hover:bg-primary/90 active:scale-[0.98] transition-transform"
            onClick={onReserve}
            disabled={contacting || ride.seats_available < 1}
          >
            <Ticket className="h-5 w-5" />
            {user ? t("rides.reserveSeat", "Reserve seat") : t("rides.loginToReserve", "Log in to reserve")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-xl border-border/70 text-base font-semibold hover:bg-secondary/50 active:scale-[0.98] transition-transform"
            onClick={onContact}
            disabled={contacting}
          >
            <MessageCircle className="h-5 w-5" />
            {user ? t("rides.contactDriver", "Contact driver") : t("rides.loginToMessage", "Log in to message driver")}
          </Button>
        </div>

        {layout !== "sticky" && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/40 pt-4">
            <Button variant="ghost" size="sm" className="h-10 flex-col gap-1 text-xs" onClick={onShare}>
              <Share2 className="h-4 w-4" />
              {t("rides.shareRide", "Share")}
            </Button>
            <Button variant="ghost" size="sm" className="h-10 flex-col gap-1 text-xs" onClick={onToggleSave}>
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
              {isSaved ? t("rides.saved", "Saved") : t("rides.saveRide", "Save")}
            </Button>
            <ReportDialog
              reportedType="ride"
              reportedId={ride.id}
              triggerVariant="button"
              triggerLabel={t("rides.report", "Report")}
              triggerIcon={Flag}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RideBookingPanel;
