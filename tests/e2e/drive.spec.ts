import { test, expect } from "@playwright/test";

test.describe("Vaulta Drive & Zero-Knowledge Vault Experience", () => {
  test("renders Drive storage shell with navigation and action triggers", async ({ page, isMobile }) => {
    await page.goto("/drive");

    if (isMobile) {
      await expect(page.locator("nav.md\\:hidden").locator("text=Drive")).toBeVisible();
      await expect(page.locator('button[aria-label="Upload file or take photo"]')).toBeVisible();
    } else {
      await expect(page.locator("text=My Drive").first()).toBeVisible();
      await expect(page.locator("text=Storage Quota")).toBeVisible();
      await expect(page.locator("text=Upload File").first()).toBeVisible();
    }
  });

  test("loads Private Vault space gated by client-side unlock modal", async ({ page }) => {
    await page.goto("/vault");

    // Modal is displayed on both desktop and mobile
    await expect(
      page.locator("text=Initialize Private Vault").or(page.locator("text=Unlock Private Vault")).first()
    ).toBeVisible();
  });

  test("renders mobile bottom navigation bar with floating action button at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/drive");

    // Verify mobile bottom nav icons
    const nav = page.locator("nav.md\\:hidden");
    await expect(nav).toBeVisible();
    await expect(page.locator('button[aria-label="Upload file or take photo"]')).toBeVisible();
  });

  test("opens Quick Transfer modal with send and receive tabs", async ({ page, isMobile }) => {
    if (isMobile) return;
    await page.goto("/drive");

    const quickTransferBtn = page.locator("button:has-text('Quick Transfer')").first();
    await expect(quickTransferBtn).toBeVisible();
    await quickTransferBtn.click();

    // Verify modal elements
    await expect(page.locator("h2:has-text('Quick Transfer')")).toBeVisible();
    await expect(page.locator("button:has-text('Receive')")).toBeVisible();
    await expect(page.locator("button:has-text('Send')")).toBeVisible();
  });
});
