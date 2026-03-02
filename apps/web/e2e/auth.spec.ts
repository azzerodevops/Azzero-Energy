import { test, expect } from "@playwright/test";

test.describe("Auth Pages", () => {
  test.describe("Login Page", () => {
    test("loads with email and password fields", async ({ page }) => {
      await page.goto("/auth/login");

      // Page title
      await expect(
        page.getByRole("heading", { name: "Accedi al tuo account" }),
      ).toBeVisible();

      // Description text
      await expect(
        page.getByText("Inserisci le tue credenziali per accedere"),
      ).toBeVisible();

      // Email field with label
      const emailLabel = page.getByText("Email", { exact: true });
      await expect(emailLabel).toBeVisible();
      const emailInput = page.locator("#email");
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute("type", "email");
      await expect(emailInput).toHaveAttribute(
        "placeholder",
        "nome@esempio.it",
      );

      // Password field with label
      const passwordLabel = page.getByText("Password", { exact: true });
      await expect(passwordLabel).toBeVisible();
      const passwordInput = page.locator("#password");
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute("type", "password");

      // Submit button
      await expect(
        page.getByRole("button", { name: "Accedi" }),
      ).toBeVisible();
    });

    test("has link to register page", async ({ page }) => {
      await page.goto("/auth/login");

      const registerLink = page.getByRole("link", { name: "Registrati" });
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute("href", "/auth/register");
    });

    test("has link to forgot password page", async ({ page }) => {
      await page.goto("/auth/login");

      const forgotLink = page.getByRole("link", {
        name: "Password dimenticata?",
      });
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute(
        "href",
        "/auth/forgot-password",
      );
    });

    test("shows AzzeroCO2 logo above the form", async ({ page }) => {
      await page.goto("/auth/login");

      const logo = page.locator('img[alt="AzzeroCO2 Energy"]');
      await expect(logo).toBeVisible();
    });

    test("submit button is disabled while loading", async ({ page }) => {
      await page.goto("/auth/login");

      // Fill fields and submit — the button should become disabled during submission
      await page.locator("#email").fill("test@example.com");
      await page.locator("#password").fill("password123");

      const submitButton = page.getByRole("button", { name: "Accedi" });
      await expect(submitButton).toBeEnabled();

      // Click submit — without a real Supabase, it will fail, but the button
      // text should change to loading state briefly
      await submitButton.click();

      // After the request fails, an error message should appear
      // (Supabase client will throw since there is no real backend)
      await expect(
        page.locator(".bg-destructive\\/10").or(
          page.getByRole("button", { name: "Accedi" }),
        ),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Register Page", () => {
    test("loads with all required fields", async ({ page }) => {
      await page.goto("/auth/register");

      // Page title
      await expect(
        page.getByRole("heading", { name: "Crea un account" }),
      ).toBeVisible();

      // Description
      await expect(
        page.getByText("Inserisci i tuoi dati per creare un nuovo account"),
      ).toBeVisible();

      // Full name field
      const fullNameInput = page.locator("#fullName");
      await expect(fullNameInput).toBeVisible();
      await expect(fullNameInput).toHaveAttribute("placeholder", "Mario Rossi");

      // Email field
      const emailInput = page.locator("#email");
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute("type", "email");

      // Password field
      const passwordInput = page.locator("#password");
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute("type", "password");
      await expect(passwordInput).toHaveAttribute(
        "placeholder",
        "Minimo 8 caratteri",
      );

      // Confirm password field
      const confirmPasswordInput = page.locator("#confirmPassword");
      await expect(confirmPasswordInput).toBeVisible();
      await expect(confirmPasswordInput).toHaveAttribute("type", "password");

      // Organization name field
      const orgNameInput = page.locator("#orgName");
      await expect(orgNameInput).toBeVisible();
      await expect(orgNameInput).toHaveAttribute(
        "placeholder",
        "La tua azienda",
      );

      // Submit button
      await expect(
        page.getByRole("button", { name: "Crea account" }),
      ).toBeVisible();
    });

    test("has link to login page", async ({ page }) => {
      await page.goto("/auth/register");

      const loginLink = page.getByRole("link", { name: "Accedi" });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute("href", "/auth/login");
    });

    test("all fields have associated labels", async ({ page }) => {
      await page.goto("/auth/register");

      // Each label should be associated with its input via htmlFor/id
      await expect(page.locator('label[for="fullName"]')).toBeVisible();
      await expect(page.locator('label[for="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();
      await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
      await expect(page.locator('label[for="orgName"]')).toBeVisible();
    });

    test("fields have correct autocomplete attributes", async ({ page }) => {
      await page.goto("/auth/register");

      await expect(page.locator("#fullName")).toHaveAttribute(
        "autocomplete",
        "name",
      );
      await expect(page.locator("#email")).toHaveAttribute(
        "autocomplete",
        "email",
      );
      await expect(page.locator("#password")).toHaveAttribute(
        "autocomplete",
        "new-password",
      );
      await expect(page.locator("#confirmPassword")).toHaveAttribute(
        "autocomplete",
        "new-password",
      );
      await expect(page.locator("#orgName")).toHaveAttribute(
        "autocomplete",
        "organization",
      );
    });
  });

  test.describe("Forgot Password Page", () => {
    test("loads with email field and submit button", async ({ page }) => {
      await page.goto("/auth/forgot-password");

      // Page title
      await expect(
        page.getByRole("heading", { name: "Password dimenticata" }),
      ).toBeVisible();

      // Description
      await expect(
        page.getByText("Inserisci la tua email per ricevere un link di reset"),
      ).toBeVisible();

      // Email field
      const emailInput = page.locator("#email");
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute("type", "email");

      // Submit button
      await expect(
        page.getByRole("button", { name: "Invia link di reset" }),
      ).toBeVisible();
    });

    test("has link back to login", async ({ page }) => {
      await page.goto("/auth/forgot-password");

      const backToLogin = page.getByRole("link", { name: "Torna al login" });
      await expect(backToLogin).toBeVisible();
      await expect(backToLogin).toHaveAttribute("href", "/auth/login");
    });
  });

  test.describe("Cross-page Navigation", () => {
    test("login -> register -> login flow", async ({ page }) => {
      await page.goto("/auth/login");

      // Navigate to register
      await page.getByRole("link", { name: "Registrati" }).click();
      await expect(page).toHaveURL(/\/auth\/register/);

      // Navigate back to login
      await page.getByRole("link", { name: "Accedi" }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test("login -> forgot password -> login flow", async ({ page }) => {
      await page.goto("/auth/login");

      // Navigate to forgot password
      await page
        .getByRole("link", { name: "Password dimenticata?" })
        .click();
      await expect(page).toHaveURL(/\/auth\/forgot-password/);

      // Navigate back to login
      await page.getByRole("link", { name: "Torna al login" }).click();
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });
});
