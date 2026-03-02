import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Map area skeleton */}
      <Skeleton className="h-[calc(100vh-16rem)] w-full rounded-xl" />
    </div>
  );
}
