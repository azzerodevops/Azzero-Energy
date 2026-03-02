import { describe, it, expect } from "vitest";
import { cn, formatNumber, formatCurrency, formatMwh } from "@/lib/utils";

// ===========================================================================
// cn() - className merge utility (clsx + tailwind-merge)
// ===========================================================================

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("handles conditional classes with booleans", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("deduplicates Tailwind classes (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("handles empty string", () => {
    expect(cn("base", "", "extra")).toBe("base extra");
  });

  it("handles no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles object syntax from clsx", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
      "text-red-500"
    );
  });

  it("handles array syntax from clsx", () => {
    expect(cn(["p-4", "m-2"])).toBe("p-4 m-2");
  });

  it("merges conflicting margin classes", () => {
    expect(cn("mt-4", "mt-2")).toBe("mt-2");
  });

  it("keeps non-conflicting classes from different utilities", () => {
    expect(cn("p-4", "m-2", "text-sm")).toBe("p-4 m-2 text-sm");
  });

  it("handles responsive prefixes correctly", () => {
    expect(cn("p-4", "md:p-4")).toBe("p-4 md:p-4");
  });
});

// ===========================================================================
// formatNumber() - Italian locale number formatting
// ===========================================================================

describe("formatNumber()", () => {
  // Note: jsdom may not have full ICU data for Italian locale, so thousands
  // separators may not appear. We test structural behaviour instead.

  it("returns a string representation of the number", () => {
    const result = formatNumber(1234);
    // Must contain the digits 1234 (with or without separator)
    expect(result.replace(/\D/g, "")).toBe("1234");
  });

  it("respects decimal places argument", () => {
    const result = formatNumber(1234.567, 2);
    // Must contain 2 decimal digits (either . or , as decimal separator)
    expect(result).toMatch(/1234[,.]57/);
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("formats negative numbers", () => {
    const result = formatNumber(-5000, 0);
    expect(result).toContain("5000");
    // Should contain a minus sign (regular or Unicode)
    expect(result).toMatch(/-|\u2212/);
  });

  it("adds trailing zeros when decimals specified", () => {
    const result = formatNumber(10, 2);
    // Either 10,00 (Italian) or 10.00 (fallback)
    expect(result).toMatch(/10[,.]00/);
  });

  it("formats large numbers containing all digits", () => {
    const result = formatNumber(1000000);
    expect(result.replace(/\D/g, "")).toBe("1000000");
  });
});

// ===========================================================================
// formatCurrency() - EUR currency formatting (Italian locale)
// ===========================================================================

describe("formatCurrency()", () => {
  it("formats as EUR currency", () => {
    const result = formatCurrency(1500);
    // Must contain 1500 digits and EUR symbol or abbreviation
    expect(result.replace(/\D/g, "")).toContain("1500");
    expect(result).toMatch(/EUR|€/);
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
    expect(result).toMatch(/EUR|€/);
  });

  it("formats negative values", () => {
    const result = formatCurrency(-250);
    expect(result.replace(/[^0-9]/g, "")).toContain("250");
    // Should contain a minus sign (regular or Unicode)
    expect(result).toMatch(/-|\u2212/);
  });
});

// ===========================================================================
// formatMwh() - Energy formatting with GWh conversion
// ===========================================================================

describe("formatMwh()", () => {
  it("formats small values as MWh", () => {
    const result = formatMwh(500);
    expect(result).toContain("MWh");
    expect(result).toContain("500");
  });

  it("formats values >= 1000 as GWh", () => {
    const result = formatMwh(2500);
    expect(result).toContain("GWh");
    expect(result).toContain("2,5");
  });

  it("formats exactly 1000 MWh as 1.0 GWh", () => {
    const result = formatMwh(1000);
    expect(result).toContain("GWh");
    expect(result).toContain("1,0");
  });

  it("formats zero", () => {
    const result = formatMwh(0);
    expect(result).toContain("MWh");
    expect(result).toContain("0");
  });

  it("formats values with one decimal", () => {
    const result = formatMwh(123.456);
    expect(result).toContain("MWh");
    expect(result).toContain("123,5"); // rounded to 1 decimal
  });
});
