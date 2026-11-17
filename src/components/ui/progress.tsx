import { cn } from "@/lib/format";

export function Progress({ value, className, barClass, label }: { value: number; className?: string; barClass?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
      className={cn("block h-1.5 overflow-hidden rounded-full bg-black/10", className)}
    >
      <span className={cn("bar-fill block h-full rounded-full", barClass ?? "bg-sale")} style={{ width: `${v}%` }} />
    </span>
  );
}
