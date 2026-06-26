import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Share2,
  Sparkles,
  Star,
  Ticket,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import XhiroHeader from "@/components/xhiro/XhiroHeader";
import XhiroBottomNav from "@/components/xhiro/XhiroBottomNav";
import { Button } from "@/components/ui/button";
import RideDetailSkeleton from "@/components/rides/RideDetailSkeleton";
import RideBookingPanel from "@/components/rides/RideBookingPanel";
import SimilarRidesSection from "@/components/rides/SimilarRidesSection";
import ReportDialog from "@/components/ReportDialog";
import { useRideDetail, type RideDriver } from "@/hooks/useRides";
import { useAuth } from "@/hooks/useAuth";
import { useStartConversation } from "@/hooks/useChat";
import { useSellerRating } from "@/hooks/useReviews";
import { useSavedRides } from "@/hooks/useSavedRides";
import { supabase } from "@/integrations/supabase/client";
import { isLeavingSoon, isPopularRoute, seatsBadgeVariant } from "@/lib/rideHelpers";
import { memberSince, splitDeparture } from "@/lib/rideDetailFormat";

const formatMessageDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

function DriverCard({
  driver,
  driverName,
  driverRideCount,
  sellerId,
}: {
  driver: RideDriver | null;
  driverName: string | null;
  driverRideCount: number;
  sellerId: string;
}) {
  const { t } = useTranslation();
  const { data: rating } = useSellerRating(sellerId);
  const hasRating = (rating?.count ?? 0) > 0;
  const isVerified = !!driver?.phone_number;
  const name = driver?.display_name ?? driverName ?? t("common.unknown");

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
      aria-labelledby="driver-heading"
    >
      <h2 id="driver-heading" className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t("rides.yourDriver", "Your driver")}
      </h2>
      <div className="flex gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-secondary text-xl font-bold text-muted-foreground">
          {driver?.avatar_url ? (
            <img src={driver.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold leading-tight">{name}</p>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {t("rides.verified", "Verified")}
              </span>
            )}
          </div>
          {driver?.created_at && (
            <p className="text-xs text-muted-foreground">
              {t("rides.memberSince", "Member since")} {memberSince(driver.created_at)}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {hasRating && rating && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {rating.average} · {rating.count} {t("rides.reviews", "reviews")}
              </span>
            )}
            {driverRideCount > 0 && (
              <span>
                {driverRideCount} {t("rides.ridesPosted", "rides posted")}
              </span>
            )}
          </div>
          {driver?.bio && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{driver.bio}</p>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function TripDetailsGrid({ ride }: { ride: { from_city: string; to_city: string; departure_time: string; price: number | null; seats_available: number; seats_total: number } }) {
  const { t } = useTranslation();
  const { date, time } = splitDeparture(ride.departure_time);
  const seats = seatsBadgeVariant(ride.seats_available);

  const rows = [
    { label: t("rides.departure", "Departure"), value: ride.from_city, icon: MapPin },
    { label: t("rides.arrival", "Arrival"), value: ride.to_city, icon: MapPin },
    { label: t("rides.date", "Date"), value: date, icon: Calendar },
    { label: t("rides.time", "Time"), value: time, icon: Clock },
    ride.price != null
      ? { label: t("rides.price", "Price"), value: `€${Number(ride.price).toFixed(0)}`, icon: Ticket }
      : null,
    {
      label: t("rides.seats", "Seats"),
      value: `${ride.seats_available} / ${ride.seats_total}`,
      icon: Users,
      badge: seats.className,
    },
  ].filter(Boolean) as { label: string; value: string; icon: typeof MapPin; badge?: string }[];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4 }}
      className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
      aria-labelledby="trip-details-heading"
    >
      <h2 id="trip-details-heading" className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t("rides.tripDetails", "Trip details")}
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
            <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden />
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
              <dd className={`mt-0.5 text-sm font-semibold ${row.badge ? `inline-flex rounded-full border px-2 py-0.5 text-xs ${row.badge}` : ""}`}>
                {row.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </motion.section>
  );
}

