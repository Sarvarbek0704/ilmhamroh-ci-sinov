// App.test.tsx — butun ilova (17/#28): state, hosilaviy qiymatlar va
// effektlar. Server — MSW (22/#07, msw/soxta-api.ts): tarmoqqa chiqilmaydi
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  act,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react";
import { onlineManager } from "@tanstack/react-query";
// 22/#06: providerlar (Query, router, tema, store'lar) — chiz() ichida.
// router: "brauzer" — filtr URL'da, location.search tekshiriladi
import { chiz } from "./yordamchi/chiz.tsx";

import { App } from "../src/App.tsx";
import { Bildirishnoma } from "../src/komponentlar/Bildirishnoma.tsx";
import { useElon } from "../src/hooklar/useElon.ts";
import { useIlovaHolati } from "../src/ilova-holati.ts";
import type { VazifaMalumoti } from "../src/turlar.ts";
import { server } from "./msw/node.ts";
import { serverRoyxati, tarmoqYoq } from "./msw/soxta-api.ts";

const ROYXAT: readonly VazifaMalumoti[] = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sabzi #bozor", bajarildi: true },
  { id: 3, matn: "Kitob o'qish #uy", bajarildi: true },
];

// serverRoyxati(r) — MSW serveri shu ro'yxat bilan boshlaydi (versiya 1).
// 22/#07 gacha: vi.mocked(fetch).mockImplementation(() => new Response(…))

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
  // 19/#13: Query "offline" hodisasini global eslab qoladi (onlineManager)
  // — keyingi testlarning so'rovlari to'xtab qolmasin
  onlineManager.setOnline(true);
});

const matni = (id: string) => document.getElementById(id)?.textContent;

describe("App", () => {
  test("hisob va teglar ro'yxatdan; server tayyor — aloqa bo'sh", async () => {
    serverRoyxati(ROYXAT);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    expect(matni("hisob")).toBe("1 ta vazifa qoldi, 2 ta bajarildi");
    expect(matni("teglar")).toBe(
      "Teglar: #bozor — 2, #uy — 1. Yopilgan: #uy",
    );
    await waitFor(() => expect(matni("aloqa")).toBe(""));
  });

  test("effekt: server boshqa ro'yxat bersa — ekran va localStorage", async () => {
    const serverdagi = [
      { id: 9, matn: "Serverdagi vazifa", bajarildi: false },
    ];
    serverRoyxati(serverdagi);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    // 19/#10: 3 s — parallel test fayllari bilan (tekshir.sh) 14 dan 2
    // marta sukutdagi 1 s yetmadi (server javobi → effekt → chizish)
    await waitFor(
      () => expect(screen.getAllByRole("listitem")).toHaveLength(1),
      { timeout: 3000 },
    );
    expect(localStorage.getItem("vazifalar:v3")).toContain(
      "Serverdagi vazifa",
    );
  });

  test("filtr: state va URL", async () => {
    serverRoyxati(ROYXAT);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    fireEvent.click(screen.getByRole("button", { name: "Faol" }));
    expect(
      screen
        .getByRole("button", { name: "Faol" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(location.search).toBe("?filtr=faol");
    await waitFor(() => expect(matni("aloqa")).toBe(""));
  });

  test("server ishlamasa — xato matni va «Qayta urinish»", async () => {
    // MSW: HttpResponse.error() — fetch TypeError bilan yiqiladi
    server.use(tarmoqYoq);
    const ogohlantirish = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    await waitFor(() =>
      expect(matni("aloqa")).toBe(
        "Serverga ulanib bo'lmadi. Ro'yxat — shu brauzerdagi nusxa.",
      ),
    );
    expect(
      screen.getByRole("button", { name: "Qayta urinish" }),
    ).toBeTruthy();
    expect(ogohlantirish).toHaveBeenCalled();
  });

  test("online tinglovchilari ro'yxat o'zgarganda qayta ulanmaydi", async () => {
    serverRoyxati(ROYXAT);
    const ulash = vi.spyOn(window, "addEventListener");
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    await waitFor(() => expect(matni("aloqa")).toBe(""));
    const onlayn = () =>
      ulash.mock.calls.filter(([tur]) => tur === "online").length;
    // Effekt (#31) va useSyncExternalStore (#38) — har biri bir marta
    const boshida = onlayn();
    for (let i = 0; i < 3; i++) {
      fireEvent.click(
        screen.getByRole("checkbox", { name: "Non olish #bozor" }),
      );
    }
    expect(onlayn()).toBe(boshida);
  });

  test("useSyncExternalStore: internet uzilsa — darhol «oflayn»", async () => {
    serverRoyxati(ROYXAT);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    await waitFor(() => expect(matni("aloqa")).toBe(""));
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    act(() => {
      dispatchEvent(new Event("offline"));
    });
    expect(matni("aloqa")).toBe(
      "Internet yo'q. Ro'yxat — shu brauzerdagi nusxa.",
    );
  });
  test("18/#02 qidiruv: maydon darhol, ro'yxat kechiktirilgan — oxirida mos", async () => {
    serverRoyxati(ROYXAT);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    const maydon = screen.getByRole("searchbox", { name: "Qidiruv" });
    fireEvent.change(maydon, { target: { value: "kitob" } });
    expect(maydon).toHaveProperty("value", "kitob");
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(1),
    );
    expect(matni("qidiruv-natija")).toBe("1 ta topildi");
    expect(
      document.getElementById("royxat")?.hasAttribute("aria-busy"),
    ).toBe(false);
    await waitFor(() => expect(matni("aloqa")).toBe(""));
  });
  // 19/#21: Bildirishnoma — Qobiq'da (e'lon store'da); App faqat yozadi
  test("18/#10 e'lon — portal: <body> da, ilova ildizidan tashqarida", async () => {
    serverRoyxati(ROYXAT);
    function Elon() {
      const [matn] = useElon();
      return <Bildirishnoma matn={matn} />;
    }
    const { container } = chiz(
      <>
        <App boshlangichRoyxat={ROYXAT} qoralama="" />
        <Elon />
      </>,
      { router: "brauzer" },
    );
    const elon = document.getElementById("elon");
    expect(elon?.parentElement).toBe(document.body);
    expect(container.contains(elon)).toBe(false);
    // E'lon store'da — toast uni ko'rsatadi (App'ni qayta chizmasdan)
    act(() => useIlovaHolati.getState().elonQil("Sinov e'loni"));
    expect(elon?.textContent).toBe("Sinov e'loni");
    await waitFor(() => expect(matni("aloqa")).toBe(""));
  });

  test("18/#12 <title> — komponentdan, <head> ga ko'tariladi, qolganlar soni bilan", async () => {
    serverRoyxati(ROYXAT);
    chiz(<App boshlangichRoyxat={ROYXAT} qoralama="" />, {
      router: "brauzer",
    });
    expect(document.title).toBe(
      "(1) Vazifalar — kichik vazifalar ro'yxati",
    );
    expect(document.head.querySelector("title")?.textContent).toBe(
      document.title,
    );
    await waitFor(() => expect(matni("aloqa")).toBe(""));
  });
});
