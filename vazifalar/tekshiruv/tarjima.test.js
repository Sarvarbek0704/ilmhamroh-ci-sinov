// tekshiruv/tarjima.test.js — tarjima fayllari (21/#02–#03): har tilda
// o'zbekchadagi HAMMA kalit bor (ko'plik shakllari — o'sha tilning
// Intl.PluralRules toifalari bo'yicha), {{o'rinlar}} bir xil; kirill
// fayllari lotinchadan yasalgan holatda (npm run kirill unutilmagan)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { kirillFayllari, kirillga } from "../skriptlar/kirill.js";

const ILDIZ = join(import.meta.dirname, "..");
const I18N = join(ILDIZ, "src/i18n");
const tillar = readdirSync(I18N, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const oqi = (til, fayl) =>
  JSON.parse(readFileSync(join(I18N, til, fayl), "utf8"));

/** Ichma-ich obyekt → { "a.b": "matn" } */
function tekis(obyekt, oldi = "") {
  return Object.entries(obyekt)
    .flatMap(([k, v]) =>
      typeof v === "object"
        ? Object.entries(tekis(v, `${oldi}${k}.`))
        : [[`${oldi}${k}`, v]],
    )
    .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
}
const KOPLIK = /_(zero|one|two|few|many|other)$/;
const orinlar = (matn) =>
  [...matn.matchAll(/\{\{\s*(\w+)/g)].map((m) => m[1]).sort();

describe("tarjima fayllari", () => {
  test("to'rt til: uz, uz-Cyrl, ru, en", () => {
    assert.deepEqual(tillar.toSorted(), ["en", "ru", "uz", "uz-Cyrl"]);
  });
  for (const fayl of readdirSync(join(I18N, "uz"))) {
    const asosiy = tekis(oqi("uz", fayl));
    const oddiy = new Set(
      Object.keys(asosiy).map((k) => k.replace(KOPLIK, "")),
    );
    for (const til of tillar.filter((t) => t !== "uz")) {
      test(`${til}/${fayl}: hamma kalit, ko'plik shakllari, o'rinlar`, () => {
        const tarjima = tekis(oqi(til, fayl));
        const toifalar = new Intl.PluralRules(til).resolvedOptions()
          .pluralCategories;
        for (const kalit of oddiy) {
          const koplikmi = Object.keys(asosiy).some(
            (k) => k !== kalit && k.replace(KOPLIK, "") === kalit,
          );
          const kerak = koplikmi
            ? toifalar.map((t) => `${kalit}_${t}`)
            : [kalit];
          for (const k of kerak) {
            assert.equal(
              typeof tarjima[k],
              "string",
              `${til}: ${k} yo'q`,
            );
            const manba = asosiy[k] ?? asosiy[`${kalit}_other`];
            assert.deepEqual(orinlar(tarjima[k]), orinlar(manba), k);
          }
        }
      });
    }
  }
});

describe("kirill (skriptlar/kirill.js)", () => {
  test("harflar va birikmalar", () => {
    assert.equal(
      kirillga("O'chirishdan oldin so'rash"),
      "Ўчиришдан олдин сўраш",
    );
    assert.equal(kirillga("Teg yo'q."), "Тег йўқ.");
    assert.equal(kirillga("Yorug' va Qorong'i"), "Ёруғ ва Қоронғи");
    assert.equal(kirillga("Sahifa"), "Саҳифа");
    assert.equal(
      kirillga("ma'lumot, ekran, shahar, choy"),
      "маълумот, экран, шаҳар, чой",
    );
    assert.equal(kirillga("yangi yulduz yetti"), "янги юлдуз етти");
  });
  test("{{o'rinlar}} va «» tegilmaydi", () => {
    assert.equal(
      kirillga("«{{yol}}» manzilida"),
      "«{{yol}}» манзилида",
    );
  });
  test("uz-Cyrl fayllari lotinchadan yangi yasalgan (npm run kirill)", () => {
    for (const [fayl, matn] of kirillFayllari(ILDIZ)) {
      assert.equal(
        readFileSync(join(I18N, "uz-Cyrl", fayl), "utf8"),
        matn,
        fayl,
      );
    }
  });
});
