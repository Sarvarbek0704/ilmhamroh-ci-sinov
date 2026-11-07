// tekshiruv/fayl-tekshir.test.js — profil rasmi tekshiruvi (19/#36)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  faylniTekshir,
  hajmMatni,
} from "../src/xususiyatlar/profil-rasmi/fayl-tekshir.ts";

describe("faylniTekshir", () => {
  const fayl = (name, type, size) => ({ name, type, size });

  test("PNG, JPEG, WebP — 1 MB gacha — yaroqli", () => {
    for (const tur of ["image/png", "image/jpeg", "image/webp"]) {
      assert.equal(faylniTekshir(fayl("a", tur, 1_000_000)), null);
    }
  });

  test("boshqa tur (SVG ham — skript bo'lishi mumkin), bo'sh, katta", () => {
    assert.equal(
      faylniTekshir(fayl("a.svg", "image/svg+xml", 10)),
      "«a.svg» — rasm emas (PNG, JPEG yoki WebP kerak).",
    );
    assert.equal(
      faylniTekshir(fayl("b.png", "image/png", 0)),
      "«b.png» bo'sh.",
    );
    assert.equal(
      faylniTekshir(fayl("c.jpg", "image/jpeg", 1_200_000)),
      "«c.jpg» juda katta (1.2 MB; ko'pi bilan 1.0 MB).",
    );
  });

  test("hajmMatni", () => {
    assert.deepEqual([950, 12_345, 1_000_000].map(hajmMatni), [
      "950 B",
      "12.3 KB",
      "1.0 MB",
    ]);
  });
});
