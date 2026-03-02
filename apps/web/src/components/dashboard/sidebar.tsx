"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { navItems } from "./nav-items";
import { OrganizationSelector } from "./organization-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore();
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        aria-label="Sidebar di navigazione"
        className={cn(
          "flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-3">
          {isCollapsed ? (
            <span className="mx-auto text-lg font-bold text-primary">A0</span>
          ) : (
            <Image
              src="/logos/AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg"
              alt="AzzeroCO2"
              width={180}
              height={40}
              className="dark:brightness-0 dark:invert"
              priority
            />
          )}
        </div>

        {/* Organization selector (admin only) */}
        <div className="px-2 py-2">
          <OrganizationSelector isCollapsed={isCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            const linkContent = (
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "border-l-2 border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!isCollapsed && (
                  <span className="transition-opacity duration-300">
                    {item.label}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-border p-2">
          <button
            onClick={toggle}
            aria-label={isCollapsed ? "Espandi sidebar" : "Comprimi sidebar"}
            className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2 text-sm">Comprimi</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
