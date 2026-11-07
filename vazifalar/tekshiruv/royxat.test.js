// tekshiruv/royxat.test.js — VazifalarRoyxati va Vazifa (so'rovlar).
// O'zgartirish testlari — amallar.test.js (17/#14)
import "./xotira.js";
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { Vazifa } from "../src/vazifa.ts";
import { VazifalarRoyxati } from "../src/royxat.ts";
import { eksportMatni, paketniOqi } from "../src/paket.ts";
import { almashtir, qosh } from "../src/amallar.ts";
import { boshlangichVazifalar } from "../src/holat.ts";

// Har test o'z ro'yxati bilan: testlar bir-biriga bog'liq bo'lmasin
function yangiRoyxat() {
  return VazifalarRoyxati.dan(boshlangichVazifalar);
}

describe("VazifalarRoyxati", () => {
  test("statistika: 2 ta qoldi, 1 ta bajarildi", () => {
    assert.deepEqual(yangiRoyxat().statistika(), {
      qoldi: 2,
      bajarildi: 1,
    });
  });

  test("bo'sh ro'yxat statistikasi — nollar", () => {
    const royxat = VazifalarRoyxati.dan([]);
    assert.deepEqual(royxat.statistika(), { qoldi: 0, bajarildi: 0 });
    assert.equal(royxat.qoldi, 0);
  });

  test("matnBormi: katta-kichik harf farq qilmaydi, o'zi hisobmas", () => {
    const royxat = yangiRoyxat();
    assert.equal(royxat.matnBormi("NON OLISH", null), true);
    assert.equal(royxat.matnBormi("non olish", 1), false);
    assert.equal(royxat.matnBormi("Sabzi", null), false);
  });

  test("korinadiganlar: faollar tepada, filtr bo'yicha", () => {
    const royxat = VazifalarRoyxati.dan(
      almashtir(qosh(boshlangichVazifalar, "Sabzi olish"), 1),
    );
    const idlar = (filtr) =>
      royxat.korinadiganlar(filtr).map((v) => v.id);
    assert.deepEqual(idlar("hammasi"), [3, 4, 1, 2]);
    assert.deepEqual(idlar("faol"), [3, 4]);
    assert.deepEqual(idlar("bajarilgan"), [1, 2]);
    assert.deepEqual(idlar("constructor"), [3, 4, 1, 2]);
  });

  test("tegHisobi va yopilganTeglar", () => {
    const royxat = VazifalarRoyxati.dan([
      { id: 1, matn: "Sabzi #bozor #uy", bajarildi: false },
      { id: 2, matn: "Non #BOZOR", bajarildi: true },
      { id: 3, matn: "Kir yuvish #uy #yuvish", bajarildi: true },
      { id: 4, matn: "# yolg'iz panjara", bajarildi: false },
    ]);
    assert.deepEqual(
      [...royxat.tegHisobi()],
      [
        ["#bozor", 2],
        ["#uy", 2],
        ["#yuvish", 1],
      ],
    );
    assert.deepEqual([...royxat.yopilganTeglar()], ["#yuvish"]);
  });

  // Bitta vazifadagi teglar (teglariniOl eksport qilinmaydi)
  const teglar = (matn) => [
    ...VazifalarRoyxati.dan([{ id: 1, matn, bajarildi: false }])
      .tegHisobi()
      .keys(),
  ];

  test("teg: vergul va nuqta tegga yopishmaydi", () => {
    assert.deepEqual(teglar("Non olish #bozor, #uy"), [
      "#bozor",
      "#uy",
    ]);
    assert.deepEqual(teglar("Sabzi #bozor,#uy."), ["#bozor", "#uy"]);
  });

  test("teg: o'zbekcha apostrof — ', ʻ (U+02BB), ’", () => {
    assert.deepEqual(teglar("#o'quv #g'isht"), ["#o'quv", "#g'isht"]);
    const okina = "ʻ"; // U+02BB — ko'zga ' ga o'xshaydi
    assert.equal(okina.codePointAt(0), 0x02bb);
    assert.deepEqual(teglar(`#o${okina}quv #g${okina}isht`), [
      `#o${okina}quv`,
      `#g${okina}isht`,
    ]);
    assert.deepEqual(teglar("#g’isht"), ["#g’isht"]);
    assert.deepEqual(teglar("'#o'quv'"), ["#o'quv"]);
  });

  test("teg: emoji tegga kirmaydi", () => {
    assert.deepEqual(teglar("#bozor🛒 #🛒"), ["#bozor"]);
  });

  test("teg emas: # yolg'iz, ##, so'z ichidagi #", () => {
    assert.deepEqual(teglar("# ## Non#uy ##bozor"), []);
  });

  test("teg: katta harf kichikka, takror bitta", () => {
    assert.deepEqual(teglar("#BOZOR #Bozor #ДОМ"), ["#bozor", "#дом"]);
  });

  test("iterable va toJSON", () => {
    const royxat = yangiRoyxat();
    assert.equal([...royxat].length, 3);
    assert.ok([...royxat].every((v) => v instanceof Vazifa));
    assert.deepEqual(royxat.toJSON(), boshlangichVazifalar);
  });

  test("boshlang'ich vazifalar muzlagan", () => {
    assert.equal(Object.isFrozen(boshlangichVazifalar), true);
    assert.equal(Object.isFrozen(boshlangichVazifalar[0]), true);
  });

  test("eksport → import: hammasi qaytadi", () => {
    const royxat = VazifalarRoyxati.dan(
      qosh(boshlangichVazifalar, "Choy damlash"),
    );
    const qaytgan = paketniOqi(eksportMatni(royxat));
    assert.equal(qaytgan.length, 4);
    assert.equal(qaytgan[3].matn, "Choy damlash");
  });
});
