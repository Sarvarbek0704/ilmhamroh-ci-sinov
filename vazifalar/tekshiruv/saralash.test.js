// tekshiruv/saralash.test.js — bir nechta kalitli barqaror saralash
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { SARALASHLAR, tartibla } from "../src/saralash.ts";
import { VazifalarRoyxati } from "../src/royxat.ts";

const v = (id, matn, bajarildi = false) => ({ id, matn, bajarildi });
const idlar = (vazifalar, saralash) =>
  tartibla(vazifalar, saralash).map((vazifa) => vazifa.id);

describe("tartibla", () => {
  // Kelish tartibi id tartibida emas (masalan, import qilingan fayl)
  const vazifalar = [
    v(5, "Choy damlash"),
    v(2, "olma olish", true),
    v(9, "O'rik"),
    v(1, "Shakar", true),
    v(7, "sabzi"),
  ];

  test("standart: faollar oldin, qolgani kelgan tartibda (barqaror)", () => {
    assert.deepEqual(idlar(vazifalar, "standart"), [5, 9, 7, 2, 1]);
  });

  test("yangi: faollar oldin, har guruhda id kamayib", () => {
    assert.deepEqual(idlar(vazifalar, "yangi"), [9, 7, 5, 2, 1]);
  });

  test("alifbo (Node, ICU uz): o' va ch z dan keyin", () => {
    // sabzi < o'rik < choy; bajarilganlar: olma < shakar
    assert.deepEqual(idlar(vazifalar, "alifbo"), [7, 9, 5, 2, 1]);
  });

  test("alifbo: raqamlar son kabi, katta harf farq qilmaydi", () => {
    const darslar = [v(1, "10-dars"), v(2, "Anor"), v(3, "2-dars")];
    assert.deepEqual(idlar(darslar, "alifbo"), [3, 1, 2]);
  });

  test("alifbo: kaliti teng (apostrof turlicha) — kichik id oldin", () => {
    const juft = [v(8, "Oʻrik"), v(3, "O'rik"), v(4, "o‘rik")];
    assert.deepEqual(idlar(juft, "alifbo"), [3, 4, 8]);
  });

  test("noma'lum saralash — standart; asl massiv o'zgarmaydi", () => {
    const nusxa = structuredClone(vazifalar);
    assert.deepEqual(idlar(vazifalar, "constructor"), [5, 9, 7, 2, 1]);
    assert.deepEqual(vazifalar, nusxa);
  });

  test("SARALASHLAR muzlatilgan", () => {
    assert.deepEqual(SARALASHLAR, ["standart", "yangi", "alifbo"]);
    assert.ok(Object.isFrozen(SARALASHLAR));
  });
});

describe("VazifalarRoyxati.korinadiganlar(filtr, saralash)", () => {
  const royxat = VazifalarRoyxati.dan([
    v(1, "Non olish"),
    v(2, "Anor olish", true),
    v(3, "Choy damlash"),
    v(4, "Banan"),
  ]);
  const korin = (filtr, saralash) =>
    royxat.korinadiganlar(filtr, saralash).map((vazifa) => vazifa.id);

  test("saralashsiz — oldingi xulq", () => {
    assert.deepEqual(korin("hammasi"), [1, 3, 4, 2]);
  });

  test("filtr, keyin saralash", () => {
    assert.deepEqual(korin("faol", "yangi"), [4, 3, 1]);
    assert.deepEqual(korin("hammasi", "alifbo"), [4, 1, 3, 2]);
  });
});
