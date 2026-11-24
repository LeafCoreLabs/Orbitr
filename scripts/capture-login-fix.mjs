import { chromium } from "playwright";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = "C:/Users/sumit/.gemini/antigravity/brain/be0c56d3-6259-40d0-be2a-35878a7ec62c";

  // Login page
  const pageLogin = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await pageLogin.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await pageLogin.waitForTimeout(600);
  await pageLogin.screenshot({ path: `${artifactDir}/login_page_fixed.png` });

  // Signup page
  const pageSignup = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await pageSignup.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
  await pageSignup.waitForTimeout(600);
  await pageSignup.screenshot({ path: `${artifactDir}/signup_page_fixed.png` });

  await browser.close();
  console.log("Captured login and signup screenshots!");
}

capture().catch(console.error);
