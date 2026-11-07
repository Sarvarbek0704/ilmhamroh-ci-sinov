// tekshiruv/tarix-chuqurligi.test.js — «Orqaga» uchun tarix
// chuqurligi (19/#04). Xarita qo'lda — brauzerdagi tartib bilan
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { qadamHisobi, xaritaniOqi } from "../src/tarix-chuqurligi.ts";

// Ketma-ket navigatsiyalar: [tur, kalit] → har yozuvning qadami
function yur(qadamlar) {
  const xarita = {};
  let oldingi = null;
  return qadamlar.map(([tur, kalit]) => {
    xarita[kalit] = qadamHisobi(xarita, tur, oldingi, kalit);
    oldingi = kalit;
    return xarita[kalit];
  });
}

describe("qadamHisobi", () => {
  test("birinchi sahifa — 0, ilova ichida har PUSH +1", () => {
    assert.deepEqual(
      yur([
        ["POP", "default"],
        ["PUSH", "a"],
        ["PUSH", "b"],
      ]),
      [0, 1, 2],
    );
  });

  test("/vazifa/02 to'g'ridan: replace yangi kalit, qadam 0 qoladi", () => {
    // location.key "default" emas, lekin orqada ilova yozuvi yo'q
    assert.deepEqual(
      yur([
        ["POP", "default"],
        ["REPLACE", "x7"],
      ]),
      [0, 0],
    );
  });

  test("ro'yxatdan /vazifa/02 havolasi: replace'dan keyin ham 1", () => {
    assert.deepEqual(
      yur([
        ["POP", "default"],
        ["PUSH", "a"],
        ["REPLACE", "b"],
      ]),
      [0, 1, 1],
    );
  });

  test("POP (Orqaga/Oldinga, yangilash) — yozilgani o'qiladi", () => {
    assert.deepEqual(
      yur([
        ["POP", "default"],
        ["PUSH", "a"],
        ["PUSH", "b"],
        ["POP", "a"],
        ["POP", "b"],
        ["POP", "b"],
      ]),
      [0, 1, 2, 1, 2, 2],
    );
  });

  test("birinchi chizishdayoq loader replace() qilgan — 0", () => {
    // oldingi yozuv yo'q (null): qadam 0, PUSH bo'lsa — 1
    assert.equal(qadamHisobi({}, "REPLACE", null, "k"), 0);
    assert.equal(qadamHisobi({}, "PUSH", null, "k"), 1);
  });

  test("notanish yozuv va meros kalit — 0", () => {
    assert.equal(qadamHisobi({ a: 3 }, "POP", null, "z"), 0);
    assert.equal(qadamHisobi({}, "POP", null, "constructor"), 0);
    assert.equal(qadamHisobi({}, "PUSH", "toString", "k"), 1);
  });
});

describe("xaritaniOqi", () => {
  test("to'g'ri matn — xarita, begona qiymatlar tashlanadi", () => {
    assert.deepEqual(
      xaritaniOqi('{"a":0,"b":2,"c":-1,"d":1.5,"e":"3","f":null}'),
      { a: 0, b: 2 },
    );
  });

  test("yo'q, buzuq yoki obyekt emas — bo'sh xarita", () => {
    for (const matn of [null, "", "{", "[1,2]", "5", "null"]) {
      assert.deepEqual(xaritaniOqi(matn), {}, String(matn));
    }
  });
});
