// tekshiruv/fayl.test.js — import faylini o'qishdan oldin tekshirish
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { MAKS_FAYL_HAJMI, faylniTekshir } from "../src/fayl.ts";

describe("faylniTekshir", () => {
  test("eksport fayli — xato yo'q (Node'da ham File bor)", () => {
    const fayl = new File(['{"versiya": 1}'], "vazifalar.json", {
      type: "application/json",
    });
    assert.equal(faylniTekshir(fayl), null);
  });

  test("kengaytma katta harfda ham, MIME bo'sh bo'lsa ham", () => {
    assert.equal(faylniTekshir(new File(["{}"], "ESKI.JSON")), null);
  });

  test("boshqa fayl — rad", () => {
    assert.equal(
      faylniTekshir(new File(["salom"], "rasm.png")),
      "Faqat .json yoki .csv fayl import qilinadi.",
    );
  });

  test("bo'sh fayl va 1 MB dan katta fayl — rad", () => {
    assert.equal(faylniTekshir(new File([], "a.json")), "Fayl bo'sh.");
    assert.equal(
      faylniTekshir({ name: "a.json", size: MAKS_FAYL_HAJMI + 1 }),
      "Fayl juda katta: 1 MB dan oshmasin.",
    );
    assert.equal(
      faylniTekshir({ name: "a.json", size: MAKS_FAYL_HAJMI }),
      null,
    );
  });
});
