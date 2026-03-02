import { describe, it, expect } from "vitest";
import { navItems } from "@/components/dashboard/nav-items";
import type { NavItem } from "@/components/dashboard/nav-items";

describe("navItems", () => {
  it("exports exactly 6 navigation items", () => {
    expect(navItems).toHaveLength(6);
  });

  it("each item has label, href, and icon fields", () => {
    navItems.forEach((item: NavItem) => {
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("href");
      expect(item).toHaveProperty("icon");

      expect(typeof item.label).toBe("string");
      expect(typeof item.href).toBe("string");
      // Lucide icons are React forwardRef objects
      expect(item.icon).toBeDefined();
      expect(typeof item.icon === "function" || typeof item.icon === "object").toBe(true);
    });
  });

  it("all hrefs start with /dashboard", () => {
    navItems.forEach((item: NavItem) => {
      expect(item.href).toMatch(/^\/dashboard/);
    });
  });

  it("has no duplicate hrefs", () => {
    const hrefs = navItems.map((item) => item.href);
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });

  it("has no duplicate labels", () => {
    const labels = navItems.map((item) => item.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it("contains the expected navigation entries", () => {
    const labels = navItems.map((item) => item.label);

    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Impianti");
    expect(labels).toContain("Analisi");
    expect(labels).toContain("Mappa");
    expect(labels).toContain("Organizzazione");
    expect(labels).toContain("Profilo");
  });
});
