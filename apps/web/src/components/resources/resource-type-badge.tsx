import { Badge } from "@/components/ui/badge";
import { RESOURCE_TYPE_LABELS } from "@azzeroco2/shared";

const TYPE_COLORS: Record<string, string> = {
  electricity: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  natural_gas: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  diesel: "bg-amber-600/10 text-amber-600 border-amber-600/20",
  lpg: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  biomass: "bg-green-600/10 text-green-600 border-green-600/20",
  solar: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  wind: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  hydrogen: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function ResourceTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" className={TYPE_COLORS[type] ?? ""}>
      {RESOURCE_TYPE_LABELS[type as keyof typeof RESOURCE_TYPE_LABELS] ?? type}
    </Badge>
  );
}
