// tekshiruv/saqlash.test.js — kesh va server kaliti, brauzersiz
import "./xotira.js";
import { beforeEach, describe, test, vi } from "vitest";
import assert from "node:assert/strict";
import {
  SAQLASH_KALITI,
  saqla,
  yukla,
  kalitniOl,
  qoralamaniSaqla,
  qoralamaniOl,
} from "../src/saqlash.ts";
import { VazifalarRoyxati } from "../src/royxat.ts";

// console.warn chiqishi kutilgan — test hisobotini to'ldirmasin
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("saqla va yukla", () => {
  test("bo'sh xotira — null", () => {
    assert.equal(yukla(), null);
  });

  test("saqlangan ro'yxat qaytadi", () => {
    const royxat = VazifalarRoyxati.dan([
      { id: 4, matn: "Non olish", bajarildi: true },
    ]);
    assert.equal(saqla(royxat), true);
    assert.deepEqual(yukla(), [
      { id: 4, matn: "Non olish", bajarildi: true },
    ]);
  });

  test("kalit nomi — vazifalar:v3", () => {
    saqla(VazifalarRoyxati.dan([]));
    assert.equal(SAQLASH_KALITI, "vazifalar:v3");
    assert.notEqual(localStorage.getItem("vazifalar:v3"), null);
  });

  test("bo'sh ro'yxat — null emas, []", () => {
    saqla(VazifalarRoyxati.dan([]));
    assert.deepEqual(yukla(), []);
  });

  test("buzuq yozuv — null va ogohlantirish", () => {
    localStorage.setItem(SAQLASH_KALITI, "{buzuq");
    assert.equal(yukla(), null);
    assert.equal(console.warn.mock.calls.length, 1);
  });

  test("xotira to'lsa saqla — false (xato tashlamaydi)", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("to'ldi", "QuotaExceededError");
    });
    assert.equal(saqla(VazifalarRoyxati.dan([])), false);
    assert.equal(
      console.warn.mock.calls[0][0],
      "Vazifalar saqlanmadi: QuotaExceededError",
    );
  });

  test("xotirani o'qib bo'lmasa yukla — null", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("yopiq", "SecurityError");
    });
    assert.equal(yukla(), null);
  });
});

describe("kalitniOl", () => {
  test("UUID, bir marta yaratiladi", () => {
    const kalit = kalitniOl();
    assert.match(kalit, /^[0-9a-f-]{36}$/);
    assert.equal(kalitniOl(), kalit);
    assert.equal(localStorage.getItem("vazifalar:kalit"), kalit);
  });

  test("xotira yopiq bo'lsa ham kalit qaytadi (har safar yangi)", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("yopiq", "SecurityError");
    });
    const birinchi = kalitniOl();
    assert.match(birinchi, /^[0-9a-f-]{36}$/);
    assert.notEqual(kalitniOl(), birinchi);
  });
});

describe("qoralama", () => {
  test("saqlanadi va qaytadi; bo'sh matn yozuvni o'chiradi", () => {
    assert.equal(qoralamaniOl(), "");
    qoralamaniSaqla("Sabzi ol");
    assert.equal(
      localStorage.getItem("vazifalar:qoralama"),
      "Sabzi ol",
    );
    assert.equal(qoralamaniOl(), "Sabzi ol");
    qoralamaniSaqla("");
    assert.equal(localStorage.getItem("vazifalar:qoralama"), null);
  });

  test("xotira yopiq — bo'sh qoralama, xato tashlamaydi", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("yopiq", "SecurityError");
    });
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("yopiq", "SecurityError");
    });
    assert.equal(qoralamaniOl(), "");
    qoralamaniSaqla("Non");
    assert.equal(
      console.warn.mock.calls[0][0],
      "Qoralama saqlanmadi: SecurityError",
    );
  });
});
