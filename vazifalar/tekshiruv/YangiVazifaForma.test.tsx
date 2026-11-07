// YangiVazifaForma.test.tsx — forma state'i (17/#12): xato, takliflar,
// natijaga qarab maydonni tozalash. 18/#05–#06 dan yuborish — <form
// action> + useActionState: action async, natija action TUGAGACH
// chiziladi — shuning uchun yuborish await act(...) ichida
import { describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { YangiVazifaForma } from "../src/komponentlar/YangiVazifaForma.tsx";
import type { QoshishNatijasi } from "../src/turlar.ts";

const TEGLAR = ["#bozor", "#bozorlik", "#oila"];

function chiz(natija: QoshishNatijasi = { tur: "qoshildi" }) {
  const onQosh = vi.fn<(matn: string) => Promise<QoshishNatijasi>>(() =>
    Promise.resolve(natija),
  );
  const onYoz = vi.fn();
  render(
    <YangiVazifaForma
      boshlangichMatn="Qoralama"
      xatoniTop={(matn) =>
        matn === "" ? "Vazifa matnini yozing." : null
      }
      takliflarniTop={(joriy) =>
        joriy === null
          ? []
          : TEGLAR.filter((t) => t.startsWith(joriy.prefiks))
      }
      onYoz={onYoz}
      onQosh={onQosh}
    />,
  );
  const maydon = screen.getByRole<HTMLInputElement>("textbox", {
    name: "Yangi vazifa",
  });
  // Haqiqiy brauzerdagidek: qiymat o'zgaradi, keyin input hodisasi
  const yoz = (matn: string) =>
    fireEvent.input(maydon, { target: { value: matn } });
  // Forma action'i — async: natijani act kutadi
  const yubor = () =>
    act(async () => {
      fireEvent.submit(maydon.form!);
    });
  return { maydon, onQosh, onYoz, yoz, yubor };
}

describe("YangiVazifaForma", () => {
  test("boshlang'ich qiymat — qoralama", () => {
    expect(chiz().maydon.value).toBe("Qoralama");
  });

  test("xato: matni ko'rinadi, maydon aria-invalid va aria-describedby", async () => {
    const { maydon, yoz, yubor } = chiz({
      tur: "xato",
      xabar: "Vazifa matnini yozing.",
    });
    yoz("");
    await yubor();
    expect(screen.getByRole("status").textContent).toBe(
      "Vazifa matnini yozing.",
    );
    expect(maydon.getAttribute("aria-invalid")).toBe("true");
    expect(maydon.getAttribute("aria-describedby")).toBe(
      "yangi-matn-xato",
    );
    // Tuzatildi — xato o'sha zahoti yo'qoladi (state)
    yoz("Non olish");
    expect(screen.getByRole("status").textContent).toBe("");
    expect(maydon.hasAttribute("aria-invalid")).toBe(false);
  });

  test("qo'shildi — maydon bo'shaydi (qoralamaga qaytmaydi)", async () => {
    const { maydon, onQosh, yoz, yubor } = chiz();
    yoz("  Sabzi olish ");
    await yubor();
    expect(onQosh).toHaveBeenCalledWith("Sabzi olish");
    expect(maydon.value).toBe("");
  });

  test("saqlanmadi (oflayn) — matn maydonda qoladi", async () => {
    const { maydon, yoz, yubor } = chiz({ tur: "saqlanmadi" });
    yoz("Sabzi olish");
    await yubor();
    expect(maydon.value).toBe("Sabzi olish");
  });

  test("18/#06 xato: React formani tozalaydi (reset), lekin matn joyida — useActionState", async () => {
    const { maydon, yoz, yubor } = chiz({
      tur: "xato",
      xabar: "Bu vazifa ro'yxatda allaqachon bor.",
    });
    yoz("non OLISH");
    await yubor();
    expect(maydon.value).toBe("non OLISH");
    expect(maydon.defaultValue).toBe("non OLISH");
  });

  test("18/#06 useFormStatus: server kutilayotganda tugma «Qo'shilmoqda…»", async () => {
    let hal: (n: QoshishNatijasi) => void = () => {};
    const { maydon, onQosh, yoz, yubor } = chiz();
    onQosh.mockImplementation(
      () => new Promise<QoshishNatijasi>((r) => (hal = r)),
    );
    const tugma = screen.getByRole("button", { name: "Qo'shish" });
    yoz("Sabzi olish");
    await yubor();
    expect(tugma.textContent).toBe("Qo'shilmoqda…");
    expect(maydon.value).toBe("Sabzi olish"); // hali tozalanmagan
    await act(async () => {
      hal({ tur: "qoshildi" });
    });
    expect(tugma.textContent).toBe("Qo'shish");
    expect(maydon.value).toBe("");
  });

  test("teg takliflari: # dan keyin chiqadi, tanlansa — qo'yiladi va yopiladi", () => {
    const { maydon, onYoz, yoz } = chiz();
    // Yashirin guruh: getByRole uni nomi bilan topmadi (jsdom) — id bilan
    const guruh = document.getElementById("teg-takliflari")!;
    expect(guruh.hidden).toBe(true);
    yoz("Guruch #bo");
    expect(guruh.hidden).toBe(false);
    expect(
      screen
        .getAllByRole("button", { name: /^#/ })
        .map((t) => t.textContent),
    ).toEqual(["#bozor", "#bozorlik"]);
    fireEvent.click(screen.getByRole("button", { name: "#bozor" }));
    expect(maydon.value).toBe("Guruch #bozor ");
    expect(document.activeElement).toBe(maydon);
    expect(guruh.hidden).toBe(true);
    expect(onYoz).toHaveBeenLastCalledWith("Guruch #bozor ");
  });

  test("Esc — takliflar yopiladi, matn joyida", () => {
    const { maydon, yoz } = chiz();
    yoz("Guruch #bo");
    fireEvent.keyDown(maydon, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "#bozor" })).toBeNull();
    expect(maydon.value).toBe("Guruch #bo");
  });
});
