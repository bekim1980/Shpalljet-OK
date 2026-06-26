import { Skeleton } from "@/components/ui/skeleton";

const RideDetailSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-56 w-full rounded-2xl" />
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-32 w-full rounded-2xl" />
    <div className="hidden lg:block">
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  </div>
);

export default RideDetailSkeleton;
