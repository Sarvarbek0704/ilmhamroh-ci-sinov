// harakatlar.test.tsx — 22/#05: user-event — foydalanuvchi kabi harakat.
// fireEvent bitta hodisa yuboradi; userEvent.type esa har harf uchun
// keydown → keypress → beforeinput → input → keyup, fokus va tanlovni
// ham o'zgartiradi (brauzerdagidek). Har test: const user = userEvent.setup()
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App.tsx";
import { chiz } from "./yordamchi/chiz.tsx";
import { TilTanlov } from "../src/komponentlar/TilTanlov.tsx";
import { tilniAlmashtir } from "../src/i18n/index.ts";
import type { VazifaMalumoti } from "../src/turlar.ts";
import { serverRoyxati, sorovlar } from "./msw/soxta-api.ts";

// vi.mock — modulning bitta eksportini almashtirish (qolgani asl).
// Vitest uni fayl boshiga "ko'taradi" (hoisting): importlardan oldin
// ishlaydi. tilniAlmashtir location.assign qiladi — jsdom'da navigatsiya
// yo'q ("Not implemented"), bizga faqat "qaysi til bilan chaqirildi" kerak
vi.mock("../src/i18n/index.ts", async (asl) => ({
  ...(await asl<typeof import("../src/i18n/index.ts")>()),
  tilniAlmashtir: vi.fn(),
}));

// Server — MSW (22/#07, tekshiruv/msw/soxta-api.ts): GET — ro'yxat,
// POST — yangi vazifa, PATCH — o'zgargan vazifa; sorovlar() — ketganlari.
// #05 da shu yerda 25 qatorli qo'lda fetch soxtasi bor edi

const ROYXAT: readonly VazifaMalumoti[] = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sabzi #bozor", bajarildi: true },
];

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/");
});
afterEach(() => vi.restoreAllMocks());

async function ilovaniOch() {
  serverRoyxati(ROYXAT);
  chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
    router: "brauzer",
  });
  await waitFor(() =>
    expect(document.getElementById("aloqa")).toHaveTextContent(""),
  );
}

describe("foydalanuvchi harakatlari (user-event)", () => {
  test("vazifa qo'shish: yozish + Enter — qator, maydon bo'sh va fokusda", async () => {
    const user = userEvent.setup();
    await ilovaniOch();
    const maydon = screen.getByRole("textbox", {
      name: "Yangi vazifa",
    });
    await user.type(maydon, "Sut olish{Enter}");
    // findBy* — paydo bo'lguncha kutadi (sukut: 1 s)
    expect(
      await screen.findByRole("checkbox", { name: "Sut olish" }),
    ).toBeInTheDocument();
    // 22/#15 (beqaror edi): qator optimistik — DARHOL; maydonni esa React
    // action TUGAGACH tozalaydi (form reset). Odatda bir vaqtda, lekin yuk
    // ostida reset kechroq — sinxron tekshiruv 5 tadan 1 da yiqildi
    await waitFor(() => expect(maydon).toHaveValue(""));
    expect(maydon).toHaveFocus();
    await waitFor(() => expect(sorovlar()).toContain("POST"));
  });

  test("bo'sh matn: Enter — xato e'lon qilinadi, so'rov yo'q", async () => {
    const user = userEvent.setup();
    await ilovaniOch();
    await user.click(
      screen.getByRole("textbox", { name: "Yangi vazifa" }),
    );
    await user.keyboard("{Enter}");
    expect(
      await screen.findByText("Vazifa matnini yozing."),
    ).toBeInTheDocument();
    expect(sorovlar().filter((s) => s.startsWith("POST"))).toEqual([]);
  });

  test("katakcha: bosish — bajarildi, PATCH ketadi", async () => {
    const user = userEvent.setup();
    await ilovaniOch();
    // Katak nomi — <label> matni (vazifa matni)
    const katak = screen.getByRole("checkbox", {
      name: "Non olish #bozor",
    });
    expect(katak).not.toBeChecked();
    await user.click(katak);
    expect(katak).toBeChecked(); // optimistik — darhol
    await waitFor(() => expect(sorovlar()).toContain("PATCH /1"));
  });

  test("filtr: «Bajarilgan» — bitta qator, URL'da", async () => {
    const user = userEvent.setup();
    await ilovaniOch();
    await user.click(
      screen.getByRole("button", { name: "Bajarilgan" }),
    );
    expect(
      screen.getByRole("button", { name: "Bajarilgan" }),
    ).toBePressed();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(location.search).toBe("?filtr=bajarilgan");
  });
});

describe("TilTanlov", () => {
  test("klaviatura: Tab bilan guruhga, ↓ — keyingi til tanlanadi", async () => {
    const user = userEvent.setup();
    render(<TilTanlov />);
    await user.tab();
    expect(
      screen.getByRole("radio", { name: "O'zbekcha" }),
    ).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(vi.mocked(tilniAlmashtir)).toHaveBeenCalledExactlyOnceWith(
      "uz-Cyrl",
    );
  });
});
