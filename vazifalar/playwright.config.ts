// playwright.config.ts — 22/#09: e2e testlar (Playwright Test).
// Ilova — production build (npm run build) + vite preview: foydalanuvchi
// oladigan AYNAN o'sha fayllar. API — page.route bilan (e2e/soxta-api.ts),
// haqiqiy server kerak emas. Brauzer — tizimdagi Chrome (channel), Playwright
// o'z Chromium'ini yuklamaydi
import { defineConfig, devices } from "@playwright/test";

const CI = process.env["CI"] !== undefined;
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // CI'da test.only qolib ketsa — yiqiladi (qolganlari o'tkazib yuborilmasin)
  forbidOnly: CI,
  // Qayta urinish faqat CI'da: lokalda beqaror test darhol ko'rinsin.
  // 2-urinishda o'tgan test hisobotda "flaky" bo'lib chiqadi (#15)
  retries: CI ? 2 : 0,
  reporter: CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  expect: {
    // 22/#13: farqli piksellar ulushi — 1 % gacha. Bir mashinada 0 bilan
    // ham barqaror (o'lchandi: 30/30), zaxira — Chrome/shrift yangilanishi
    // antialiasing'ni ozgina o'zgartirsa. «Qayta urinish» tugmasi xatosi 3–5 %
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Trace (DOM suratlari, tarmoq, konsol) — faqat qayta urinishda:
    // har testda yozilsa sekin va hajmli. Ko'rish: npx playwright show-trace
    trace: "on-first-retry",
    // Ilovaning sw.js i so'rovlarni o'zi oladi — page.route ularni ko'rmaydi.
    // SW'ning o'zi — zavod e2e va #13 dagi alohida testda
    serviceWorkers: "block",
    // Hamma loyiha (kirish ham) — tizimdagi Chrome. Busiz Playwright o'z
    // chrome-headless-shell'ini qidiradi (o'lchandi: "Executable doesn't
    // exist ... npx playwright install")
    channel: "chrome",
  },
  projects: [
    // 1) Kirish bir marta: holat (localStorage) faylga — storageState
    { name: "kirish", testMatch: /kirish\.setup\.ts/ },
    // 2) Qolgan testlar shu holat bilan "kirgan" bo'lib boshlanadi
    {
      name: "chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        storageState: "e2e/.auth/foydalanuvchi.json",
      },
      dependencies: ["kirish"],
      // 22/#13: suratli testlar — alohida loyiha (npm run test:vizual)
      testIgnore: /vizual.spec.ts/,
    },
    {
      // 22/#13: visual regression. Oltin rasmlar platformaga bog'liq —
      // CI (Linux) uchun Linux'da yaratiladi; lokal Windows'da — o'ziniki
      name: "vizual",
      testMatch: /vizual.spec.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/foydalanuvchi.json",
      },
      dependencies: ["kirish"],
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Lokalda ishlab turgan preview bo'lsa — o'sha (har safar build yo'q)
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
