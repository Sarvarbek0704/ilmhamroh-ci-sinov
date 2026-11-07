// a11y.spec.ts — 22/#14: accessibility testlari. Ikki qism:
// 1) axe-core (@axe-core/playwright) — avtomatik qoidalar (WCAG 2.2 AA +
//    best-practice): kontrast, nomlar, rollar, ro'yxat tuzilishi …
//    Avtomatika xatolarning taxminan uchdan birini topadi — qolgani:
// 2) klaviatura oqimi — sichqonchasiz foydalanuvchi yo'li, fokus qayerda
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { soxtaApi } from "./soxta-api.ts";

// Zavod tekshiruvi (olchov/a11y.mjs) bilan bir xil teglar
const TEGLAR = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

async function axeBuzilishlari(page: Page) {
  const natija = await new AxeBuilder({ page })
    .withTags(TEGLAR)
    .analyze();
  // Xato bo'lsa — qaysi qoida va qaysi element (hisobotda o'qiladi)
  return natija.violations.map(
    (b) =>
      `${b.id}: ${b.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
}

test.describe("axe — buzilish 0", () => {
  for (const tema of ["light", "dark"] as const) {
    test(`ro'yxat (${tema})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: tema });
      await soxtaApi(page);
      await page.goto("/");
      await expect(
        page.getByRole("checkbox", { name: "Non olish #bozor" }),
      ).toBeVisible();
      expect(await axeBuzilishlari(page)).toEqual([]);
    });
  }

  test("buyruqlar oynasi ochiq (Ctrl+K)", async ({ page }) => {
    await soxtaApi(page);
    await page.goto("/");
    await page.keyboard.press("Control+k");
    // "combobox" sahifada ikkita (tartib <select> i ham) — oyna ichidan
    await expect(
      page
        .getByRole("dialog", { name: "Buyruqlar" })
        .getByRole("combobox"),
    ).toBeFocused();
    expect(await axeBuzilishlari(page)).toEqual([]);
  });

  test("o'chirish dialogi ochiq", async ({ page }) => {
    await soxtaApi(page);
    await page.goto("/");
    await page
      .getByRole("button", { name: "O'chirish: Non olish #bozor" })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await axeBuzilishlari(page)).toEqual([]);
  });

  for (const yol of ["/sozlamalar", "/vazifa/1", "/ru/sozlamalar"]) {
    test(`sahifa ${yol}`, async ({ page }) => {
      await soxtaApi(page);
      await page.goto(yol);
      await expect(
        page.getByRole("heading", { level: 2 }).first(),
      ).toBeVisible();
      expect(await axeBuzilishlari(page)).toEqual([]);
    });
  }
});

test.describe("klaviatura oqimi", () => {
  test("birinchi Tab — o'tkazib yuborish havolasi, Enter — ro'yxatga", async ({
    page,
  }) => {
    await soxtaApi(page);
    await page.goto("/");
    await page.keyboard.press("Tab");
    const havola = page.getByRole("link", { name: "Ro'yxatga o'tish" });
    await expect(havola).toBeFocused();
    await page.keyboard.press("Enter");
    // Fokus havola ko'rsatgan joyga ko'chdi (endi havolada emas)
    await expect(havola).not.toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("Ctrl+K → «Statistika» → Enter: sahifa, fokus sarlavhada", async ({
    page,
  }) => {
    await soxtaApi(page);
    await page.goto("/");
    await page.keyboard.press("Control+k");
    // Oyna ichi — kech yuklanadigan chunk (cmdk): maydon kelguncha kutamiz,
    // aks holda yozilgan harflar hech qayerga tushmaydi
    await expect(
      page
        .getByRole("dialog", { name: "Buyruqlar" })
        .getByRole("combobox"),
    ).toBeFocused();
    await page.keyboard.type("Statistika");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/statistika");
    await expect(
      page.getByRole("heading", { name: "Statistika", exact: true }),
    ).toBeFocused();
  });

  test("o'chirish dialogi: Enter ochadi, fokus «Bekor qilish»da, Esc — fokus qaytadi", async ({
    page,
  }) => {
    await soxtaApi(page);
    await page.goto("/");
    const tugma = page.getByRole("button", {
      name: "O'chirish: Non olish #bozor",
    });
    await tugma.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Bekor qilish" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(tugma).toBeFocused();
  });
});

test.describe("kirmagan foydalanuvchi", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("kirish sahifasi — axe 0; bo'sh forma — xato e'lon qilinadi, fokus maydonda", async ({
    page,
  }) => {
    await page.goto("/kirish");
    expect(await axeBuzilishlari(page)).toEqual([]);
    await page.getByLabel("Email").press("Enter");
    const maydon = page.getByLabel("Email");
    await expect(maydon).toHaveAttribute("aria-invalid", "true");
    await expect(maydon).toBeFocused();
    await expect(page.locator("#kirish-xato")).not.toHaveText("");
  });
});
