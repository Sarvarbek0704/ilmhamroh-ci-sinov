// tekshiruv/kesish.test.js — profil rasmini kesish hisobi (21/#12)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { kesishOrni } from "../src/xususiyatlar/profil-rasmi/kesish.ts";

describe("kesishOrni", () => {
  test("keng rasm (800×400): balandlik bo'yicha yopadi, markazda", () => {
    const o = kesishOrni(800, 400, { zoom: 1, x: 0, y: 0 });
    assert.equal(o.korinishBoyi, 256);
    assert.equal(o.korinishEni, 512);
    assert.equal(o.chap, -128);
    assert.equal(o.tepa, 0);
    assert.deepEqual(o.manba, { x: 200, y: 0, tomon: 400 });
  });
  test("x = -1 — chap cheti, x = 1 — o'ng cheti", () => {
    assert.equal(
      kesishOrni(800, 400, { zoom: 1, x: -1, y: 0 }).manba.x,
      0,
    );
    assert.equal(
      kesishOrni(800, 400, { zoom: 1, x: 1, y: 0 }).manba.x,
      400,
    );
  });
  test("zoom 2: manba tomoni yarmi, maydondan chiqmaydi", () => {
    const o = kesishOrni(400, 400, { zoom: 2, x: 1, y: 1 });
    assert.equal(o.manba.tomon, 200);
    assert.deepEqual([o.manba.x, o.manba.y], [200, 200]);
  });
});
