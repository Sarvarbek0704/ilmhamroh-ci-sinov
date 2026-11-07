// tekshiruv/batafsil-statistika.test.js — «Batafsil statistika» hisobi
// (18/#03): sof funksiya, React va brauzersiz
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  batafsilHisobla,
  SOZLAR_SONI,
  statistikaCsv,
} from "../src/xususiyatlar/statistika/batafsil-statistika.ts";

const v = (id, matn, bajarildi = false) => ({ id, matn, bajarildi });

describe("batafsilHisobla", () => {
  test("bo'sh ro'yxat — nol, bo'lish xatosi yo'q", () => {
    assert.deepEqual(batafsilHisobla([]), {
      jami: 0,
      bajarildi: 0,
      foiz: 0,
      ortachaUzunlik: 0,
      teglar: [],
      sozlar: [],
    });
  });

  test("foiz, o'rtacha uzunlik, teglar (jami va bajarilgan)", () => {
    const s = batafsilHisobla([
      v(1, "Non olish #bozor"),
      v(2, "Sabzi #bozor", true),
      v(3, "Kitob o'qish #uy", true),
    ]);
    assert.equal(s.jami, 3);
    assert.equal(s.bajarildi, 2);
    assert.equal(s.foiz, 67);
    assert.equal(s.ortachaUzunlik, 15); // (16 + 12 + 16) / 3 = 14.7
    assert.deepEqual(s.teglar, [
      { teg: "#bozor", jami: 2, bajarildi: 1 },
      { teg: "#uy", jami: 1, bajarildi: 1 },
    ]);
  });

  test("so'zlar: teglarsiz, normallangan (apostrof, katta harf), 3+ harf", () => {
    const s = batafsilHisobla([
      v(1, "O‘quv rejasi #o'quv"),
      v(2, "oʻquv markazi"),
      v(3, "Non va choy"),
    ]);
    assert.deepEqual(s.sozlar, [
      { soz: "o'quv", soni: 2 },
      { soz: "choy", soni: 1 },
      { soz: "markazi", soni: 1 },
      { soz: "non", soni: 1 },
      { soz: "rejasi", soni: 1 },
    ]);
  });

  test(`so'zlar: eng ko'pi ${SOZLAR_SONI} ta`, () => {
    const royxat = Array.from({ length: 30 }, (_, i) =>
      v(i + 1, `soz${String(i).padStart(2, "0")} umumiy`),
    );
    const s = batafsilHisobla(royxat);
    assert.equal(s.sozlar.length, SOZLAR_SONI);
    assert.deepEqual(s.sozlar[0], { soz: "umumiy", soni: 30 });
  });

  test("18/#26 statistikaCsv: BOM, sarlavha, qo'shtirnoq va formula injection", () => {
    const csv = statistikaCsv({
      jami: 2,
      bajarildi: 1,
      foiz: 50,
      ortachaUzunlik: 5,
      teglar: [{ teg: "#bozor", jami: 2, bajarildi: 1 }],
      sozlar: [
        { soz: "=HYPERLINK(1)", soni: 2 },
        { soz: 'a,"b"', soni: 1 },
      ],
    });
    assert.equal(csv.codePointAt(0), 0xfeff); // BOM — Excel UTF-8 ni taniydi
    assert.deepEqual(csv.slice(1).split("\r\n"), [
      "Teg,Jami,Bajarilgan",
      "#bozor,2,1",
      "",
      "So'z,Soni",
      "'=HYPERLINK(1),2",
      '"a,""b""",1',
      "",
    ]);
  });
});
