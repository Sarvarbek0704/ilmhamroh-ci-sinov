// VazifaRoyxati.test.tsx — ro'yxat komponentlari (17/#09, #11, #41). Testing
// Library: elementni foydalanuvchi ko'rgandek topamiz — roli va nomi
// bilan (getByRole), CSS selektor bilan emas
import { describe, expect, test, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
// 19/#03: qatorda <Link> — router konteksti kerak (xotiradagi router)
import { MemoryRouter } from "react-router";
import { VazifaRoyxati } from "../src/komponentlar/VazifaRoyxati.tsx";
import { QatorAmallariKonteksti } from "../src/kontekst/qator-amallari.ts";
import type { QatorAmallari } from "../src/turlar.ts";

// vi.fn() — "josus" funksiya: necha marta, qaysi argument bilan
// chaqirilganini eslab qoladi
function amallarYasa(): QatorAmallari {
  return {
    onAlmashtir: vi.fn(),
    onOchir: vi.fn(),
    onTahrirla: vi.fn(),
    onSaqla: vi.fn(),
    onBekor: vi.fn(),
    tugmaRef: () => () => undefined,
  };
}

const vazifalar = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "DOM darsini takrorlash", bajarildi: true },
];

// <li> lar <ul> ichida bo'lishi kerak — haqiqiy sahifadagidek
function chiz(
  sorov = "",
  tahrirId: number | null = null,
  amallar = amallarYasa(),
) {
  // Hodisalar — Context orqali (17/#41), App'dagidek
  return render(
    <QatorAmallariKonteksti value={amallar}>
      <ul>
        <VazifaRoyxati
          vazifalar={vazifalar}
          sorov={sorov}
          tahrirId={tahrirId}
        />
      </ul>
    </QatorAmallariKonteksti>,
    { wrapper: MemoryRouter },
  );
}

describe("VazifaRoyxati", () => {
  test("har vazifaga qator: katak, yorliq, ikki tugma", () => {
    chiz();
    const qatorlar = screen.getAllByRole("listitem");
    expect(qatorlar).toHaveLength(2);
    const birinchi = within(qatorlar[0]!);
    expect(
      birinchi.getByRole("checkbox", { name: "Non olish #bozor" }),
    ).toHaveProperty("checked", false);
    expect(
      birinchi.getByRole("button", {
        name: "Tahrirlash: Non olish #bozor",
      }),
    ).toBeTruthy();
    expect(
      birinchi.getByRole("button", {
        name: "O'chirish: Non olish #bozor",
      }),
    ).toBeTruthy();
    // 19/#03: vazifa sahifasiga havola (basename'siz — xotiradagi router)
    expect(
      birinchi
        .getByRole("link", { name: "Batafsil: Non olish #bozor" })
        .getAttribute("href"),
    ).toBe("/vazifa/1");
  });

  test("bajarilgan: katak belgilangan, qator klassi", () => {
    chiz();
    const katak = screen.getByRole("checkbox", {
      name: "DOM darsini takrorlash",
    });
    expect(katak).toHaveProperty("checked", true);
    expect(katak.closest("li")?.className).toBe("bajarildi");
  });

  test("qidiruvga mos bo'lak <mark> ichida, yorliq matni to'liq", () => {
    const { container } = chiz("NON");
    const belgilar = [...container.querySelectorAll("mark")];
    expect(belgilar.map((m) => m.textContent)).toEqual(["Non"]);
    expect(
      screen.getByRole("checkbox", { name: "Non olish #bozor" }),
    ).toBeTruthy();
  });

  test("tahrirdagi qator: maydon va Saqlash/Bekor qilish", () => {
    chiz("", 1);
    const maydon = screen.getByRole("textbox", {
      name: "Vazifa matni",
    });
    expect(maydon).toHaveProperty("value", "Non olish #bozor");
    expect(
      screen.queryByRole("checkbox", { name: "Non olish #bozor" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Saqlash: Non olish #bozor" }),
    ).toBeTruthy();
  });

  test("foydalanuvchi matni HTML bo'lib qolmaydi", () => {
    const { container } = render(
      <QatorAmallariKonteksti value={amallarYasa()}>
        <ul>
          <VazifaRoyxati
            vazifalar={[
              {
                id: 7,
                matn: "<img src=x onerror=alert(1)>",
                bajarildi: false,
              },
            ]}
            sorov=""
            tahrirId={null}
          />
        </ul>
      </QatorAmallariKonteksti>,
      { wrapper: MemoryRouter },
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("label")?.textContent).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  test("hodisalar: katak, tahrirlash va o'chirish — vazifa id bilan", () => {
    const amallar = amallarYasa();
    chiz("", null, amallar);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Non olish #bozor" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Tahrirlash: DOM darsini takrorlash",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "O'chirish: Non olish #bozor",
      }),
    );
    expect(amallar.onAlmashtir).toHaveBeenCalledWith(1);
    expect(amallar.onTahrirla).toHaveBeenCalledWith(2);
    expect(amallar.onOchir).toHaveBeenCalledWith(1);
  });

  test("controlled katak: bosilsa ham holat o'zgarmaguncha eski qiymat", () => {
    chiz();
    const katak = screen.getByRole("checkbox", {
      name: "Non olish #bozor",
    });
    fireEvent.click(katak);
    // onAlmashtir holatni o'zgartirmadi — React katakni qaytardi
    expect(katak).toHaveProperty("checked", false);
  });

  test("tahrir: Enter — saqlash, Esc — bekor, IME tanlovidagi Enter — yo'q", () => {
    const amallar = amallarYasa();
    chiz("", 1, amallar);
    const maydon = screen.getByRole("textbox", {
      name: "Vazifa matni",
    });
    fireEvent.keyDown(maydon, { key: "Enter", isComposing: true });
    expect(amallar.onSaqla).not.toHaveBeenCalled();
    // Controlled (17/#18): yozilgan matn state'da, saqlashga o'sha ketadi
    fireEvent.change(maydon, { target: { value: "Non va sut olish" } });
    expect(maydon).toHaveProperty("value", "Non va sut olish");
    fireEvent.keyDown(maydon, { key: "Enter" });
    fireEvent.keyDown(maydon, { key: "Escape" });
    expect(amallar.onSaqla).toHaveBeenCalledTimes(1);
    expect(amallar.onSaqla).toHaveBeenCalledWith("Non va sut olish");
    expect(amallar.onBekor).toHaveBeenCalledTimes(1);
  });

  test("Context'siz qator — aniq xato (useQatorAmallari null tekshiruvi)", () => {
    const jim = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <ul>
          <VazifaRoyxati
            vazifalar={vazifalar}
            sorov=""
            tahrirId={null}
          />
        </ul>,
      ),
    ).toThrow(
      "useQatorAmallari() — <QatorAmallariKonteksti value> ichida",
    );
    jim.mockRestore();
  });
});
