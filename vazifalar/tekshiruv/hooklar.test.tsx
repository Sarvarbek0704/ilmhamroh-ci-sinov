// hooklar.test.tsx — custom hooklar (17/#43–#44). renderHook — hookni
// kichik sinov komponenti ichida chaqiradi; natija — result.current
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useElon } from "../src/hooklar/useElon.ts";
import { useMediaQuery } from "../src/hooklar/useMediaQuery.ts";
import { useOnlayn } from "../src/hooklar/useOnlayn.ts";
import { useOynaHodisasi } from "../src/hooklar/useOynaHodisasi.ts";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useElon", () => {
  test("e'lon 3 s turadi, yangisi taymerni boshidan boshlaydi", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useElon());
    act(() => result.current[1]("Birinchi"));
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current[1]("Ikkinchi"));
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current[0]).toBe("Ikkinchi");
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe("");
  });
});

describe("useOynaHodisasi", () => {
  test("bir marta ulanadi, chaqirilganda ENG SO'NGGI ishlovchi", () => {
    const ulash = vi.spyOn(window, "addEventListener");
    const chaqiruvlar: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ nom }) =>
        useOynaHodisasi("popstate", () => chaqiruvlar.push(nom)),
      { initialProps: { nom: "birinchi" } },
    );
    rerender({ nom: "ikkinchi" });
    rerender({ nom: "uchinchi" });
    dispatchEvent(new PopStateEvent("popstate"));
    expect(chaqiruvlar).toEqual(["uchinchi"]);
    expect(
      ulash.mock.calls.filter(([tur]) => tur === "popstate"),
    ).toHaveLength(1);
    unmount();
    dispatchEvent(new PopStateEvent("popstate"));
    expect(chaqiruvlar).toEqual(["uchinchi"]); // cleanup ishladi
  });
});

describe("useOnlayn", () => {
  test("offline/online hodisasida qayta o'qiladi", () => {
    const onLine = vi.spyOn(navigator, "onLine", "get");
    onLine.mockReturnValue(true);
    const { result } = renderHook(() => useOnlayn());
    expect(result.current).toBe(true);
    onLine.mockReturnValue(false);
    act(() => {
      dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);
  });
});

describe("useMediaQuery", () => {
  test("so'rov o'zgarsa (change) — yangi qiymat", () => {
    let mos = false;
    const tinglovchilar = new Set<() => void>();
    vi.spyOn(globalThis, "matchMedia").mockImplementation(
      (sorov: string) =>
        ({
          get matches() {
            return mos;
          },
          media: sorov,
          addEventListener: (_: string, t: () => void) =>
            tinglovchilar.add(t),
          removeEventListener: (_: string, t: () => void) =>
            tinglovchilar.delete(t),
        }) as unknown as MediaQueryList,
    );
    const { result } = renderHook(() =>
      useMediaQuery("(prefers-color-scheme: dark)"),
    );
    expect(result.current).toBe(false);
    mos = true;
    act(() => tinglovchilar.forEach((t) => t()));
    expect(result.current).toBe(true);
  });
});
