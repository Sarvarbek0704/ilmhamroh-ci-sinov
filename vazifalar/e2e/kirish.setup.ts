// kirish.setup.ts — 22/#09: "kirish" loyihasi (playwright.config.ts).
// Bir marta UI orqali kiramiz va brauzer holatini (cookie, localStorage)
// faylga yozamiz — qolgan testlar storageState bilan kirgan holda
// boshlanadi (har testda forma to'ldirilmaydi). 28-qism: email + parol,
// kimlik — cookie'da (soxta API uni Set-Cookie bilan beradi)
import { expect, test as setup } from "@playwright/test";
import { soxtaApi } from "./soxta-api.ts";

const HOLAT = "e2e/.auth/foydalanuvchi.json";

setup("kirish", async ({ page }) => {
  await soxtaApi(page);
  await page.goto("/kirish");
  await page.getByLabel("Email").fill("s@example.com");
  await page.getByLabel("Parol").fill("Bahor-choyxona-2026");
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("textbox", { name: "Yangi vazifa" }),
  ).toBeVisible();
  await page.context().storageState({ path: HOLAT });
});
