// vitest.config.ts — hamma testlar bitta vositada (22/#02). 17-qismdan
// beri ikki vosita edi: sof mantiq — node:test, komponentlar — Vitest.
// Endi ikkalasi Vitest'da, lekin ikki "loyiha" (project) bilan:
// sof mantiqqa DOM kerak emas (node — tez), komponentlarga — jsdom.
// vite.config.ts ishlatilmaydi: u .env.<mode> ni talab qiladi, testga
// esa faqat JSX, taxallus va define kerak
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

// O'lchangan qamrov (22/#03, 61.3 / 57.6 / 55.6 / 61.2 %) dan 1–2 punkt past:
// yangi kod testsiz qo'shilsa — npm run test:qamrov yiqiladi
const QAMROV_CHEGARASI = {
  lines: 60,
  functions: 55,
  branches: 53,
  statements: 60,
};

export default defineConfig({
  plugins: [react()],
  // 21/#19: vite.config.ts dagi define (u bu yerda o'qilmaydi)
  define: { __RELIZ__: JSON.stringify("test") },
  // 20/#02: @/ taxallusi — vite.config.ts dagidek (u bu yerda o'qilmaydi)
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  test: {
    // 22/#03: coverage — V8 o'zi yig'adi (kodni o'zgartirmaydi).
    // npm run test:qamrov → coverage/index.html. Chegara (thresholds) —
    // o'lchangan qiymatdan biroz past: tushib ketsa test yiqiladi
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/main.tsx"],
      reporter: ["text-summary", "html"],
      thresholds: QAMROV_CHEGARASI,
    },
    projects: [
      {
        // extends: true — yuqoridagi plugins/define/resolve meros olinadi
        extends: true,
        test: {
          name: "mantiq",
          environment: "node",
          include: ["tekshiruv/**/*.test.js"],
        },
      },
      {
        extends: true,
        test: {
          name: "komponent",
          environment: "jsdom",
          include: ["tekshiruv/**/*.test.tsx"],
          setupFiles: ["tekshiruv/vitest-sozlash.ts"],
        },
      },
      {
        // 22/#08: Browser Mode — HAQIQIY Chrome (headless, Playwright
        // orqali, tizimdagi Chrome: channel "chrome" — brauzer yuklanmaydi).
        // jsdom'da yo'q narsalar uchun: <dialog>.showModal, fokus, :modal,
        // lazy() chunk. Sekinroq — shuning uchun alohida: npm run test:brauzer
        extends: true,
        // MSW service worker (mockServiceWorker.js) shu papkadan "/" ga
        publicDir: "tekshiruv/msw/ommaviy",
        test: {
          name: "brauzer",
          include: ["tekshiruv/**/*.brauzer.tsx"],
          setupFiles: ["tekshiruv/brauzer-sozlash.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { channel: "chrome" },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        // 22/#12: har story — test: render (xatosiz chiziladi), play
        // funksiyasi (harakat + expect) va a11y (axe, preview.tsx). Story
        // fayllarining o'zi — testlar; alohida *.test.tsx yozilmaydi
        extends: true,
        plugins: [storybookTest({ configDir: ".storybook" })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { channel: "chrome" },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        // Haqiqiy mashq API (internet kerak) — npm test da YO'Q,
        // faqat npm run test:tarmoq (--project tarmoq)
        extends: true,
        test: {
          name: "tarmoq",
          environment: "node",
          include: ["tekshiruv/**/*.tarmoq.js"],
        },
      },
    ],
  },
});
