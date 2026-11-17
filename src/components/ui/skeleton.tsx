import { cn } from "@/lib/format";

/** Grey placeholder while content loads. Motion is turned off for people who prefer less. */
export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cn("animate-pulse rounded-md bg-[#EDEDED] motion-reduce:animate-none", className)} />;

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading products" className="grid grid-cols-2 gap-x-1.5 gap-y-3 px-1.5 py-4 sm:grid-cols-3 md:grid-cols-4 md:gap-x-3 md:px-0 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
