// dialoglar.brauzer.tsx — 22/#08: Vitest Browser Mode, haqiqiy Chrome.
// jsdom 30 da HTMLDialogElement.showModal YO'Q (22/#04 topdi) — o'chirish
// dialogi va buyruqlar oynasi u yerda umuman ochilmasdi. Bu yerda:
// - page.getByRole — Playwright uslubidagi lokator (kutadi, qayta urinadi)
// - expect.element(...) — shart bajarilguncha qayta tekshiradi (waitFor shart emas)
// - userEvent (vitest/browser) — CDP orqali HAQIQIY klaviatura/sichqoncha
//   hodisalari (user-event kutubxonasi kabi taqlid emas)
import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { createRef } from "react";
import { render } from "@testing-library/react";
import { App } from "../src/App.tsx";
import { OchirishDialog } from "../src/komponentlar/OchirishDialog.tsx";
import { BuyruqlarOynasi } from "../src/komponentlar/BuyruqlarOynasi.tsx";
import { TooltipProvider } from "../src/ui/tooltip.tsx";
import { chiz } from "./yordamchi/chiz.tsx";
import { serverRoyxati, sorovlar } from "./msw/soxta-api.ts";
import type { VazifaMalumoti } from "../src/turlar.ts";

function dialogniOch(onJavob = vi.fn()) {
  const ref = createRef<HTMLDialogElement>();
  render(
    <>
      <button type="button">Orqadagi tugma</button>
      <OchirishDialog ref={ref} matn="Non olish" onJavob={onJavob} />
    </>,
  );
  ref.current?.showModal();
  return { dialog: ref.current, onJavob };
}

describe("OchirishDialog — native <dialog> (showModal)", () => {
  test("modal: nomi, tavsifi, fokus «Bekor qilish»da", async () => {
    const { dialog } = dialogniOch();
    const oyna = page.getByRole("dialog", {
      name: "Vazifa o'chirilsinmi?",
    });
    await expect.element(oyna).toBeVisible();
    await expect
      .element(oyna)
      .toHaveAccessibleDescription(
        "«Non olish» ro'yxatdan o'chiriladi.",
      );
    expect(dialog?.matches(":modal")).toBe(true);
    await expect
      .element(page.getByRole("button", { name: "Bekor qilish" }))
      .toHaveFocus();
  });

  test("Esc — yopiladi, javob false", async () => {
    const { onJavob } = dialogniOch();
    await userEvent.keyboard("{Escape}");
    await expect
      .element(page.getByRole("dialog"))
      .not.toBeInTheDocument();
    expect(onJavob).toHaveBeenCalledExactlyOnceWith(false);
  });

  test("«O'chirish» — form method=dialog, returnValue → javob true", async () => {
    const { onJavob } = dialogniOch();
    await page.getByRole("button", { name: "O'chirish" }).click();
    await vi.waitFor(() =>
      expect(onJavob).toHaveBeenCalledExactlyOnceWith(true),
    );
  });

  test("orqa fon inert: Tab dialogdan tashqaridagi tugmaga o'tmaydi", async () => {
    dialogniOch();
    const orqa = page.getByRole("button", {
      name: "Orqadagi tugma",
      includeHidden: true,
    });
    for (let i = 0; i < 3; i++) {
      await userEvent.keyboard("{Tab}");
      await expect.element(orqa).not.toHaveFocus();
    }
    // Eslatma: page.getByRole DOM bo'yicha qidiradi (a11y daraxti emas) —
    // inert orqa fon uchun ham elementni topadi; tekshiruv — fokus orqali
  });
});

describe("BuyruqlarOynasi — Ctrl+K, lazy chunk, fokus qaytishi", () => {
  test("Ctrl+K — oyna, qidiruv maydoni fokusda; Esc — fokus qaytadi", async () => {
    chiz(
      <TooltipProvider>
        <input aria-label="Boshqa maydon" />
        <BuyruqlarOynasi />
      </TooltipProvider>,
    );
    const boshqa = page.getByRole("textbox", { name: "Boshqa maydon" });
    await boshqa.click();
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect
      .element(page.getByRole("dialog", { name: "Buyruqlar" }))
      .toBeVisible();
    // Birinchi ochilishda BuyruqlarRoyxati chunk'i (cmdk) yuklanadi —
    // maydon kelgach fokusni o'zi oladi (20/#11)
    await expect.element(page.getByRole("combobox")).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect
      .element(page.getByRole("dialog", { name: "Buyruqlar" }))
      .not.toBeInTheDocument();
    await expect.element(boshqa).toHaveFocus();
  });
});

const ROYXAT: readonly VazifaMalumoti[] = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sabzi #bozor", bajarildi: true },
];

describe("App — o'chirish oqimi (MSW service worker bilan)", () => {
  test("«O'chirish» → dialog → tasdiq: qator yo'q, DELETE /1 ketdi", async () => {
    localStorage.clear();
    serverRoyxati(ROYXAT);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />);
    await page
      .getByRole("button", { name: "O'chirish: Non olish #bozor" })
      .click();
    await expect
      .element(
        page.getByRole("dialog", { name: "Vazifa o'chirilsinmi?" }),
      )
      .toBeVisible();
    await page
      .getByRole("button", { name: "O'chirish", exact: true })
      .click();
    await expect
      .element(page.getByRole("checkbox", { name: "Non olish #bozor" }))
      .not.toBeInTheDocument();
    await vi.waitFor(() => expect(sorovlar()).toContain("DELETE /1"));
  });
});
