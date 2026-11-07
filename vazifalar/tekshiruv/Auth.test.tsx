// Auth.test.tsx — kirish (18/#42 da soxta; 28-qism — server sessiyasi):
// himoyalangan UI, server xatosi, chiqish, /auth/men tekshiruvi, boshqa
// tabdan chiqish (BroadcastChannel). Server — soxta fetch (vi.stubGlobal):
// so'rovlar ro'yxatga yoziladi, javob — Response.json
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  AuthProvider,
  FoydalanuvchiMenyusi,
  Himoyalangan,
  KirishSahifasi,
} from "../src/xususiyatlar/auth/index.ts";
import { serverIsmi } from "../src/xususiyatlar/auth/server.ts";

// 19/#07: himoya — marshrutlarda. Xotiradagi router: /kirish va
// himoyalangan "/" (ilovadagi marshrutlar.tsx tuzilishi)
function Sahifa() {
  const router = createMemoryRouter([
    { path: "/kirish", element: <KirishSahifasi /> },
    {
      element: <Himoyalangan />,
      children: [
        {
          path: "/",
          element: (
            <>
              <FoydalanuvchiMenyusi />
              <p>Himoyalangan ilova</p>
            </>
          ),
        },
      ],
    },
  ]);
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

type Sorov = { url: string; method: string; tana: unknown };
let sorovlar: Sorov[] = [];
let javoblar: Record<string, () => Response> = {};

function soxtaServer(yangi: Record<string, () => Response>) {
  javoblar = yangi;
  vi.stubGlobal("fetch", (url: string, sozlama: RequestInit = {}) => {
    const method = sozlama.method ?? "GET";
    const tana =
      typeof sozlama.body === "string"
        ? JSON.parse(sozlama.body)
        : undefined;
    sorovlar.push({ url, method, tana });
    const javob = javoblar[`${method} ${url}`];
    return Promise.resolve(
      javob === undefined
        ? new Response(null, { status: 404 })
        : javob(),
    );
  });
}

const anon = () =>
  Response.json(
    { title: "Kirish kerak", status: 401 },
    { status: 401 },
  );
const email = () =>
  screen.getByRole<HTMLInputElement>("textbox", { name: "Email" });
const parol = () => screen.getByLabelText<HTMLInputElement>("Parol");
const kut = () => act(() => new Promise((r) => setTimeout(r, 20)));

beforeEach(() => {
  localStorage.clear();
  sorovlar = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Auth", () => {
  test("kirmagan — kirish formasi (email, parol), ilova yo'q; fokus email maydonida", async () => {
    soxtaServer({ "GET /v1/auth/men": anon });
    render(<Sahifa />);
    await kut();
    expect(screen.queryByText("Himoyalangan ilova")).toBeNull();
    expect(document.activeElement).toBe(email());
    expect(parol().type).toBe("password");
  });

  test("server rad etdi — uning matni, email joyida, parol bo'sh; to'g'ri — ilova, fokus foydalanuvchi tugmasida", async () => {
    let urinish = 0;
    soxtaServer({
      "GET /v1/auth/men": anon,
      "POST /v1/auth/kirish": () =>
        ++urinish === 1
          ? Response.json(
              { status: 401, detail: "Email yoki parol noto'g'ri" },
              { status: 401 },
            )
          : Response.json({
              foydalanuvchi: {
                id: 1,
                email: "malika@example.com",
                toliqIsm: "Malika",
              },
            }),
    });
    render(<Sahifa />);
    await kut();
    fireEvent.input(email(), {
      target: { value: "malika@example.com" },
    });
    fireEvent.input(parol(), { target: { value: "notogri-parol" } });
    await act(async () => {
      fireEvent.submit(email().form!);
    });
    expect(screen.getByRole("status").textContent).toBe(
      "Email yoki parol noto'g'ri",
    );
    expect(email().value).toBe("malika@example.com");
    expect(parol().value).toBe("");
    fireEvent.input(parol(), {
      target: { value: "Bahor-choyxona-2026" },
    });
    await act(async () => {
      fireEvent.submit(email().form!);
    });
    expect(screen.getByText("Himoyalangan ilova")).toBeTruthy();
    // Brauzerda — faqat ko'rsatish uchun ism; token/parol YO'Q
    expect(localStorage.getItem("vazifalar:foydalanuvchi")).toBe(
      '{"ism":"Malika"}',
    );
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Malika" }),
    );
    expect(sorovlar.filter((s) => s.method === "POST")).toEqual([
      {
        url: "/v1/auth/kirish",
        method: "POST",
        tana: {
          email: "malika@example.com",
          parol: "notogri-parol",
          eslabQol: true,
        },
      },
      {
        url: "/v1/auth/kirish",
        method: "POST",
        tana: {
          email: "malika@example.com",
          parol: "Bahor-choyxona-2026",
          eslabQol: true,
        },
      },
    ]);
  });

  test('ikki bosqichli tasdiqlash yoqilgan hisob ({ mfa: "kerak" }) — kirilmaydi, aniq xabar', async () => {
    soxtaServer({
      "GET /v1/auth/men": anon,
      "POST /v1/auth/kirish": () => Response.json({ mfa: "kerak" }),
    });
    render(<Sahifa />);
    await kut();
    fireEvent.input(email(), { target: { value: "a@example.com" } });
    fireEvent.input(parol(), { target: { value: "x" } });
    await act(async () => {
      fireEvent.submit(email().form!);
    });
    expect(screen.queryByText("Himoyalangan ilova")).toBeNull();
    expect(screen.getByRole("status").textContent).toMatch(
      /ikki bosqichli/,
    );
  });

  test("brauzer nusxasi bor, lekin server 401 (sessiya tugagan) — nusxa (ism, ro'yxat, qoralama) o'chadi, tema qoladi, kirish formasi", async () => {
    soxtaServer({ "GET /v1/auth/men": anon });
    localStorage.setItem("vazifalar:foydalanuvchi", '{"ism":"Bobur"}');
    localStorage.setItem("vazifalar:v3", "[]");
    localStorage.setItem("vazifalar:qoralama", "Non");
    localStorage.setItem("vazifalar:tema", "qorongi");
    render(<Sahifa />);
    await kut();
    expect(screen.queryByText("Himoyalangan ilova")).toBeNull();
    expect(Object.keys(localStorage)).toEqual(["vazifalar:tema"]);
  });

  test("sessiya bor — ilova; «Chiqish» — POST /auth/chiqish, kirish formasi, yozuv o'chdi", async () => {
    soxtaServer({
      "GET /v1/auth/men": () =>
        Response.json({
          foydalanuvchi: {
            id: 2,
            email: "b@example.com",
            toliqIsm: "Bobur",
          },
        }),
      "POST /v1/auth/chiqish": () =>
        new Response(null, { status: 204 }),
    });
    localStorage.setItem("vazifalar:foydalanuvchi", '{"ism":"Bobur"}');
    localStorage.setItem("vazifalar:v3", "[]");
    render(<Sahifa />);
    await kut();
    expect(screen.getByText("Himoyalangan ilova")).toBeTruthy();
    // 20/#03: Radix menyusi sichqonchada pointerdown bilan ochiladi
    // (click emas) — klaviatura bilan ochamiz (Enter), keyin tanlaymiz
    fireEvent.keyDown(screen.getByRole("button", { name: "Bobur" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("menuitem", { name: "Chiqish" }));
    await kut();
    expect(screen.queryByText("Himoyalangan ilova")).toBeNull();
    expect(localStorage.getItem("vazifalar:foydalanuvchi")).toBeNull();
    expect(localStorage.getItem("vazifalar:v3")).toBeNull(); // umumiy kompyuter
    expect(sorovlar.map((s) => `${s.method} ${s.url}`)).toEqual([
      "GET /v1/auth/men",
      "POST /v1/auth/chiqish",
    ]);
  });

  test("server chiqishni rad etdi (403) — UI chiqmaydi, sabab ko'rinadi, yozuv joyida", async () => {
    soxtaServer({
      "GET /v1/auth/men": () =>
        Response.json({
          foydalanuvchi: {
            id: 2,
            email: "b@example.com",
            toliqIsm: "Bobur",
          },
        }),
      "POST /v1/auth/chiqish": () =>
        Response.json(
          { status: 403, detail: "So'rov boshqa sahifadan kelgan" },
          { status: 403 },
        ),
    });
    localStorage.setItem("vazifalar:foydalanuvchi", '{"ism":"Bobur"}');
    render(<Sahifa />);
    await kut();
    fireEvent.keyDown(screen.getByRole("button", { name: "Bobur" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByRole("menuitem", { name: "Chiqish" }));
    await kut();
    expect(screen.getByText("Himoyalangan ilova")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "So'rov boshqa sahifadan kelgan",
    );
    expect(localStorage.getItem("vazifalar:foydalanuvchi")).toBe(
      '{"ism":"Bobur"}',
    );
  });

  test("boshqa tabda chiqildi (BroadcastChannel) — bu tabda ham kirish formasi", async () => {
    soxtaServer({
      "GET /v1/auth/men": () =>
        Response.json({
          foydalanuvchi: {
            id: 2,
            email: "b@example.com",
            toliqIsm: "Bobur",
          },
        }),
    });
    localStorage.setItem("vazifalar:foydalanuvchi", '{"ism":"Bobur"}');
    render(<Sahifa />);
    await kut();
    const boshqaTab = new BroadcastChannel("vazifalar");
    localStorage.removeItem("vazifalar:foydalanuvchi");
    await act(async () => {
      boshqaTab.postMessage({ tur: "auth" });
      await new Promise((r) => setTimeout(r, 50));
    });
    boshqaTab.close();
    expect(screen.queryByText("Himoyalangan ilova")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Kirish" }),
    ).toBeTruthy();
  });
});

describe("serverIsmi — server javobi (unknown) → UI kimligi", () => {
  test.each([
    [{ foydalanuvchi: { toliqIsm: "  Aziz  " } }, { ism: "Aziz" }],
    [
      { foydalanuvchi: { toliqIsm: "A".repeat(60) } },
      { ism: "A".repeat(40) },
    ],
    [{ foydalanuvchi: { toliqIsm: "A" } }, null],
    [{ foydalanuvchi: { toliqIsm: 5 } }, null],
    [{ foydalanuvchi: null }, null],
    [{ mfa: "kerak" }, null],
    [null, null],
    ["matn", null],
  ])("%j → %j", (kirish, kutilgan) => {
    expect(serverIsmi(kirish)).toEqual(kutilgan);
  });
});
