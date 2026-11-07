// tekshiruv/til-yoli.test.js — til manzilda (src/i18n/yol.ts, 21/#03)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { tildaYol, tilmi, yoldanTil } from "../src/i18n/yol.ts";

describe("yoldanTil", () => {
  test("prefikssiz — o'zbekcha, yo'l o'zgarmaydi", () => {
    assert.deepEqual(yoldanTil("/statistika"), {
      til: "uz",
      asos: "/",
      qolgani: "/statistika",
    });
    assert.deepEqual(yoldanTil("/"), {
      til: "uz",
      asos: "/",
      qolgani: "/",
    });
  });
  test("prefiks — til va basename", () => {
    assert.deepEqual(yoldanTil("/ru/vazifa/2"), {
      til: "ru",
      asos: "/ru",
      qolgani: "/vazifa/2",
    });
    assert.deepEqual(yoldanTil("/uz-cyrl/"), {
      til: "uz-Cyrl",
      asos: "/uz-cyrl",
      qolgani: "/",
    });
    assert.deepEqual(yoldanTil("/en"), {
      til: "en",
      asos: "/en",
      qolgani: "/",
    });
    assert.deepEqual(yoldanTil("/RU/statistika").til, "ru");
  });
  test("GitHub Pages papkasi bilan", () => {
    assert.deepEqual(
      yoldanTil("/vazifalar/ru/statistika", "/vazifalar/"),
      { til: "ru", asos: "/vazifalar/ru", qolgani: "/statistika" },
    );
    assert.deepEqual(
      yoldanTil("/vazifalar/statistika", "/vazifalar/"),
      { til: "uz", asos: "/vazifalar", qolgani: "/statistika" },
    );
  });
  test("noma'lum prefiks — sahifa yo'li (404 sahifasi ko'rsatadi)", () => {
    assert.deepEqual(yoldanTil("/de/statistika"), {
      til: "uz",
      asos: "/",
      qolgani: "/de/statistika",
    });
    assert.equal(yoldanTil("/uz/statistika").til, "uz"); // "uz" prefiksi yo'q — asosiy til prefikssiz
    assert.equal(yoldanTil("/uz/statistika").qolgani, "/uz/statistika");
  });
});

describe("tildaYol", () => {
  test("xuddi shu sahifa boshqa tilda, so'rov saqlanadi", () => {
    assert.equal(
      tildaYol("/statistika", "?x=1", "ru"),
      "/ru/statistika?x=1",
    );
    assert.equal(tildaYol("/ru/statistika", "", "uz"), "/statistika");
    assert.equal(tildaYol("/ru", "", "uz"), "/");
    assert.equal(
      tildaYol("/en/vazifa/3/tahrir", "", "uz-Cyrl"),
      "/uz-cyrl/vazifa/3/tahrir",
    );
    assert.equal(
      tildaYol("/vazifalar/ru/", "?filtr=faol", "en", "/vazifalar/"),
      "/vazifalar/en/?filtr=faol",
    );
    assert.equal(
      tildaYol("/vazifalar/en/", "", "uz", "/vazifalar/"),
      "/vazifalar/",
    );
  });
  test("tilmi", () => {
    assert.equal(tilmi("uz-Cyrl"), true);
    assert.equal(tilmi("uz-cyrl"), false);
    assert.equal(tilmi(undefined), false);
  });
});

describe("sanaYoz (src/i18n/sana.ts)", async () => {
  const { sanaYoz } = await import("../src/i18n/sana.ts");
  const sana = new Date(2026, 9, 7, 9, 5);
  test("o'zbekcha (lotin) — o'z shaklimiz, Intl'ga tayanmaydi", () => {
    assert.equal(sanaYoz(sana, "uz"), "7-oktabr, 2026 09:05");
  });
  test("boshqa tillar — Intl (uzun sana, qisqa vaqt)", () => {
    assert.match(sanaYoz(sana, "ru"), /7 октября 2026/);
    assert.match(sanaYoz(sana, "en"), /October 7, 2026/);
  });
});
