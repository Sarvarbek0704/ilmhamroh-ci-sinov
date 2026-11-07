// tartib.test.js — 20/#17: qo'lda tartiblash (sof funksiya)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { kochir } from "../src/tartib.ts";

const v = (id, bajarildi = false) => ({
  id,
  matn: `V${id}`,
  bajarildi,
});
const RoYXAT = [v(1), v(2), v(3, true), v(4), v(5)];
const idlar = (n) => (n.ok ? n.vazifalar.map((x) => x.id) : n.sabab);

describe("kochir", () => {
  test("pastga: A — B dan keyin; yuqoriga: A — B dan oldin", () => {
    assert.deepEqual(
      idlar(kochir(RoYXAT, RoYXAT, 1, 4)),
      [2, 3, 4, 1, 5],
    );
    assert.deepEqual(
      idlar(kochir(RoYXAT, RoYXAT, 5, 2)),
      [1, 5, 2, 3, 4],
    );
  });
  test("joy — ekrandagi yangi o'rin (1 dan)", () => {
    const ekran = [v(1), v(2), v(4), v(5), v(3, true)]; // standart: faollar oldin
    assert.equal(kochir(RoYXAT, ekran, 1, 4).joy, 3);
  });
  test("filtrlangan ekran: yashirin vazifalar joyida qoladi", () => {
    const ekran = [v(2), v(5)]; // masalan qidiruv natijasi
    assert.deepEqual(
      idlar(kochir(RoYXAT, ekran, 5, 2)),
      [1, 5, 2, 3, 4],
    );
  });
  test("boshqa guruh, o'zi, topilmadi — o'zgarishsiz", () => {
    assert.equal(idlar(kochir(RoYXAT, RoYXAT, 1, 3)), "boshqa-guruh");
    assert.equal(idlar(kochir(RoYXAT, RoYXAT, 2, 2)), "bir-xil");
    assert.equal(idlar(kochir(RoYXAT, RoYXAT, 9, 2)), "topilmadi");
  });
  test("asl massiv o'zgarmaydi (yangi massiv)", () => {
    const nusxa = structuredClone(RoYXAT);
    kochir(RoYXAT, RoYXAT, 1, 5);
    assert.deepEqual(RoYXAT, nusxa);
  });
});
