"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, CheckCircle2, XCircle } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "analysis_created" | "scenario_completed" | "scenario_failed";
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activity: ActivityItem[];
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "Adesso";
  }
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minuto" : "minuti"} fa`;
  }
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
  }
  if (days < 7) {
    return `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
  }

  const date = new Date(timestamp);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const activityConfig = {
  analysis_created: {
    icon: BarChart3,
    bgClass: "bg-blue-500/10",
    iconClass: "text-blue-500",
  },
  scenario_completed: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10",
    iconClass: "text-emerald-500",
  },
  scenario_failed: {
    icon: XCircle,
    bgClass: "bg-red-500/10",
    iconClass: "text-red-500",
  },
} as const;

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Attività recenti
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Nessuna attività recente</p>
          </div>
        ) : (
          <div>
            {activity.map((item) => {
              const config = activityConfig[item.type];
              const Icon = config.icon;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 py-3 border-b last:border-0"
                >
                  <div className={`rounded-full p-2 ${config.bgClass}`}>
                    <Icon className={`h-4 w-4 ${config.iconClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(item.timestamp)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
