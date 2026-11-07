// StatistikaPaneli.test.tsx — 18/#01, #03–#04, #09: transition + Suspense +
// use() + lazy()
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StatistikaPaneli } from "../src/xususiyatlar/statistika/index.ts";
// 18/#09: panel kodi lazy() bilan — testda modul oldindan yuklangan
// bo'lsin (Vite uni o'girishi soxta taymerlarga bog'liq emas)
import "../src/xususiyatlar/statistika/BatafsilStatistika.tsx";

const ROYXAT = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sabzi #bozor", bajarildi: true },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("StatistikaPaneli", () => {
  test("transition: hisob tayyor bo'lguncha eski ekran (fallback yo'q), keyin jadval", async () => {
    // Soxta taymerlar: hisob (setTimeout) biz aytgan paytda tugaydi
    vi.useFakeTimers();
    render(<StatistikaPaneli vazifalar={ROYXAT} />);
    const tugma = screen.getByRole("button", {
      name: "Batafsil statistika",
    });
    expect(tugma.getAttribute("aria-expanded")).toBe("false");
    // act kutiladi (await): to'xtagan komponentni React keyin qayta
    // boshlashi uchun (aks holda ogohlantirish va qayta urinish yo'q)
    await act(async () => {
      fireEvent.click(tugma);
    });
    // Promise hali hal bo'lmagan: panel yopiq, fallback YO'Q, isPending
    expect(tugma.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("batafsil-kutish")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe(
      "Hisoblanmoqda…",
    );
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const jadval = screen.getByRole("table");
    expect(tugma.getAttribute("aria-expanded")).toBe("true");
    expect(jadval.textContent).toContain("#bozor21");
    expect(
      document.getElementById("batafsil-umumiy")?.textContent,
    ).toBe(
      "2 ta vazifa, 1 tasi bajarilgan (50%). O'rtacha uzunlik — 14 belgi.",
    );
    expect(screen.getByRole("status").textContent).toBe("");
  });

  test("18/#11 <Activity>: yopib-ochganda tanlov (state) saqlanadi", async () => {
    vi.useFakeTimers();
    render(
      <StatistikaPaneli
        vazifalar={[
          ...ROYXAT,
          { id: 3, matn: "Kitob #aka", bajarildi: false },
        ]}
      />,
    );
    const tugma = screen.getByRole("button", {
      name: "Batafsil statistika",
    });
    await act(async () => {
      fireEvent.click(tugma);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const tanlov = screen.getByRole("combobox", {
      name: "Teglar tartibi",
    });
    fireEvent.change(tanlov, { target: { value: "alifbo" } });
    await act(async () => {
      fireEvent.click(tugma); // yopish
    });
    expect(tugma.getAttribute("aria-expanded")).toBe("false");
    await act(async () => {
      fireEvent.click(tugma); // qayta ochish
    });
    expect(tugma.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", {
        name: "Teglar tartibi",
      }).value,
    ).toBe("alifbo");
  });
});
