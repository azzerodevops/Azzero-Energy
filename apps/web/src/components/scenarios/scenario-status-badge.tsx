import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCENARIO_STATUS_LABELS, SCENARIO_STATUS_COLORS } from "@azzeroco2/shared";

interface ScenarioStatusBadgeProps {
  status: string;
  className?: string;
}

export function ScenarioStatusBadge({ status, className }: ScenarioStatusBadgeProps) {
  const label = SCENARIO_STATUS_LABELS[status as keyof typeof SCENARIO_STATUS_LABELS] ?? status;
  const colorClass = SCENARIO_STATUS_COLORS[status as keyof typeof SCENARIO_STATUS_COLORS] ?? "";

  return (
    <Badge variant="outline" className={cn(colorClass, className)}>
      {(status === "queued" || status === "running") && (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      )}
      {label}
    </Badge>
  );
}
