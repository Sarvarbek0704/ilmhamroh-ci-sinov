// tarmoq.spec.ts — 22/#10: page.route bilan tarmoqni boshqarish — server
// xatosi, uzilish, sekin javob. Har biri ilovaning "yomon kun" holati:
// haqiqiy serverda buni ataylab qilib bo'lmaydi
import { expect, test } from "@playwright/test";
import { soxtaApi } from "./soxta-api.ts";

const API = "**/api/mashq/vazifalar/**";

test("server 500 — umumiy xato matni, «Qayta urinish» tuzalgan serverdan oladi", async ({
  page,
}) => {
  const server = await soxtaApi(page);
  // Keyin qo'shilgan route birinchi tekshiriladi: GET — 500, qolgani
  // route.fallback() bilan oldingi (soxtaApi) handlerga
  let buzuq = true;
  await page.route(API, (route) =>
    buzuq && route.request().method() === "GET"
      ? route.fulfill({ status: 500, json: { xato: "Ataylab" } })
      : route.fallback(),
  );
  await page.goto("/");
  // Ilova sabab bo'yicha ajratmaydi (500 ham, uzilish ham — bir xil matn)
  await expect(page.locator("#aloqa")).toHaveText(
    "Serverga ulanib bo'lmadi. Ro'yxat — shu brauzerdagi nusxa.",
  );
  buzuq = false;
  await page.getByRole("button", { name: "Qayta urinish" }).click();
  await expect(page.locator("#aloqa")).toHaveText("");
  // 22/#13: tugma hidden atributi bilan yashirinadi — Tailwind inline-flex
  // uni bosib ketardi (visual regression topdi, asos.css da tuzatildi)
  await expect(
    page.getByRole("button", { name: "Qayta urinish" }),
  ).toBeHidden();
  expect(server.sorovlar).toContain("GET");
});

test("tarmoq uzildi (route.abort) — shu brauzerdagi nusxa ko'rinadi", async ({
  page,
}) => {
  await page.route(API, (route) => route.abort("internetdisconnected"));
  await page.goto("/");
  await expect(page.locator("#aloqa")).toHaveText(
    "Serverga ulanib bo'lmadi. Ro'yxat — shu brauzerdagi nusxa.",
  );
  await expect(
    page.getByRole("textbox", { name: "Yangi vazifa" }),
  ).toBeEnabled();
});

test("sekin server — yuklanish holati ko'rinadi, keyin ro'yxat", async ({
  page,
}) => {
  await soxtaApi(page);
  await page.route(API, async (route) => {
    await new Promise((tayyor) => setTimeout(tayyor, 1500));
    await route.fallback();
  });
  await page.goto("/");
  await expect(page.locator("#aloqa")).not.toHaveText("");
  await expect(
    page.getByRole("checkbox", { name: "Non olish #bozor" }),
  ).toBeVisible();
  await expect(page.locator("#aloqa")).toHaveText("");
});
