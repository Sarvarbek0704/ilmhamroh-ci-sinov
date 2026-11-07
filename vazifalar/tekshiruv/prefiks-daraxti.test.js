// tekshiruv/prefiks-daraxti.test.js — Trie va teg takliflari
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { PrefiksDaraxti } from "../src/prefiks-daraxti.ts";
import { VazifalarRoyxati, joriyTeg } from "../src/royxat.ts";

function daraxt(sozlar) {
  const d = new PrefiksDaraxti();
  for (const [soz, soni] of sozlar) {
    d.qosh(soz, soni);
  }
  return d;
}

describe("PrefiksDaraxti", () => {
  const d = daraxt([
    ["#bozor", 3],
    ["#bozorlik", 1],
    ["#bolalar", 3],
    ["#uy", 5],
    ["#o'quv", 2],
  ]);

  test("prefiks bo'yicha: ko'p ishlatilgani oldin, teng bo'lsa alifbo", () => {
    assert.deepEqual(d.boshlanganlar("#bo"), [
      "#bolalar",
      "#bozor",
      "#bozorlik",
    ]);
  });

  test("nechta — chegara; # — hamma teglar", () => {
    assert.deepEqual(d.boshlanganlar("#", 2), ["#uy", "#bolalar"]);
  });

  test("so'zning o'zi ham prefiks; mos yo'q — bo'sh", () => {
    assert.deepEqual(d.boshlanganlar("#bozorlik"), ["#bozorlik"]);
    assert.deepEqual(d.boshlanganlar("#x"), []);
    assert.deepEqual(d.boshlanganlar("#bozorlikk"), []);
  });

  test("bormi: faqat to'liq so'z; hajmi — turli so'zlar", () => {
    assert.equal(d.bormi("#bozor"), true);
    assert.equal(d.bormi("#boz"), false);
    assert.equal(d.hajmi, 5);
  });

  test("takror qo'shish — soni qo'shiladi, hajmi o'zgarmaydi", () => {
    const t = daraxt([
      ["#a", 1],
      ["#b", 2],
      ["#a", 2],
    ]);
    assert.equal(t.hajmi, 2);
    assert.deepEqual(t.boshlanganlar("#"), ["#a", "#b"]);
  });

  test("emoji va apostrof — kod nuqtasi bo'yicha", () => {
    const t = daraxt([
      ["#🍞non", 1],
      ["#o'quv", 1],
    ]);
    assert.deepEqual(t.boshlanganlar("#🍞"), ["#🍞non"]);
    assert.deepEqual(t.boshlanganlar("#o'"), ["#o'quv"]);
  });

  test("bo'sh daraxt", () => {
    assert.deepEqual(new PrefiksDaraxti().boshlanganlar("#"), []);
  });
});

describe("joriyTeg — kursordagi yozilayotgan teg", () => {
  const holatlar = [
    ["Non #bo", 7, { boshi: 4, prefiks: "#bo" }],
    ["Non #", 5, { boshi: 4, prefiks: "#" }],
    ["#BOZ", 4, { boshi: 0, prefiks: "#boz" }],
    ["Kitob #o'", 9, { boshi: 6, prefiks: "#o'" }],
    ["Non #bozor sabzi", 7, null], // so'z o'rtasida
    ["Non #bo sabzi", 7, { boshi: 4, prefiks: "#bo" }],
    ["Non#uy", 6, null], // oldida harf — teg emas
    ["Non bozor", 9, null],
    ["Non #bo ", 8, null], // probeldan keyin
  ];
  for (const [matn, kursor, kutilgan] of holatlar) {
    test(`«${matn}» [${kursor}]`, () => {
      assert.deepEqual(joriyTeg(matn, kursor), kutilgan);
    });
  }

  test("ro'yxat teglari + daraxt: taklif", () => {
    const royxat = VazifalarRoyxati.dan([
      { id: 1, matn: "Non #bozor", bajarildi: false },
      { id: 2, matn: "Sabzi #Bozor #uy", bajarildi: true },
      { id: 3, matn: "Kitob #o'quv", bajarildi: false },
    ]);
    const d = new PrefiksDaraxti();
    for (const [teg, soni] of royxat.tegHisobi()) {
      d.qosh(teg, soni);
    }
    const { prefiks } = joriyTeg("Guruch #B", 9);
    assert.deepEqual(d.boshlanganlar(prefiks), ["#bozor"]);
  });
});
