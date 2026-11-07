// tekshiruv/amallar.test.js — o'zgarmas (immutable) yangilash (17/#14).
// Har amal: YANGI massiv, eski massiv va tegilmagan vazifalar — o'sha
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  almashtir,
  keyingiId,
  matnniOzgartir,
  ochir,
  qosh,
} from "../src/amallar.ts";

// Muzlatilgan: biror amal joyida o'zgartirsa — TypeError (strict mode)
const boshlangich = Object.freeze([
  Object.freeze({ id: 1, matn: "Non olish", bajarildi: false }),
  Object.freeze({
    id: 2,
    matn: "DOM darsini takrorlash",
    bajarildi: true,
  }),
  Object.freeze({
    id: 3,
    matn: "Onamga qo'ng'iroq qilish",
    bajarildi: false,
  }),
]);

describe("amallar", () => {
  test("keyingiId — eng kattasidan keyingisi; bo'sh ro'yxatda 1", () => {
    assert.equal(keyingiId(boshlangich), 4);
    assert.equal(keyingiId([]), 1);
    assert.equal(
      keyingiId([{ id: 7, matn: "A", bajarildi: false }]),
      8,
    );
  });

  test("qosh: oxiriga, yangi massiv, eskisi o'zgarmagan", () => {
    const yangi = qosh(boshlangich, "Sabzi olish");
    assert.notEqual(yangi, boshlangich);
    assert.equal(boshlangich.length, 3);
    assert.deepEqual(yangi.at(-1), {
      id: 4,
      matn: "Sabzi olish",
      bajarildi: false,
    });
    // Tegilmagan vazifalar — nusxa emas, o'sha obyektlar
    assert.equal(yangi[0], boshlangich[0]);
  });

  test("id hisoblagichda emas, ro'yxatdan: o'chirilgan eng katta id qaytadi", () => {
    // v6 (VazifalarRoyxati) sinxrongacha 5 berardi; endi id — hosilaviy
    // qiymat (17/#15). Server id'sini baribir o'zi beradi
    const ikkinchi = qosh(ochir(qosh(boshlangich, "Sabzi"), 4), "Choy");
    assert.equal(ikkinchi.at(-1).id, 4);
  });

  test("almashtir: faqat o'sha vazifa yangi obyekt", () => {
    const yangi = almashtir(boshlangich, 1);
    assert.equal(yangi[0].bajarildi, true);
    assert.equal(boshlangich[0].bajarildi, false);
    assert.notEqual(yangi[0], boshlangich[0]);
    assert.equal(yangi[1], boshlangich[1]);
  });

  test("matnniOzgartir: kesiladi; bo'sh yoki uzun — o'sha massiv", () => {
    assert.equal(matnniOzgartir(boshlangich, 1, "   "), boshlangich);
    assert.equal(
      matnniOzgartir(boshlangich, 1, "x".repeat(101)),
      boshlangich,
    );
    const yangi = matnniOzgartir(boshlangich, 1, "  Yangi matn ");
    assert.equal(yangi[0].matn, "Yangi matn");
    assert.equal(boshlangich[0].matn, "Non olish");
  });

  test("ochir: qolganlar tartibi bilan", () => {
    assert.deepEqual(
      ochir(boshlangich, 2).map((v) => v.id),
      [1, 3],
    );
    assert.equal(boshlangich.length, 3);
  });

  test("noma'lum id — xato emas, mazmun o'zgarmaydi", () => {
    assert.deepEqual(almashtir(boshlangich, 99), boshlangich);
    assert.deepEqual(ochir(boshlangich, 99), boshlangich);
  });
});
