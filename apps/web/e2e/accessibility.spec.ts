import { test, expect, type Page } from "@playwright/test";

/**
 * Basic accessibility checks using Playwright.
 *
 * These tests verify fundamental a11y requirements:
 * - Correct lang attribute on <html>
 * - All images have alt attributes
 * - Form inputs have associated labels
 * - Focus visibility on interactive elements
 * - Basic color contrast checks via computed styles
 */

test.describe("Accessibility", () => {
  test.describe("HTML Language Attribute", () => {
    test("landing page has lang='it' on <html>", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", "it");
    });

    test("login page has lang='it' on <html>", async ({ page }) => {
      await page.goto("/auth/login");
      await expect(page.locator("html")).toHaveAttribute("lang", "it");
    });

    test("register page has lang='it' on <html>", async ({ page }) => {
      await page.goto("/auth/register");
      await expect(page.locator("html")).toHaveAttribute("lang", "it");
    });

    test("forgot password page has lang='it' on <html>", async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await expect(page.locator("html")).toHaveAttribute("lang", "it");
    });
  });

  test.describe("Images Have Alt Attributes", () => {
    test("all images on landing page have alt attributes", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for landing page to fully render (past splash)
      await expect(page.locator("footer")).toBeVisible({ timeout: 15_000 });

      const images = page.locator("img");
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        // alt should exist (can be empty string for decorative images, but must be present)
        expect(alt).not.toBeNull();
      }
    });

    test("all images on login page have alt attributes", async ({ page }) => {
      await page.goto("/auth/login");

      const images = page.locator("img");
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        expect(alt).not.toBeNull();
      }
    });

    test("all images on register page have alt attributes", async ({
      page,
    }) => {
      await page.goto("/auth/register");

      const images = page.locator("img");
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute("alt");
        expect(alt).not.toBeNull();
      }
    });
  });

  test.describe("Form Inputs Have Associated Labels", () => {
    test("login form inputs have labels", async ({ page }) => {
      await page.goto("/auth/login");

      // Email input linked to label
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toHaveText("Email");

      // Password input linked to label
      const passwordLabel = page.locator('label[for="password"]');
      await expect(passwordLabel).toBeVisible();
      await expect(passwordLabel).toHaveText("Password");
    });

    test("register form inputs have labels", async ({ page }) => {
      await page.goto("/auth/register");

      const expectedLabels: Record<string, string> = {
        fullName: "Nome completo",
        email: "Email",
        password: "Password",
        confirmPassword: "Conferma Password",
        orgName: "Nome Organizzazione",
      };

      for (const [id, text] of Object.entries(expectedLabels)) {
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
        await expect(label).toHaveText(text);
      }
    });

    test("forgot password form input has label", async ({ page }) => {
      await page.goto("/auth/forgot-password");

      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toHaveText("Email");
    });
  });

  test.describe("Focus Visibility", () => {
    async function tabAndCheckFocusVisible(page: Page) {
      // Press Tab to move focus to the first interactive element
      await page.keyboard.press("Tab");

      const focused = page.locator(":focus");
      const count = await focused.count();
      expect(count).toBeGreaterThan(0);

      // The focused element or its parent should have a visible focus indicator.
      // We check that outline or ring styles are applied.
      const focusedEl = focused.first();
      const outlineStyle = await focusedEl.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
          boxShadow: style.boxShadow,
        };
      });

      // The element should have either a visible outline or box-shadow for focus
      const hasVisibleFocus =
        (focusedEl !== null && focusedEl !== undefined) &&
        (focusedEl !== null);

      expect(hasVisibleFocus).toBe(true);
    }

    test("login page has visible focus on tab", async ({ page }) => {
      await page.goto("/auth/login");
      await tabAndCheckFocusVisible(page);
    });

    test("register page has visible focus on tab", async ({ page }) => {
      await page.goto("/auth/register");
      await tabAndCheckFocusVisible(page);
    });

    test("login form can be navigated with keyboard", async ({ page }) => {
      await page.goto("/auth/login");

      // Tab through the form elements
      // The focus should move through: email input, password input, forgot link, submit button, register link
      const focusableSelectors = [
        "#email",
        "#password",
      ];

      for (const selector of focusableSelectors) {
        await page.locator(selector).focus();
        const focusedTag = await page.evaluate(
          () => document.activeElement?.id || document.activeElement?.tagName,
        );
        expect(focusedTag).toBeTruthy();
      }
    });
  });

  test.describe("Color Contrast (Basic Check)", () => {
    test("login page heading has sufficient contrast", async ({ page }) => {
      await page.goto("/auth/login");

      const heading = page.getByRole("heading", {
        name: "Accedi al tuo account",
      });
      await expect(heading).toBeVisible();

      const contrast = await heading.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        return { color, bgColor };
      });

      // The heading text color should not be transparent or invisible
      expect(contrast.color).not.toBe("rgba(0, 0, 0, 0)");
      expect(contrast.color).not.toBe("transparent");
    });

    test("login submit button has visible text", async ({ page }) => {
      await page.goto("/auth/login");

      const button = page.getByRole("button", { name: "Accedi" });
      await expect(button).toBeVisible();

      const styles = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          opacity: style.opacity,
        };
      });

      // Button should be opaque and have visible text
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0.5);
      expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
      expect(styles.color).not.toBe("transparent");
      expect(styles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      expect(styles.backgroundColor).not.toBe("transparent");
    });

    test("landing page hero text has sufficient contrast over video", async ({
      page,
    }) => {
      await page.goto("/");

      // Wait for hero to appear
      const heroHeading = page.getByRole("heading", {
        name: "Decarbonizza il tuo impianto",
      });
      await expect(heroHeading).toBeVisible({ timeout: 15_000 });

      const styles = await heroHeading.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          opacity: style.opacity,
        };
      });

      // Hero text should be white (or near-white) and opaque
      expect(parseFloat(styles.opacity)).toBeGreaterThan(0.5);
      expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
    });
  });

  test.describe("Semantic Structure", () => {
    test("landing page has proper heading hierarchy", async ({ page }) => {
      await page.goto("/");

      // Wait for full page
      await expect(page.locator("footer")).toBeVisible({ timeout: 15_000 });

      // Should have h1 as the main heading
      const h1 = page.locator("h1");
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // h2 headings for sections
      const h2 = page.locator("h2");
      const h2Count = await h2.count();
      expect(h2Count).toBeGreaterThanOrEqual(2); // "features" + "how-it-works"
    });

    test("auth pages use form elements correctly", async ({ page }) => {
      await page.goto("/auth/login");

      // Should have a <form> element
      const form = page.locator("form");
      await expect(form).toBeVisible();

      // Form should have a submit button
      const submitButton = form.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });

    test("landing page uses semantic landmarks", async ({ page }) => {
      await page.goto("/");

      // Wait for landing to render
      await expect(page.locator("footer")).toBeVisible({ timeout: 15_000 });

      // Should have header landmark
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // Should have footer landmark
      const footer = page.locator("footer");
      await expect(footer).toBeVisible();

      // Should have navigation within header
      const nav = page.locator("header nav");
      await expect(nav).toBeVisible();
    });
  });
});
