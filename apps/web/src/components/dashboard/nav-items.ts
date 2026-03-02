import { LayoutDashboard, MapPin, BarChart3, Building2, User, Map as MapIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Impianti", href: "/dashboard/sites", icon: MapPin },
  { label: "Analisi", href: "/dashboard/analyses", icon: BarChart3 },
  { label: "Mappa", href: "/dashboard/map", icon: MapIcon },
  { label: "Organizzazione", href: "/dashboard/organization", icon: Building2 },
  { label: "Profilo", href: "/dashboard/profile", icon: User },
];
