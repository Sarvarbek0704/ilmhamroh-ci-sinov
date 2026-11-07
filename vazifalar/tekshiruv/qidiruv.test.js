// tekshiruv/qidiruv.test.js — matn qidiruvi: normallash, moslar, holat
import "./xotira.js";
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { normalla, qidir, moslar } from "../src/qidiruv.ts";
import {
  korinadiganVazifalar,
  qoshilgandaKorinsin,
} from "../src/holat.ts";
import { qosh } from "../src/amallar.ts";

describe("normalla", () => {
  test("kichik harf, apostrof bitta, bo'shliqlar bitta, kesilgan", () => {
    assert.equal(normalla("  O‘quv   #Dars \t"), "o'quv #dars");
  });

  test("o' ning olti yozilishi bir xil", () => {
    const shakllar = ["o'q", "o‘q", "o’q", "oʻq", "oʼq", "o`q"];
    assert.deepEqual(new Set(shakllar.map(normalla)), new Set(["o'q"]));
  });

  test("bo'sh va faqat bo'shliq — bo'sh satr", () => {
    assert.equal(normalla(""), "");
    assert.equal(normalla("   "), "");
  });
});

describe("qidir", () => {
  const vazifalar = [
    { id: 1, matn: "Oʻquv markaziga borish" },
    { id: 2, matn: "Non   olish" },
    { id: 3, matn: "O‘QUV rejasi" },
    { id: 4, matn: "oquv emas" },
  ];
  const idlar = (sorov) => qidir(vazifalar, sorov).map((v) => v.id);

  test("apostrof va katta-kichik harf farq qilmaydi, tartib saqlanadi", () => {
    assert.deepEqual(idlar("o'quv"), [1, 3]);
  });

  test("so'rovdagi ortiqcha bo'shliqlar", () => {
    assert.deepEqual(idlar("  non olish "), [2]);
  });

  test("bo'sh so'rov — hammasi, yangi massiv", () => {
    const natija = qidir(vazifalar, " ");
    assert.deepEqual(natija, vazifalar);
    assert.notEqual(natija, vazifalar);
  });

  test("mos yo'q — bo'sh", () => {
    assert.deepEqual(idlar("sabzi"), []);
  });
});

describe("moslar — asl matndagi o'rinlar", () => {
  test("ikki xil yozilgan ikki moslik", () => {
    assert.deepEqual(moslar("Oʻquv va o'quv", "O'QUV"), [
      [0, 5],
      [9, 14],
    ]);
  });

  test("bir-birini qoplamaydi", () => {
    assert.deepEqual(moslar("aaa", "aa"), [[0, 2]]);
  });

  test("asl matndagi ko'p bo'shliq bitta bo'lakka kiradi", () => {
    assert.deepEqual(moslar("Non   olish", "non olish"), [[0, 11]]);
  });

  test("kichiklashganda cho'ziladigan harf va emoji siljitmaydi", () => {
    // "İ".toLowerCase() — ikki belgi; 🍞 — ikki UTF-16 birligi
    assert.deepEqual(moslar("İz", "z"), [[1, 2]]);
    assert.deepEqual(moslar("🍞 non", "NON"), [[3, 6]]);
  });

  test("bo'sh so'rov — belgi yo'q", () => {
    assert.deepEqual(moslar("Non olish", "  "), []);
  });
});

describe("holat: qidiruv bilan", () => {
  const vazifalar = [
    { id: 1, matn: "Non olish #bozor", bajarildi: false },
    { id: 2, matn: "Sabzi #bozor", bajarildi: true },
    { id: 3, matn: "Kitob o'qish", bajarildi: false },
  ];
  const idlar = (royxat, filtr, qidiruv) =>
    korinadiganVazifalar(royxat, filtr, "standart", qidiruv).map(
      (v) => v.id,
    );

  test("filtr va qidiruv birga", () => {
    assert.deepEqual(idlar(vazifalar, "hammasi", "#BOZOR"), [1, 2]);
    assert.deepEqual(idlar(vazifalar, "faol", "#BOZOR"), [1]);
  });

  test("qo'shilgan vazifa qidiruvga mos — qidiruv qoladi", () => {
    const { qidiruv } = qoshilgandaKorinsin(
      "Guruch #bozor",
      "hammasi",
      "bozor",
    );
    assert.equal(qidiruv, "bozor");
    assert.deepEqual(
      idlar(qosh(vazifalar, "Guruch #bozor"), "hammasi", qidiruv),
      [1, 4, 2],
    );
  });

  test("mos kelmasa — qidiruv tozalanadi, yangi vazifa ko'rinadi", () => {
    const { qidiruv } = qoshilgandaKorinsin(
      "Choy damlash",
      "hammasi",
      "bozor",
    );
    assert.equal(qidiruv, "");
    assert.ok(
      idlar(
        qosh(vazifalar, "Choy damlash"),
        "hammasi",
        qidiruv,
      ).includes(4),
    );
  });
});