function BoostCard({ onBoost }: { onBoost: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="font-display text-lg font-bold">{t("rides.boostTitle", "Boost your ride")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("rides.boostBody", "Reach more passengers. Appear first in search results. Increase visibility for 7 days.")}
          </p>
          <Button className="mt-1 rounded-xl bg-primary font-semibold hover:bg-primary/90" onClick={onBoost}>
            {t("rides.boostCta", "Boost ride")}
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

export default function RideDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { ride, driver, driverRideCount, loading } = useRideDetail(id);
  const { user } = useAuth();
  const { startConversation } = useStartConversation();
  const { isSaved, toggle } = useSavedRides();
  const [contacting, setContacting] = useState(false);

  const isOwn = !!(user && ride && user.id === ride.user_id);
  const saved = ride ? isSaved(ride.id) : false;

  const openChat = async (prefillKey: "reserve" | "contact") => {
    if (!ride) return;
    if (!user) {
      navigate("/login", { state: { from: `/rides/${ride.id}` } });
      return;
    }
    if (user.id === ride.user_id) {
      toast.info(t("rides.ownRide", "This is your own ride"));
      return;
    }
    setContacting(true);
    const syntheticProductId = `ride:${ride.id}`;
    const result = await startConversation(syntheticProductId, ride.user_id);
    if (!result) {
      setContacting(false);
      toast.error(t("common.error", "Something went wrong"));
      return;
    }
    if (result.isNew) {
      const when = formatMessageDate(ride.departure_time);
      const content =
        prefillKey === "reserve"
          ? t(
              "rides.reserveIntro",
              `Hi, I'd like to reserve a seat on your ride: ${ride.from_city} → ${ride.to_city} on ${when}.`,
              { from: ride.from_city, to: ride.to_city, when },
            )
          : t(
              "rides.introMessage",
              `Hi, I'm interested in your ride: ${ride.from_city} → ${ride.to_city} on ${when}.`,
              { from: ride.from_city, to: ride.to_city, when },
            );
      await supabase.from("messages").insert({
        conversation_id: result.conversationId,
        sender_id: user.id,
        content,
      });
    }
    setContacting(false);
    navigate(`/messages?conversation=${result.conversationId}`);
  };

  const handleShare = async () => {
    if (!ride) return;
    const url = `${window.location.origin}/rides/${ride.id}`;
    const title = `${ride.from_city} → ${ride.to_city}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("share.copied", "Link copied!"));
      }
    } catch {
      /* user cancelled share */
    }
  };

  const handleBoost = () => {
    toast.info(t("rides.boostSoon", "Boost is coming soon — your ride will appear at the top."));
  };

  const handleToggleSave = () => {
    if (!ride) return;
    if (!user) {
      navigate("/login", { state: { from: `/rides/${ride.id}` } });
      return;
    }
    toggle(ride.id);
    toast.success(saved ? t("rides.unsaved", "Removed from saved rides") : t("rides.savedToast", "Ride saved"));
  };

  const departure = ride ? splitDeparture(ride.departure_time) : null;
  const seats = ride ? seatsBadgeVariant(ride.seats_available) : null;

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-8">
      <XhiroHeader showBack wide />

      <main className="mx-auto max-w-6xl px-4 pt-4 sm:pt-6">
        {loading ? (
          <RideDetailSkeleton />
        ) : !ride ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="font-medium">{t("rides.notFound", "Ride not found")}</p>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
            {/* Left column */}
            <div className="space-y-4 sm:space-y-5">
              {/* Hero route card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm sm:p-6"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {isLeavingSoon(ride.departure_time) && (
                    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {t("rides.leavingSoon", "Leaving soon")}
                    </span>
                  )}
                  {isPopularRoute(ride.from_city, ride.to_city) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      <Sparkles className="h-3 w-3" />
                      {t("rides.popularRoute", "Popular route")}
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <p className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl md:text-5xl">
                    {ride.from_city}
                  </p>
                  <div className="my-3 flex justify-center" aria-hidden>
                    <div className="flex flex-col items-center gap-0.5 text-primary/60">
                      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                      <span className="h-8 w-px bg-gradient-to-b from-primary/50 to-primary/10" />
                      <ArrowDown className="h-5 w-5" />
                      <span className="h-8 w-px bg-gradient-to-b from-primary/10 to-primary/50" />
                      <span className="h-2 w-2 rounded-full border-2 border-primary bg-background" />
                    </div>
                  </div>
                  <p className="font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl md:text-5xl">
                    {ride.to_city}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  {ride.price != null && (
                    <span className="rounded-full bg-primary px-4 py-1.5 text-lg font-bold text-primary-foreground shadow-md">
                      €{Number(ride.price).toFixed(0)}
                    </span>
                  )}
                  {departure && (
                    <>
                      <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        {departure.shortDate}
                      </span>
                      <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        {departure.time}
                      </span>
                    </>
                  )}
                  {seats && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                        seats.className || "border-border bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {ride.seats_available} {t("rides.seatsLeft", "seats left")}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Route timeline (mobile-friendly duplicate for clarity) */}
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.4 }}
                className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
                aria-label={t("rides.route", "Route")}
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center pt-1">
                    <span className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                    <span className="my-1 w-px flex-1 bg-gradient-to-b from-primary/40 to-border" />
                    <span className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-6 py-0.5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("rides.departure", "Departure")}
                      </p>
                      <p className="text-lg font-bold">{ride.from_city}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("rides.arrival", "Arrival")}
                      </p>
                      <p className="text-lg font-bold">{ride.to_city}</p>
                    </div>
                  </div>
                </div>
              </motion.section>

              <TripDetailsGrid ride={ride} />

              <DriverCard
                driver={driver}
                driverName={ride.driver_name ?? null}
                driverRideCount={driverRideCount}
                sellerId={ride.user_id}
              />

              {ride.notes && (
                <motion.section
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.4 }}
                  className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm"
                >
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("rides.notes", "Notes")}
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{ride.notes}</p>
                </motion.section>
              )}

              {isOwn && <BoostCard onBoost={handleBoost} />}

              {/* Mobile inline booking actions */}
              {!isOwn && (
                <div className="space-y-3 lg:hidden">
                  <RideBookingPanel
                    ride={ride}
                    isOwn={isOwn}
                    isSaved={saved}
                    contacting={contacting}
                    user={user}
                    onReserve={() => openChat("reserve")}
                    onContact={() => openChat("contact")}
                    onShare={handleShare}
                    onToggleSave={handleToggleSave}
                    layout="inline"
                  />
                </div>
              )}

              <SimilarRidesSection ride={ride} />
            </div>

            {/* Right sidebar — desktop booking */}
            {!isOwn && (
              <aside className="hidden lg:block">
                <div className="sticky top-20">
                  <RideBookingPanel
                    ride={ride}
                    isOwn={isOwn}
                    isSaved={saved}
                    contacting={contacting}
                    user={user}
                    onReserve={() => openChat("reserve")}
                    onContact={() => openChat("contact")}
                    onShare={handleShare}
                    onToggleSave={handleToggleSave}
                    layout="sidebar"
                  />
                </div>
              </aside>
            )}
          </div>
        )}
      </main>

      {/* Sticky mobile CTAs */}
      {ride && !isOwn && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              className="h-12 flex-1 rounded-xl bg-primary text-base font-semibold shadow-md"
              onClick={() => openChat("reserve")}
              disabled={contacting || ride.seats_available < 1}
            >
              <Ticket className="h-5 w-5" />
              {t("rides.reserveSeat", "Reserve seat")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl"
              onClick={handleShare}
              aria-label={t("rides.shareRide", "Share ride")}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl"
              onClick={handleToggleSave}
              aria-label={t("rides.saveRide", "Save ride")}
            >
              <Bookmark className={`h-5 w-5 ${saved ? "fill-primary text-primary" : ""}`} />
            </Button>
            <ReportDialog reportedType="ride" reportedId={ride.id} triggerVariant="icon" />
          </div>
        </div>
      )}

      <div className="lg:hidden">
        <XhiroBottomNav />
      </div>
    </div>
  );
}
