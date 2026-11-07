// providerli-hooklar.test.tsx — 22/#06: kontekstga tayanadigan hooklar.
// renderHook + wrapper (hookniChiz): router (useSearchParams), Query
// (useQuery), Zustand store — testlar orasida holat qolmasligi
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { useLocation } from "react-router";
import { useUrlTanlovi } from "../src/hooklar/useUrlTanlovi.ts";
import { useVazifalar } from "../src/server-sinxron.ts";
import { useIzohlar } from "../src/xususiyatlar/izoh/izoh-holati.ts";
import { hookniChiz } from "./yordamchi/chiz.tsx";
import { server } from "./msw/node.ts";
import { server500, serverRoyxati } from "./msw/soxta-api.ts";
import { vazifa } from "./yordamchi/fabrika.ts";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useUrlTanlovi (MemoryRouter)", () => {
  test("manzildan o'qiydi; noto'g'ri qiymat — standart", () => {
    const { result } = hookniChiz(() => useUrlTanlovi(), {
      yol: "/?filtr=faol&saralash=nimadir",
    });
    expect(result.current.filtr).toBe("faol");
    expect(result.current.saralash).toBe("standart");
  });

  test("yozish — manzil o'zgaradi; standart qiymat parametrni o'chiradi", () => {
    const { result } = hookniChiz(
      () => ({ url: useUrlTanlovi(), joy: useLocation() }),
      { yol: "/?filtr=faol" },
    );
    act(() => result.current.url.saralashniYoz("alifbo"));
    expect(result.current.joy.search).toBe(
      "?filtr=faol&saralash=alifbo",
    );
    act(() => result.current.url.filtrniYoz("hammasi"));
    expect(result.current.joy.search).toBe("?saralash=alifbo");
  });
});

describe("useVazifalar (QueryClient)", () => {
  test("serverdan keladi; tarmoq holati — tayyor", async () => {
    serverRoyxati([vazifa({ id: 7, matn: "Choy" })], 3);
    const { result } = hookniChiz(() => useVazifalar());
    await waitFor(() => expect(result.current.tarmoq).toBe("tayyor"));
    expect(result.current.vazifalar?.map((v) => v.matn)).toEqual([
      "Choy",
    ]);
  });

  test("server 500 — xato holati", async () => {
    server.use(server500);
    const { result } = hookniChiz(() => useVazifalar());
    await waitFor(() => expect(result.current.tarmoq).toBe("xato"));
  });
});

describe("Zustand store — testlar orasida tiklanadi", () => {
  test("1: izoh yoziladi", () => {
    const { result } = hookniChiz(() => useIzohlar());
    act(() => result.current.izohniYoz(1, "Bozordan"));
    expect(result.current.izohlar).toEqual({ 1: "Bozordan" });
  });

  test("2: oldingi testning izohi yo'q (storelarniTikla)", () => {
    const { result } = hookniChiz(() => useIzohlar());
    expect(result.current.izohlar).toEqual({});
  });
});
