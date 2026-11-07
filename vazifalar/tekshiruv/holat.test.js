// tekshiruv/holat.test.js — holatning sof qismi (17/#28 dan holat —
// App'ning useState'larida; bu yerda qiymat qaytaradigan funksiyalar)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { VazifalarRoyxati } from "../src/royxat.ts";
import {
  boshlangichVazifalar,
  korinadiganVazifalar,
  qoshilgandaKorinsin,
  qoshniId,
  xatoniTop,
} from "../src/holat.ts";

const royxat = () => VazifalarRoyxati.dan(boshlangichVazifalar);

describe("holat", () => {
  test("boshlang'ich vazifalar: uchta, muzlagan", () => {
    assert.equal(boshlangichVazifalar.length, 3);
    assert.equal(Object.isFrozen(boshlangichVazifalar[0]), true);
  });

  test("xatoniTop: bo'sh, takror, to'g'ri", () => {
    assert.equal(
      xatoniTop("", royxat(), null),
      "Vazifa matnini yozing.",
    );
    assert.equal(
      xatoniTop("non olish", royxat(), null),
      "Bu vazifa ro'yxatda allaqachon bor.",
    );
    assert.equal(xatoniTop("non olish", royxat(), 1), null);
    assert.equal(xatoniTop("Sabzi", royxat(), null), null);
  });

  test("korinadiganVazifalar filtrga qaraydi", () => {
    assert.deepEqual(
      korinadiganVazifalar(
        boshlangichVazifalar,
        "bajarilgan",
        "standart",
        "",
      ).map((v) => v.id),
      [2],
    );
  });

  test("18/#20 korinadiganVazifalar — ro'yxatdagi O'SHA obyektlar (memo uchun)", () => {
    const natija = korinadiganVazifalar(
      boshlangichVazifalar,
      "hammasi",
      "standart",
      "",
    );
    assert.equal(
      natija.every((v) => boshlangichVazifalar.includes(v)),
      true,
    );
  });

  test("bajarilganlar filtrida qo'shish — filtr hammasi, faol — qoladi", () => {
    assert.equal(
      qoshilgandaKorinsin("Sabzi olish", "bajarilgan", "").filtr,
      "hammasi",
    );
    assert.equal(qoshilgandaKorinsin("Choy", "faol", "").filtr, "faol");
  });

  test("qoshniId: keyingisi, oxirgisida — oldingisi, yolg'izda — null", () => {
    const qatorlar = [{ id: 3 }, { id: 1 }, { id: 2 }];
    assert.equal(qoshniId(qatorlar, 1), 2);
    assert.equal(qoshniId(qatorlar, 2), 1);
    assert.equal(qoshniId([{ id: 5 }], 5), null);
    assert.equal(qoshniId(qatorlar, 99), null);
  });
});
