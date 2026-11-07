// tekshiruv/reducer.test.js — vazifalarReducer (17/#39): sof funksiya,
// React'siz sinaladi
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { boshlangichHolat, vazifalarReducer } from "../src/reducer.ts";

const holat = boshlangichHolat([
  { id: 1, matn: "Non olish", bajarildi: false },
  { id: 2, matn: "DOM darsini takrorlash", bajarildi: true },
]);

describe("vazifalarReducer", () => {
  test("qoshildi: oxiriga, eski holat o'zgarmaydi", () => {
    const yangi = vazifalarReducer(holat, {
      tur: "qoshildi",
      matn: "Choy",
    });
    assert.deepEqual(yangi.vazifalar.at(-1), {
      id: 3,
      matn: "Choy",
      bajarildi: false,
    });
    assert.equal(holat.vazifalar.length, 2);
  });

  test("almashtirildi va ochirildi tahrirni yopadi", () => {
    const tahrirda = vazifalarReducer(holat, {
      tur: "tahrirBoshlandi",
      id: 1,
    });
    const a = vazifalarReducer(tahrirda, {
      tur: "almashtirildi",
      id: 1,
    });
    assert.equal(a.vazifalar[0].bajarildi, true);
    assert.equal(a.tahrirId, null);
    const o = vazifalarReducer(tahrirda, { tur: "ochirildi", id: 2 });
    assert.deepEqual(
      o.vazifalar.map((v) => v.id),
      [1],
    );
    assert.equal(o.tahrirId, null);
  });

  test("matnOzgardi: kesiladi, tahrir yopiladi", () => {
    const yangi = vazifalarReducer(
      { ...holat, tahrirId: 1 },
      { tur: "matnOzgardi", id: 1, matn: "  Sut olish " },
    );
    assert.equal(yangi.vazifalar[0].matn, "Sut olish");
    assert.equal(yangi.tahrirId, null);
  });

  test("royxatKeldi: bir xil — O'SHA holat (qayta chizish yo'q)", () => {
    const nusxa = holat.vazifalar.map((v) => ({ ...v }));
    assert.equal(
      vazifalarReducer(holat, { tur: "royxatKeldi", vazifalar: nusxa }),
      holat,
    );
  });

  test("royxatKeldi: tahrirdagi vazifa yo'qolsa — tahrir yopiladi", () => {
    const yangi = vazifalarReducer(
      { ...holat, tahrirId: 2 },
      { tur: "royxatKeldi", vazifalar: [holat.vazifalar[0]] },
    );
    assert.equal(yangi.tahrirId, null);
    assert.equal(yangi.vazifalar.length, 1);
  });

  test("tahrirYopildi: yopiq bo'lsa — o'sha holat", () => {
    assert.equal(
      vazifalarReducer(holat, { tur: "tahrirYopildi" }),
      holat,
    );
  });

  test("18/#07 serverdanKeldi: bor id — almashadi, yangi id — oxiriga", () => {
    const almashdi = vazifalarReducer(holat, {
      tur: "serverdanKeldi",
      vazifa: { id: 1, matn: "Non olish", bajarildi: true },
    });
    assert.deepEqual(
      almashdi.vazifalar.map((v) => [v.id, v.bajarildi]),
      [
        [1, true],
        [2, true],
      ],
    );
    assert.equal(almashdi.vazifalar[1], holat.vazifalar[1]);
    const qoshildi = vazifalarReducer(holat, {
      tur: "serverdanKeldi",
      vazifa: { id: 7, matn: "Choy", bajarildi: false },
    });
    assert.deepEqual(
      qoshildi.vazifalar.map((v) => v.id),
      [1, 2, 7],
    );
  });

  test("noma'lum amal — TypeError (tsc ko'rmagan JS chaqiruvi)", () => {
    assert.throws(() => vazifalarReducer(holat, { tur: "boshqa" }), {
      name: "TypeError",
      message: `Noma'lum amal: {"tur":"boshqa"}`,
    });
  });
});
