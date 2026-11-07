// tekshiruv/virtual-oraliq.test.js — virtualizatsiya hisobi (18/#23)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  joylarniHisobla,
  korinadiganOraliq,
} from "../src/virtual-oraliq.ts";

const kalitlar = Array.from({ length: 100 }, (_, i) => i + 1);

describe("virtual-oraliq", () => {
  test("joylar: o'lchangani — o'lchami, qolgani — taxmin", () => {
    const joylar = joylarniHisobla([1, 2, 3], new Map([[2, 80]]), 50);
    assert.deepEqual([...joylar], [0, 50, 130, 180]);
  });

  test("boshida: ekrandagilar + zaxira, ostida qolgan joy", () => {
    const joylar = joylarniHisobla(kalitlar, new Map(), 50);
    // 0..500 px — 10 qator ko'rinadi (0–9), +2 zaxira
    assert.deepEqual(korinadiganOraliq(joylar, 0, 500, 2), {
      boshi: 0,
      oxiri: 13,
      yuqori: 0,
      pastki: (100 - 13) * 50,
    });
  });

  test("o'rtada: ustida va ostida bo'sh joy, jami balandlik saqlanadi", () => {
    const joylar = joylarniHisobla(kalitlar, new Map(), 50);
    const o = korinadiganOraliq(joylar, 2000, 2500, 3);
    assert.deepEqual([o.boshi, o.oxiri], [37, 54]);
    assert.equal(o.yuqori + (o.oxiri - o.boshi) * 50 + o.pastki, 5000);
  });

  test("oxirida va undan pastda — oxirgi qatorlar, chegaradan chiqmaydi", () => {
    const joylar = joylarniHisobla(kalitlar, new Map(), 50);
    const o = korinadiganOraliq(joylar, 4800, 9000, 2);
    assert.deepEqual([o.boshi, o.oxiri, o.pastki], [94, 100, 0]);
  });

  test("bo'sh ro'yxat", () => {
    assert.deepEqual(
      korinadiganOraliq(joylarniHisobla([], new Map(), 50), 0, 500, 2),
      {
        boshi: 0,
        oxiri: 0,
        yuqori: 0,
        pastki: 0,
      },
    );
  });
});
