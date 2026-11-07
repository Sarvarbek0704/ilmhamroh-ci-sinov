// VazifaSahifasi.test.tsx — "/vazifa/:id" (19/#05): loader, action,
// errorElement. Router — xotirada (createMemoryRouter), marshrutlar —
// ilovadagi o'sha komponentlar va funksiyalar; Qobiq o'rnida — faqat
// Outlet konteksti (sarlavha ref'i). Server — MSW (22/#07, msw/soxta-api.ts)
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from "react-router";
import { VazifaSahifasi } from "../src/sahifalar/VazifaSahifasi.tsx";
import { VazifaUmumiy } from "../src/sahifalar/VazifaUmumiy.tsx";
import { VazifaXatosi } from "../src/sahifalar/VazifaXatosi.tsx";
import {
  vazifaAction,
  vazifaLoader,
} from "../src/sahifalar/vazifa-marshruti.ts";
import { QueryClientProvider } from "@tanstack/react-query";
import { sorovMijozi } from "../src/server-sinxron.ts";
import type { VazifaMalumoti } from "../src/turlar.ts";
import { server as msw } from "./msw/node.ts";
import {
  serverRoyxati,
  sorovlar,
  tarmoqYoq,
  yozuvXatosi,
} from "./msw/soxta-api.ts";

const ROYXAT: VazifaMalumoti[] = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sut olish", bajarildi: true },
];

// Server: GET — ro'yxat, PATCH — o'zgargan vazifa; yozuvXatosi — yozuvga 500.
// 22/#07 gacha: 26 qatorli vi.mocked(fetch).mockImplementation(...)
function server({ yozuvXatosi: rad = false } = {}) {
  serverRoyxati(ROYXAT);
  if (rad) msw.use(yozuvXatosi);
}

function och(manzil: string) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Outlet context={{ sarlavhaRef: createRef() }} />,
        hydrateFallbackElement: <p>Yuklanmoqda…</p>,
        children: [
          { index: true, element: <p>Ro'yxat sahifasi</p> },
          { path: "kirish", element: <p>Kirish sahifasi</p> },
          {
            path: "vazifa/:id",
            element: <VazifaSahifasi />,
            loader: vazifaLoader,
            errorElement: <VazifaXatosi />,
            children: [
              {
                index: true,
                element: <VazifaUmumiy />,
                action: vazifaAction,
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [manzil] },
  );
  // 19/#32: sahifa vazifani Query keshidan o'qiydi — Provider kerak
  render(
    <QueryClientProvider client={sorovMijozi}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  // 19/#14: loader ilovaning QueryClient'idan oladi — har testda bo'sh
  sorovMijozi.clear();
  localStorage.clear();
  localStorage.setItem(
    "vazifalar:v3",
    JSON.stringify({ versiya: 1, vazifalar: ROYXAT }),
  );
  // 19/#07: loader kirganini tekshiradi
  localStorage.setItem(
    "vazifalar:foydalanuvchi",
    JSON.stringify({ ism: "Sinov" }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("/vazifa/:id — data mode", () => {
  test("loader serverdan oladi, sahifa tayyor holda chiziladi", async () => {
    server();
    och("/vazifa/1");
    expect(
      await screen.findByRole("heading", { name: "Non olish #bozor" }),
    ).toBeTruthy();
    expect(document.getElementById("vazifa-holati")?.textContent).toBe(
      "Faol",
    );
    expect(sorovlar()).toEqual(["GET"]);
  });

  test("yo'q vazifa — errorElement (404)", async () => {
    server();
    och("/vazifa/9");
    expect(
      await screen.findByRole("heading", { name: "Vazifa topilmadi" }),
    ).toBeTruthy();
    expect(document.getElementById("vazifa-yoq")?.textContent).toBe(
      "«9» raqamli vazifa yo'q.",
    );
  });

  test("/vazifa/02 — loader redirect bilan /vazifa/2", async () => {
    server();
    const router = och("/vazifa/02");
    expect(
      await screen.findByRole("heading", { name: "Sut olish" }),
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe("/vazifa/2");
  });

  test("server javob bermasa — keshdagi nusxa", async () => {
    msw.use(tarmoqYoq);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    och("/vazifa/2");
    expect(
      await screen.findByRole("heading", { name: "Sut olish" }),
    ).toBeTruthy();
  });

  test("action: belgilash — PATCH, kesh yangilandi, loader qayta chaqirildi", async () => {
    server();
    och("/vazifa/1");
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Bajarildi deb belgilash",
      }),
    );
    expect(
      await screen.findByText("Bajarildi deb belgilandi."),
    ).toBeTruthy();
    expect(sorovlar()).toEqual(["GET", "PATCH /1", "GET"]);
    expect(localStorage.getItem("vazifalar:v3")).toContain(
      '"bajarildi": true',
    );
  });

  test("action: server rad etdi — xabar, kesh o'zgarmadi", async () => {
    server({ yozuvXatosi: true });
    och("/vazifa/1");
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Bajarildi deb belgilash",
      }),
    );
    expect(await screen.findByText("Saqlanmadi: Ataylab")).toBeTruthy();
    expect(localStorage.getItem("vazifalar:v3")).not.toContain(
      '"bajarildi": true',
    );
  });

  test("kirmagan — loader /kirish ga yo'naltiradi, serverga so'rov YO'Q (19/#07)", async () => {
    server();
    localStorage.removeItem("vazifalar:foydalanuvchi");
    const router = och("/vazifa/1?x=1");
    expect(await screen.findByText("Kirish sahifasi")).toBeTruthy();
    expect(router.state.location.search).toBe(
      "?keyin=%2Fvazifa%2F1%3Fx%3D1",
    );
    expect(sorovlar()).toEqual([]);
  });
});
