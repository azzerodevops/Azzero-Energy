"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Generale", segment: "general" },
  { label: "Domanda", segment: "demand" },
  { label: "Risorse", segment: "resources" },
  { label: "Tecnologie", segment: "technologies" },
  { label: "Accumulo", segment: "storage" },
  { label: "Illuminazione", segment: "lighting" },
  { label: "File", segment: "files" },
  { label: "Scenari", segment: "scenarios" },
  { label: "Report", segment: "report" },
];

interface AnalysisTabsNavProps {
  analysisId: string;
}

export function AnalysisTabsNav({ analysisId }: AnalysisTabsNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/analyses/${analysisId}`;

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-4 overflow-x-auto px-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.segment}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
