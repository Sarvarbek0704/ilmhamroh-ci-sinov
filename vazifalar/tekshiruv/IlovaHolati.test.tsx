// IlovaHolati.test.tsx — Zustand store (19/#21–#22): e'lon taymeri,
// sozlamalar persist (faqat ular), boshqa tabdan o'zgarish (storage)
import { afterEach, describe, expect, test, vi } from "vitest";
import { act } from "@testing-library/react";
import {
  SOZLAMALAR_KALITI,
  useIlovaHolati,
} from "../src/ilova-holati.ts";

afterEach(() => {
  vi.useRealTimers();
  act(() => {
    useIlovaHolati.getState().setOchirishdaSora(true);
    useIlovaHolati.getState().setZichlik("oddiy");
  });
});

describe("ilova-holati (Zustand)", () => {
  test("e'lon 3 s turadi; hook'siz (getState) ham yoziladi", () => {
    vi.useFakeTimers();
    useIlovaHolati.getState().elonQil("Salom");
    expect(useIlovaHolati.getState().elon).toBe("Salom");
    vi.advanceTimersByTime(3000);
    expect(useIlovaHolati.getState().elon).toBe("");
  });

  test("persist: sozlamalar localStorage'da, e'lon — yo'q (partialize)", () => {
    useIlovaHolati.getState().setOchirishdaSora(false);
    useIlovaHolati.getState().elonQil("Saqlanmasin");
    const saqlangan = JSON.parse(
      localStorage.getItem(SOZLAMALAR_KALITI) ?? "null",
    ) as unknown;
    expect(saqlangan).toEqual({
      state: { ochirishdaSora: false, zichlik: "oddiy" },
      version: 1,
    });
  });

  test("boshqa tab yozdi (storage hodisasi) — qayta o'qiladi", async () => {
    const yangi = JSON.stringify({
      state: { ochirishdaSora: true, zichlik: "ixcham" },
      version: 1,
    });
    localStorage.setItem(SOZLAMALAR_KALITI, yangi);
    dispatchEvent(
      new StorageEvent("storage", {
        key: SOZLAMALAR_KALITI,
        newValue: yangi,
      }),
    );
    await vi.waitFor(() =>
      expect(useIlovaHolati.getState().zichlik).toBe("ixcham"),
    );
  });
});
