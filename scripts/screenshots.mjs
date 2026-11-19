// Usage: APP_URL=http://127.0.0.1:4175/ node scripts/screenshots.mjs <outDir>
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const outDir = process.argv[2] ?? "shots";
const url = process.env.APP_URL ?? "http://127.0.0.1:4175/";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function shot(name, { theme, width, height }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion: "reduce",
    locale: "de-DE",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
  await page.addInitScript((t) => {
    localStorage.setItem("oee-dashboard-demo.theme", t);
  }, theme);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".kpi-kachel");
  await page.waitForTimeout(400);
  const path = `${outDir}/${name}`;
  await page.screenshot({ path, fullPage: true });
  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  console.log(`wrote ${path}${overflowX ? " (WARN horizontal overflow)" : ""}`);
  await context.close();
  return overflowX;
}

const overflows = [];
if (
  await shot("uebersicht-hell-1280.png", { theme: "light", width: 1280, height: 900 })
) {
  overflows.push("uebersicht-hell-1280.png");
}
if (
  await shot("uebersicht-dunkel-1280.png", { theme: "dark", width: 1280, height: 900 })
) {
  overflows.push("uebersicht-dunkel-1280.png");
}
if (await shot("uebersicht-hell-390.png", { theme: "light", width: 390, height: 844 })) {
  overflows.push("uebersicht-hell-390.png");
}

await browser.close();
if (overflows.length) {
  console.error("horizontal overflow in:", overflows.join(", "));
  process.exit(1);
}
