import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ride } from "@/hooks/useRides";
import { useSimilarRides } from "@/hooks/useRides";
import RideCard from "@/components/rides/RideCard";

const SimilarRidesInner = ({ ride }: { ride: Ride }) => {
  const { t } = useTranslation();
  const { rides, loading } = useSimilarRides(ride);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!rides.length) return null;

  return (
    <section className="space-y-4" aria-labelledby="similar-rides-heading">
      <h2 id="similar-rides-heading" className="font-display text-lg font-bold sm:text-xl">
        {t("rides.similarRides", "Similar rides")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {rides.map((r, i) => (
          <RideCard key={r.id} ride={r} index={i} variant="compact" />
        ))}
      </div>
    </section>
  );
};

const LazySimilar = lazy(async () => ({ default: SimilarRidesInner }));

const SimilarRidesSection = ({ ride }: { ride: Ride }) => (
  <Suspense
    fallback={
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    }
  >
    <LazySimilar ride={ride} />
  </Suspense>
);

export default SimilarRidesSection;
