// tekshiruv/api-sxema.test.js — server shartnomasi (19/#12, Zod).
// 15/#42 dagi serverRoyxatiniTekshir testlari shu yerga ko'chdi: qoidalar
// o'sha (uch maydon, musbat butun id, takrorlanmas, matn bo'sh emas va
// 100 belgidan oshmaydi), xabarlar — Zod issues
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  serverRoyxatiSxemasi,
  sxemaXatosi,
  vazifaSxemasi,
} from "../src/api-sxema.ts";

const xatosi = (sxema, malumot) => {
  const natija = sxema.safeParse(malumot);
  return natija.success ? null : sxemaXatosi(natija.error);
};

describe("serverRoyxatiSxemasi", () => {
  test("to'g'ri javob — faqat uch maydon qoladi", () => {
    assert.deepEqual(
      serverRoyxatiSxemasi.parse({
        vazifalar: [
          { id: 2, matn: "Non", bajarildi: true, egasi: "x" },
        ],
        versiya: 5,
      }),
      {
        vazifalar: [{ id: 2, matn: "Non", bajarildi: true }],
        versiya: 5,
      },
    );
  });

  test("obyekt emas, vazifalar massiv emas, versiya yo'q/manfiy/kasr", () => {
    for (const yomon of [
      null,
      [],
      { vazifalar: {}, versiya: 1 },
      { vazifalar: [] },
      { vazifalar: [], versiya: -1 },
      { vazifalar: [], versiya: "2" },
      { vazifalar: [], versiya: 1.5 },
    ]) {
      assert.notEqual(xatosi(serverRoyxatiSxemasi, yomon), null);
    }
  });

  test("vazifa buzuq — yo'li bilan", () => {
    assert.equal(
      xatosi(serverRoyxatiSxemasi, {
        vazifalar: [{ id: 0, matn: "A", bajarildi: false }],
        versiya: 1,
      }),
      "vazifalar.0.id: id musbat son emas",
    );
  });

  test("takrorlangan id", () => {
    assert.equal(
      xatosi(serverRoyxatiSxemasi, {
        vazifalar: [
          { id: 1, matn: "A", bajarildi: false },
          { id: 1, matn: "B", bajarildi: true },
        ],
        versiya: 1,
      }),
      "vazifalar: id takrorlangan",
    );
  });
});

describe("vazifaSxemasi", () => {
  test("matn: bo'sh, faqat bo'shliq, 101 belgi — xato; 100 — to'g'ri", () => {
    const v = (matn) => ({ id: 1, matn, bajarildi: false });
    assert.equal(xatosi(vazifaSxemasi, v("")), "matn: matn bo'sh");
    assert.equal(xatosi(vazifaSxemasi, v("   ")), "matn: matn bo'sh");
    assert.equal(
      xatosi(vazifaSxemasi, v("x".repeat(101))),
      "matn: matn juda uzun",
    );
    assert.equal(xatosi(vazifaSxemasi, v("x".repeat(100))), null);
  });

  test("bajarildi boolean emas; null", () => {
    assert.notEqual(
      xatosi(vazifaSxemasi, { id: 1, matn: "A", bajarildi: "ha" }),
      null,
    );
    assert.notEqual(xatosi(vazifaSxemasi, null), null);
  });
});
