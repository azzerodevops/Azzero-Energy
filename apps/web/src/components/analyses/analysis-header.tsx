import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

interface AnalysisHeaderProps {
  analysis: {
    id: string;
    name: string;
    status: "draft" | "ready" | "calculated";
    year: number;
  };
  siteName: string;
}

export function AnalysisHeader({ analysis, siteName }: AnalysisHeaderProps) {
  return (
    <div className="space-y-1">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/analyses" className="hover:text-foreground">Analisi</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{analysis.name}</span>
      </nav>
      {/* Title row */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{analysis.name}</h1>
        <StatusBadge status={analysis.status} />
      </div>
      {/* Meta */}
      <p className="text-sm text-muted-foreground">
        {siteName} &middot; Anno {analysis.year}
      </p>
    </div>
  );
}
