import { test, expect } from "@playwright/test";

/**
 * Navigation tests.
 *
 * Because dashboard routes are protected by Supabase Auth middleware,
 * unauthenticated requests redirect to /auth/login. These tests verify
 * the redirect targets to confirm the routes exist and are properly
 * protected, plus test public page navigation.
 */

test.describe("Navigation", () => {
  test.describe("Public Page Navigation", () => {
    test("landing page header nav links point to correct anchors", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for landing page to render (past splash screen)
      await expect(page.locator("header nav")).toBeVisible({
        timeout: 15_000,
      });

      // Desktop nav links
      const nav = page.locator("header nav");
      await expect(nav.getByText("Funzionalita")).toHaveAttribute(
        "href",
        "#features",
      );
      await expect(nav.getByText("Come funziona")).toHaveAttribute(
        "href",
        "#how-it-works",
      );
      await expect(nav.getByText("Contatti")).toHaveAttribute(
        "href",
        "#contact",
      );
    });

    test("hero 'Inizia ora' button links to register", async ({ page }) => {
      await page.goto("/");

      // Wait for landing content
      const registerLink = page.getByRole("link", { name: "Inizia ora" });
      await expect(registerLink).toBeVisible({ timeout: 15_000 });
      await expect(registerLink).toHaveAttribute("href", "/auth/register");
    });

    test("clicking 'Inizia ora' navigates to register page", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for landing content and click
      const registerLink = page.getByRole("link", { name: "Inizia ora" });
      await expect(registerLink).toBeVisible({ timeout: 15_000 });
      await registerLink.click();

      await expect(page).toHaveURL(/\/auth\/register/);
      await expect(
        page.getByRole("heading", { name: "Crea un account" }),
      ).toBeVisible();
    });
  });

  test.describe("Dashboard Route Protection", () => {
    // All dashboard nav routes should redirect when not authenticated.
    // This validates the routes exist and are properly guarded.

    const dashboardRoutes = [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/dashboard/sites", label: "Impianti" },
      { path: "/dashboard/analyses", label: "Analisi" },
      { path: "/dashboard/map", label: "Mappa" },
      { path: "/dashboard/organization", label: "Organizzazione" },
      { path: "/dashboard/profile", label: "Profilo" },
    ];

    for (const route of dashboardRoutes) {
      test(`${route.label} (${route.path}) is protected`, async ({
        page,
      }) => {
        await page.goto(route.path);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
      });
    }
  });

  test.describe("Auth Page Navigation", () => {
    test("auth pages are accessible without authentication", async ({
      page,
    }) => {
      // Login page
      await page.goto("/auth/login");
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(
        page.getByRole("heading", { name: "Accedi al tuo account" }),
      ).toBeVisible();

      // Register page
      await page.goto("/auth/register");
      await expect(page).toHaveURL(/\/auth\/register/);
      await expect(
        page.getByRole("heading", { name: "Crea un account" }),
      ).toBeVisible();

      // Forgot password page
      await page.goto("/auth/forgot-password");
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
      await expect(
        page.getByRole("heading", { name: "Password dimenticata" }),
      ).toBeVisible();
    });

    test("footer nav links work from landing page", async ({ page }) => {
      await page.goto("/");

      // Wait for footer
      const footer = page.locator("footer");
      await expect(footer).toBeVisible({ timeout: 15_000 });

      // "Funzionalita" links to #features
      const featuresLink = footer.getByText("Funzionalita");
      await expect(featuresLink).toHaveAttribute("href", "#features");

      // "Come funziona" links to #how-it-works
      const howItWorksLink = footer.getByText("Come funziona");
      await expect(howItWorksLink).toHaveAttribute("href", "#how-it-works");

      // "Contatti" links to #contact
      const contactLink = footer.getByText("Contatti");
      await expect(contactLink).toHaveAttribute("href", "#contact");
    });
  });
});
