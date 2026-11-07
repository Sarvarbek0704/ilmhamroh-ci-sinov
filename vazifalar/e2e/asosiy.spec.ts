// asosiy.spec.ts — 22/#09: asosiy oqimlar haqiqiy brauzerda, production
// build ustida: qo'shish, tahrir, oflayn navbat, til, eksport, kirish.
// Har test — yangi brauzer konteksti (toza sahifa), lekin storageState
// bilan "kirgan" (kirish.setup.ts). API — soxtaApi (page.route)
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { soxtaApi } from "./soxta-api.ts";

test("qo'shish: Enter — qator paydo bo'ladi, POST ketadi", async ({
  page,
}) => {
  const server = await soxtaApi(page);
  await page.goto("/");
  const maydon = page.getByRole("textbox", { name: "Yangi vazifa" });
  await maydon.fill("Choy damlash");
  await maydon.press("Enter");
  await expect(
    page.getByRole("checkbox", { name: "Choy damlash" }),
  ).toBeVisible();
  await expect(maydon).toHaveValue("");
  await expect(maydon).toBeFocused();
  // expect.poll — oddiy qiymatni (bu yerda — server holati) kutadi
  await expect.poll(() => server.sorovlar).toContain("POST");
  expect(server.tanalar).toContain('POST {"matn":"Choy damlash"}');
});

test("tahrir: forma → PATCH, vazifa sahifasiga qaytadi", async ({
  page,
}) => {
  const server = await soxtaApi(page);
  await page.goto("/vazifa/1/tahrir");
  const matn = page.getByLabel("Matn");
  await expect(matn).toHaveValue("Non olish #bozor");
  await matn.fill("Non va sut olish #bozor");
  await page.getByRole("switch", { name: "Bajarildi" }).click();
  await page.getByRole("button", { name: "Saqlash" }).click();
  await expect(page).toHaveURL("/vazifa/1");
  await expect(
    page.getByRole("heading", { name: "Non va sut olish #bozor" }),
  ).toBeVisible();
  expect(server.tanalar).toContain(
    'PATCH /1 {"matn":"Non va sut olish #bozor","bajarildi":true}',
  );
});

test("oflayn: o'zgarish navbatda, internet qaytganda yuboriladi", async ({
  page,
  context,
}) => {
  const server = await soxtaApi(page);
  await page.goto("/");
  await expect(
    page.getByRole("checkbox", { name: "Non olish #bozor" }),
  ).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator("#aloqa")).toHaveText(
    "Internet yo'q. Ro'yxat — shu brauzerdagi nusxa.",
  );
  const maydon = page.getByRole("textbox", { name: "Yangi vazifa" });
  await maydon.fill("Oflayn vazifa");
  await maydon.press("Enter");
  await expect(
    page.getByRole("checkbox", { name: "Oflayn vazifa" }),
  ).toBeVisible();
  await expect(page.locator("#navbat")).toHaveText(
    "Navbatda: 1 ta o'zgarish — internet qaytganda yuboriladi.",
  );
  expect(server.sorovlar).not.toContain("POST");

  await context.setOffline(false);
  await expect(page.locator("#navbat")).toBeHidden();
  await expect.poll(() => server.sorovlar).toContain("POST");
  expect(server.vazifalar.map((v) => v.matn)).toContain(
    "Oflayn vazifa",
  );
});

test("til: /ru/ — ruscha; sozlamalarda English — /en/sozlamalar", async ({
  page,
}) => {
  await soxtaApi(page);
  await page.goto("/ru/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("link", { name: "Список" }),
  ).toBeVisible();
  // Til tanlovi — sozlamalar sahifasida (havola matni ham ruscha)
  await page.getByRole("link", { name: "Настройки" }).click();
  await page.getByRole("radio", { name: "English" }).click();
  await expect(page).toHaveURL("/en/sozlamalar");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("link", { name: "List" })).toBeVisible();
});

test("eksport: «Faylga yuklab olish» — JSON fayl, ichida ro'yxat", async ({
  page,
}) => {
  await soxtaApi(page);
  await page.goto("/");
  await expect(
    page.getByRole("checkbox", { name: "Non olish #bozor" }),
  ).toBeVisible();
  // Yuklab olish hodisasini bosishdan OLDIN kutamiz (aks holda o'tkazib
  // yuborilishi mumkin) — Promise'ni saqlab, keyin await
  const yuklash = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Faylga yuklab olish" })
    .click();
  const fayl = await yuklash;
  expect(fayl.suggestedFilename()).toMatch(/\.json$/);
  const matn = await readFile(await fayl.path(), "utf8");
  expect(matn).toContain("Non olish #bozor");
  expect(matn).toContain("Kitob o'qish #uy");
});

test.describe("kirmagan foydalanuvchi", () => {
  // Bu guruhda storageState bo'sh — "yangi brauzer"
  test.use({ storageState: { cookies: [], origins: [] } });

  test("himoyalangan sahifa → /kirish, kirgach — qaytadi", async ({
    page,
  }) => {
    await soxtaApi(page);
    await page.goto("/statistika");
    await expect(page).toHaveURL("/kirish?keyin=%2Fstatistika");
    await page.getByLabel("Email").fill("s@example.com");
    await page.getByLabel("Parol").fill("Bahor-choyxona-2026");
    await page.getByRole("button", { name: "Kirish" }).click();
    await expect(page).toHaveURL("/statistika");
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Statistika",
        exact: true,
      }),
    ).toBeVisible();
  });
});
