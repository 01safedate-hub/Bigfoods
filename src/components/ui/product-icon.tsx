import {
  Armchair, Cog, Drone, Footprints, Gem, Gift, Headphones, House, Laptop, Shirt, ShoppingBag, Smartphone, Sofa,
  Sparkles, Table2, Watch, Baby, Scissors, type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/catalog/types";

const ICONS: Record<IconKey, LucideIcon> = {
  phone: Smartphone, laptop: Laptop, drone: Drone, watch: Watch, audio: Headphones, dress: Sparkles, shirt: Shirt,
  wig: Scissors, gem: Gem, lipstick: Sparkles, shoe: Footprints, bag: ShoppingBag, home: House, chair: Armchair,
  sofa: Sofa, table: Table2, machine: Cog, kids: Baby, gift: Gift,
};

export function ProductIcon({ icon, size = 48, className }: { icon: IconKey; size?: number; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden size={size} strokeWidth={1} className={className ?? "text-ink/50"} />;
}
