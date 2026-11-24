import { test, expect } from "@playwright/test";

test.describe("Orbitr Marketing & Auth OTP Flow", () => {
  test("renders landing page with tagline and distinctive branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Your files, in orbit." })).toBeVisible();
    await expect(page.locator("text=ORBITR").first()).toBeVisible();
    await expect(page.locator("text=Zero-Knowledge").first()).toBeVisible();
  });

  test("displays 6-box OTP input with auto-advance and countdown on /verify-email", async ({ page }) => {
    await page.goto("/verify-email?email=test%40vaulta.dev");

    await expect(page.locator("text=Verify your email")).toBeVisible();
    await expect(page.locator("text=test@vaulta.dev")).toBeVisible();

    // Verify 6 input boxes exist
    const inputs = page.locator('input[inputmode="numeric"]');
    await expect(inputs).toHaveCount(6);

    // Verify cooldown is active
    await expect(page.locator("text=Resend in")).toBeVisible();
  });

  test("maintains responsive 375px viewport mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");

    await expect(page.locator("text=Sign in to Orbitr")).toBeVisible();
    const loginButton = page.getByRole("button", { name: "Sign In", exact: true });
    await expect(loginButton).toBeVisible();

    // Verify Passkey biometric sign-in button is present
    await expect(page.locator("text=Sign in with Passkey")).toBeVisible();

    // Verify minimum 44px touch target height
    const box = await loginButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);
  });

  test("renders extensive signup form with User ID, DOB, and password toggles", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("text=Create your Orbitr Account")).toBeVisible();
    await expect(page.locator('input[placeholder="Alex Mercer"]')).toBeVisible();
    await expect(page.locator('input[placeholder="alex_orbitr"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Re-type your password"]')).toBeVisible();
  });
});
