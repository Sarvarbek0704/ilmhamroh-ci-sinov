// sorovlar.test.tsx — 22/#04: RTL so'rovlari va jest-dom matcherlari.
// Tartib (Testing Library tavsiyasi): getByRole → getByLabelText →
// getByText → … → getByTestId (oxirgi chora). get* — yo'q bo'lsa xato,
// query* — null (yo'qligini tekshirish uchun), find* — kutadi (async)
import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createRef } from "react";
import { Filtrlar } from "../src/komponentlar/Filtrlar.tsx";
import { OchirishDialog } from "../src/komponentlar/OchirishDialog.tsx";
import { Statistika } from "../src/komponentlar/Statistika.tsx";

describe("Filtrlar", () => {
  test("guruh nomi va tanlangan tugma — aria-pressed", () => {
    render(<Filtrlar filtr="faol" onFiltr={vi.fn()} />);
    const guruh = screen.getByRole("group", { name: "Filtr" });
    const tugmalar = within(guruh).getAllByRole("button");
    expect(tugmalar.map((t) => t.textContent)).toEqual([
      "Hammasi",
      "Faol",
      "Bajarilgan",
    ]);
    // jest-dom: o'qilishi oson va xato xabari aniq
    expect(screen.getByRole("button", { name: "Faol" })).toBePressed();
    expect(
      screen.getByRole("button", { name: "Hammasi" }),
    ).not.toBePressed();
  });

  test("pressed: false — so'rov filtri bilan", () => {
    render(<Filtrlar filtr="hammasi" onFiltr={vi.fn()} />);
    expect(
      screen.getAllByRole("button", { pressed: false }),
    ).toHaveLength(2);
  });
});

describe("OchirishDialog", () => {
  test("yopiq dialog ko'rinmaydi — rol so'rovida yo'q", () => {
    render(
      <OchirishDialog
        ref={createRef()}
        matn="Non olish"
        onJavob={vi.fn()}
      />,
    );
    // Yopiq <dialog> — kirish daraxtida yo'q: getByRole topmaydi
    expect(screen.queryByRole("dialog")).toBeNull();
    // hidden: true — yashirinlarni ham qidiradi (faqat test uchun)
    expect(
      screen.getByRole("dialog", { hidden: true }),
    ).not.toBeVisible();
  });

  test("ochiq dialog: nomi, tavsifi va tugmalari", () => {
    const ref = createRef<HTMLDialogElement>();
    render(
      <OchirishDialog ref={ref} matn="Non olish" onJavob={vi.fn()} />,
    );
    // jsdom 30 da showModal() YO'Q (TypeError, o'lchandi) — open
    // atributi bilan ochamiz. Haqiqiy modal (fokus, Esc, ::backdrop) —
    // brauzerda (#08 Browser Mode, #09 Playwright)
    expect(ref.current?.showModal).toBeUndefined();
    ref.current?.setAttribute("open", "");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAccessibleName("Vazifa o'chirilsinmi?");
    expect(dialog).toHaveAccessibleDescription(
      "«Non olish» ro'yxatdan o'chiriladi.",
    );
    expect(
      within(dialog).getByRole("button", { name: "O'chirish" }),
    ).toHaveAttribute("value", "ochir");
  });
});

describe("Statistika", () => {
  test("matn — foydalanuvchi o'qiydigan ko'rinishda", () => {
    render(
      <Statistika
        qoldi={2}
        bajarildi={1}
        teglar={new Map([["#bozor", 2]])}
        yopilgan={new Set()}
      />,
    );
    // Rolsiz <p> — matni bilan (getByText); aria-live — e'lon qilinadi
    expect(
      screen.getByText("2 ta vazifa qoldi, 1 ta bajarildi"),
    ).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(/^Teglar:/)).toHaveTextContent(
      "Teglar: #bozor — 2",
    );
  });
});
