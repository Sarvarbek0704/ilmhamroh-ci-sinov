// vizual.spec.ts — 22/#13: visual regression — sahifa surati "oltin"
// rasm bilan piksel bo'yicha solishtiriladi (toHaveScreenshot). Birinchi
// marta: npx playwright test --project=vizual --update-snapshots
// Rasmlar — e2e/vizual.spec.ts-snapshots/*-vizual-<platforma>.png: Windows
// va Linux shriftni boshqacha chizadi, shuning uchun nomida platforma bor
// (win32/linux) va CI uchun oltin rasm Linux'da yaratiladi (QADAMLAR #13)
import { expect, test } from "@playwright/test";
import { soxtaApi } from "./soxta-api.ts";

// tayyor — sahifa ma'lumot bilan chizilganini bildiradigan sarlavha
const SAHIFALAR = [
  { nomi: "royxat", yol: "/", tayyor: "Non olish #bozor" },
  { nomi: "sozlamalar", yol: "/sozlamalar", tayyor: "Sozlamalar" },
  { nomi: "vazifa", yol: "/vazifa/1", tayyor: "Non olish #bozor" },
] as const;

for (const tema of ["light", "dark"] as const) {
  test.describe(`${tema} tema`, () => {
    // Ilova "tizim" temasida — brauzerning prefers-color-scheme i
    test.use({ colorScheme: tema });

    for (const { nomi, yol, tayyor } of SAHIFALAR) {
      test(`${nomi} sahifasi`, async ({ page }) => {
        await soxtaApi(page);
        await page.goto(yol);
        // Server javobi kelib, sahifa ma'lumot bilan chizilguncha kutamiz
        await expect(
          page.getByText(tayyor, { exact: true }).first(),
        ).toBeVisible();
        await expect(page).toHaveScreenshot(`${nomi}-${tema}.png`, {
          fullPage: true,
          // Motion (JS) animatsiyalari ham — "disabled" CSS'ni to'xtatadi,
          // qolganini sahifa tinchlanguncha Playwright o'zi kutadi
          animations: "disabled",
          // Kursor (caret) miltillashi — har suratda boshqacha
          caret: "hide",
        });
      });
    }
  });
}
