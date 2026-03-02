import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("page loads and shows splash screen initially", async ({ page }) => {
    await page.goto("/");

    // The splash screen should be visible initially with the shimmer animation
    const splash = page.locator("div.fixed.inset-0");
    await expect(splash).toBeVisible();

    // Splash shows the AzzeroCO2 logo
    const splashLogo = splash.locator('img[alt="AzzeroCO2 Energy"]');
    await expect(splashLogo.first()).toBeVisible();

    // Splash shows loading text in Italian
    const loadingText = splash.locator("text=Caricamento in corso...");
    await expect(loadingText.first()).toBeVisible();
  });

  test("after splash, shows landing content with video hero", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for splash to disappear (7.5s splash + 0.5s fade + buffer)
    // Since there is no running Supabase, the splash will complete and show the landing page
    await expect(page.locator("section video")).toBeVisible({
      timeout: 15_000,
    });

    // Video hero section with the background video
    const video = page.locator("section video source");
    await expect(video).toHaveAttribute("type", "video/mp4");

    // Hero headline
    await expect(
      page.getByRole("heading", { name: "Decarbonizza il tuo impianto" }),
    ).toBeVisible();

    // Hero subtitle
    await expect(
      page.getByText(
        /Analisi energetica, ottimizzazione e reporting ESG/,
      ),
    ).toBeVisible();

    // CTA buttons in hero
    await expect(page.getByRole("link", { name: "Inizia ora" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Scopri di piu" }),
    ).toBeVisible();
  });

  test("header has login button", async ({ page }) => {
    await page.goto("/");

    // Wait for landing page to render (past splash)
    await expect(page.locator("header")).toBeVisible({ timeout: 15_000 });

    // The header "Accedi" button links to /auth/login
    const loginButton = page.locator("header").getByRole("link", { name: "Accedi" });
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveAttribute("href", "/auth/login");
  });

  test("navigation to /auth/login works from header", async ({ page }) => {
    await page.goto("/");

    // Wait for landing to appear
    await expect(page.locator("header")).toBeVisible({ timeout: 15_000 });

    // Click the "Accedi" button in header
    await page.locator("header").getByRole("link", { name: "Accedi" }).click();

    // Should navigate to the login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("footer is visible with correct content", async ({ page }) => {
    await page.goto("/");

    // Wait for landing page content
    await expect(page.locator("footer")).toBeVisible({ timeout: 15_000 });

    // Footer has the AzzeroCO2 logo
    const footerLogo = page.locator('footer img[alt="AzzeroCO2 Energy"]');
    await expect(footerLogo).toBeVisible();

    // Footer has navigation links
    await expect(page.locator("footer").getByText("Funzionalita")).toBeVisible();
    await expect(page.locator("footer").getByText("Come funziona")).toBeVisible();
    await expect(page.locator("footer").getByText("Privacy")).toBeVisible();
    await expect(page.locator("footer").getByText("Contatti")).toBeVisible();

    // Footer has copyright text
    await expect(
      page.getByText(/2026 AzzeroCO2 S\.r\.l\. Societa Benefit/),
    ).toBeVisible();
  });

  test("feature cards section is present", async ({ page }) => {
    await page.goto("/");

    // Wait for landing page
    await expect(
      page.locator("#features"),
    ).toBeVisible({ timeout: 15_000 });

    // Section heading
    await expect(
      page.getByRole("heading", {
        name: "Una piattaforma completa per la transizione energetica",
      }),
    ).toBeVisible();

    // 4 feature card titles
    await expect(page.getByText("Audit Energetico")).toBeVisible();
    await expect(page.getByText("Ottimizzazione")).toBeVisible();
    await expect(page.getByText("Scenari")).toBeVisible();
    await expect(page.getByText("Report ESG")).toBeVisible();
  });

  test("how-it-works section is present", async ({ page }) => {
    await page.goto("/");

    // Wait for landing page
    await expect(page.locator("#how-it-works")).toBeVisible({
      timeout: 15_000,
    });

    // Section heading
    await expect(
      page.getByRole("heading", { name: "Come funziona" }),
    ).toBeVisible();

    // 3 steps
    await expect(page.getByText("Carica i dati")).toBeVisible();
    await expect(page.getByText("Simula scenari")).toBeVisible();
    await expect(page.getByText("Genera report")).toBeVisible();
  });
});
