import { ANALYSIS_STATUS_LABELS, ANALYSIS_STATUS_COLORS } from "@azzeroco2/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "draft" | "ready" | "calculated";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(ANALYSIS_STATUS_COLORS[status], className)}
    >
      {ANALYSIS_STATUS_LABELS[status]}
    </Badge>
  );
}
