import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading product" className="grid gap-4 p-3 md:grid-cols-2 md:p-0 md:py-6">
      <Skeleton className="aspect-[3/4] w-full md:aspect-square" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
