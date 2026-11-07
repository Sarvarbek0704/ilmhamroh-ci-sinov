// VazifaTahriri.test.tsx — tahrir formasi (19/#29–#32): React Hook Form +
// Zod, Controller (almashtirgich), server xatosi. Router va Query —
// ilovadagi o'sha loader va QueryClient (sorovMijozi)
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { createRef } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
} from "react-router";
import { VazifaSahifasi } from "../src/sahifalar/VazifaSahifasi.tsx";
import { VazifaTahriri } from "../src/sahifalar/VazifaTahriri.tsx";
import { vazifaLoader } from "../src/sahifalar/vazifa-marshruti.ts";
import { sorovMijozi } from "../src/server-sinxron.ts";
import type { VazifaMalumoti } from "../src/turlar.ts";
import { server as msw } from "./msw/node.ts";
import {
  serverRoyxati,
  tanalar,
  yozuvXatosi,
} from "./msw/soxta-api.ts";

const ROYXAT: VazifaMalumoti[] = [
  { id: 1, matn: "Non olish #bozor", bajarildi: false },
  { id: 2, matn: "Sut olish", bajarildi: true },
];

// Server — MSW (22/#07). tanalar() — yozuv so'rovlari tanasi bilan.
// 22/#07 gacha: 24 qatorli vi.mocked(fetch).mockImplementation(...)
function server({ xato = false } = {}) {
  serverRoyxati(ROYXAT);
  if (xato) msw.use(yozuvXatosi);
}

function och() {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Outlet context={{ sarlavhaRef: createRef() }} />,
        hydrateFallbackElement: <p>Yuklanmoqda…</p>,
        children: [
          {
            path: "vazifa/:id",
            element: <VazifaSahifasi />,
            loader: vazifaLoader,
            children: [
              { index: true, element: <p>Umumiy bo'lim</p> },
              { path: "tahrir", element: <VazifaTahriri /> },
            ],
          },
        ],
      },
    ],
    {
      initialEntries: ["/vazifa/1", "/vazifa/1/tahrir"],
      initialIndex: 1,
    },
  );
  render(
    <QueryClientProvider client={sorovMijozi}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

const maydon = () => screen.getByLabelText<HTMLInputElement>("Matn");
const saqlash = () =>
  fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

beforeEach(() => {
  sorovMijozi.clear();
  localStorage.clear();
  localStorage.setItem(
    "vazifalar:foydalanuvchi",
    JSON.stringify({ ism: "Sinov" }),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("VazifaTahriri (RHF + Zod)", () => {
  test("bo'sh matn — xato, aria-invalid, fokus maydonda; serverga yo'q", async () => {
    server();
    och();
    fireEvent.change(await screen.findByLabelText("Matn"), {
      target: { value: "   " },
    });
    saqlash();
    expect(
      await screen.findByText("Vazifa matnini yozing."),
    ).toBeTruthy();
    expect(maydon().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(maydon());
    expect(tanalar()).toEqual([]);
  });

  test("takror matn (boshqa vazifada bor) — xato", async () => {
    server();
    och();
    fireEvent.change(await screen.findByLabelText("Matn"), {
      target: { value: "sut OLISH" },
    });
    saqlash();
    expect(
      await screen.findByText("Bu vazifa ro'yxatda allaqachon bor."),
    ).toBeTruthy();
  });

  test("kesilgan matn va almashtirgich (Controller) — PATCH, keyin orqaga", async () => {
    server();
    const router = och();
    fireEvent.change(await screen.findByLabelText("Matn"), {
      target: { value: "  Non va sut olish #bozor  " },
    });
    expect(screen.getByText("Teglar: #bozor")).toBeTruthy(); // useWatch
    const kalit = screen.getByRole("switch", { name: "Bajarildi" });
    fireEvent.click(kalit);
    expect(kalit.getAttribute("aria-checked")).toBe("true");
    saqlash();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/vazifa/1"),
    );
    expect(tanalar()).toEqual([
      'PATCH {"matn":"Non va sut olish #bozor","bajarildi":true}',
    ]);
  });

  test("o'zgarish yo'q — serverga so'rov yo'q, orqaga", async () => {
    server();
    const router = och();
    await screen.findByLabelText("Matn");
    saqlash();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/vazifa/1"),
    );
    expect(tanalar()).toEqual([]);
  });

  test("server rad etdi — formaga xato (root), sahifada qoladi", async () => {
    server({ xato: true });
    const router = och();
    fireEvent.change(await screen.findByLabelText("Matn"), {
      target: { value: "Yangi matn" },
    });
    saqlash();
    // 22/#07: <p role="alert"> DOIM bor (bo'sh) — findByRole darhol
    // topadi. Qo'lda fetch soxtasi bir mikrotaskda javob berardi va test
    // tasodifan o'tardi; MSW haqiqiy tarmoq kabi kechroq javob beradi →
    // yiqildi. To'g'risi — MATN paydo bo'lishini kutish
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Saqlanmadi: Ataylab",
      ),
    );
    expect(router.state.location.pathname).toBe("/vazifa/1/tahrir");
  });
});
