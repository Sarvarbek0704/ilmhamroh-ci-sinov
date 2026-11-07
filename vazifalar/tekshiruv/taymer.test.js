// tekshiruv/taymer.test.js — kechiktir (debounce), soxta soat bilan
import { afterEach, beforeEach, describe, test, vi } from "vitest";
import assert from "node:assert/strict";
import { kechiktir } from "../src/taymer.ts";

// Soxta soat: setTimeout haqiqiy vaqtni kutmaydi, tick() bilan suriladi
beforeEach(() =>
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }),
);
afterEach(() => vi.useRealTimers());

describe("kechiktir", () => {
  test("ketma-ket chaqiruvlardan faqat oxirgisi bajariladi", () => {
    const ishlovchi = vi.fn();
    const kechiktirilgan = kechiktir(ishlovchi, 400);
    kechiktirilgan("S");
    vi.advanceTimersByTime(300);
    kechiktirilgan("Sa");
    vi.advanceTimersByTime(300);
    kechiktirilgan("Sab");
    assert.equal(ishlovchi.mock.calls.length, 0);
    vi.advanceTimersByTime(400);
    assert.equal(ishlovchi.mock.calls.length, 1);
    assert.deepEqual(ishlovchi.mock.calls[0], ["Sab"]);
  });

  test("muddatdan oldin bajarilmaydi", () => {
    const ishlovchi = vi.fn();
    kechiktir(ishlovchi, 400)("Non");
    vi.advanceTimersByTime(399);
    assert.equal(ishlovchi.mock.calls.length, 0);
    vi.advanceTimersByTime(1);
    assert.equal(ishlovchi.mock.calls.length, 1);
  });

  test("hoziroq: kutayotganini darhol bajaradi, keyin qaytarmaydi", () => {
    const ishlovchi = vi.fn();
    const kechiktirilgan = kechiktir(ishlovchi, 400);
    kechiktirilgan("Non");
    kechiktirilgan.hoziroq();
    assert.deepEqual(ishlovchi.mock.calls[0], ["Non"]);
    vi.advanceTimersByTime(1000);
    assert.equal(ishlovchi.mock.calls.length, 1);
  });

  test("hoziroq: kutayotgan chaqiruv bo'lmasa — hech narsa", () => {
    const ishlovchi = vi.fn();
    kechiktir(ishlovchi, 400).hoziroq();
    assert.equal(ishlovchi.mock.calls.length, 0);
  });

  test("bekor: kutayotgani bajarilmaydi", () => {
    const ishlovchi = vi.fn();
    const kechiktirilgan = kechiktir(ishlovchi, 400);
    kechiktirilgan("Non");
    kechiktirilgan.bekor();
    vi.advanceTimersByTime(1000);
    kechiktirilgan.hoziroq();
    assert.equal(ishlovchi.mock.calls.length, 0);
  });
});
