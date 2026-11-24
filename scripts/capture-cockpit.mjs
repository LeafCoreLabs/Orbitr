import { chromium } from "playwright";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = "C:/Users/sumit/.gemini/antigravity/brain/be0c56d3-6259-40d0-be2a-35878a7ec62c";

  // 1. Desktop 1440x960 Top View
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page1.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page1.waitForTimeout(1000);
  await page1.screenshot({ path: `${artifactDir}/fullscreen_home_top.png` });

  // 2. Crop of the Non-Scrollable Cyber Console
  const consoleElem = await page1.$("aside");
  if (consoleElem) {
    await consoleElem.screenshot({ path: `${artifactDir}/cyber_cockpit_console_crop.png` });
  }

  // 3. Scrolled 1200px to verify sticky behavior alongside architecture & capabilities
  await page1.evaluate(() => window.scrollTo(0, 1200));
  await page1.waitForTimeout(600);
  await page1.screenshot({ path: `${artifactDir}/fullscreen_home_scrolled_sticky.png` });

  // 4. Wide 1920x1080 Full HD Viewport
  const pageWide = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await pageWide.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await pageWide.waitForTimeout(1000);
  await pageWide.screenshot({ path: `${artifactDir}/fullscreen_1920_canvas.png` });

  // 5. Tablet 768x1024
  const pageTablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
  await pageTablet.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await pageTablet.screenshot({ path: `${artifactDir}/tablet_768_home.png` });

  // 6. Mobile 375x812
  const pageMobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await pageMobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await pageMobile.screenshot({ path: `${artifactDir}/mobile_375_home.png` });

  await browser.close();
  console.log("Screenshots captured successfully!");
}

capture().catch(console.error);
