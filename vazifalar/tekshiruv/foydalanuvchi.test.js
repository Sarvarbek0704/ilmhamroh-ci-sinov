// tekshiruv/foydalanuvchi.test.js — soxta kirish (18/#42): ism va
// saqlangan matnni o'qish (tashqi ma'lumot — unknown)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  foydalanuvchiniOqi,
  ismXatosi,
  keyingiManzil,
} from "../src/xususiyatlar/auth/foydalanuvchi.ts";

describe("foydalanuvchi", () => {
  test("ismXatosi: bo'sh, qisqa, uzun — xato; to'g'ri — null", () => {
    assert.equal(ismXatosi("  "), "Ismingizni yozing (kamida 2 harf).");
    assert.equal(ismXatosi("M"), "Ismingizni yozing (kamida 2 harf).");
    assert.equal(
      ismXatosi("x".repeat(41)),
      "Ism juda uzun (ko'pi bilan 40 harf).",
    );
    assert.equal(ismXatosi(" Malika "), null);
  });

  test("foydalanuvchiniOqi: to'g'ri JSON — ism (kesilgan)", () => {
    assert.deepEqual(foydalanuvchiniOqi('{"ism":" Bobur "}'), {
      ism: "Bobur",
    });
  });

  test("foydalanuvchiniOqi: yo'q, buzuq, boshqa shakl — null (kirilmagan)", () => {
    assert.equal(foydalanuvchiniOqi(null), null);
    assert.equal(foydalanuvchiniOqi("{buzuq"), null);
    assert.equal(foydalanuvchiniOqi('"Malika"'), null);
    assert.equal(foydalanuvchiniOqi('{"ism":1}'), null);
    assert.equal(foydalanuvchiniOqi('{"ism":"M"}'), null);
    assert.equal(foydalanuvchiniOqi("null"), null);
  });

  // 19/#07: ?keyin= — faqat ilova ichidagi yo'l (open redirect yo'q)
  test("keyingiManzil: ichki yo'l — o'zi; begona, yo'q — \"/\"", () => {
    assert.equal(keyingiManzil("/vazifa/2?x=1"), "/vazifa/2?x=1");
    assert.equal(keyingiManzil("/?filtr=faol"), "/?filtr=faol");
    for (const yomon of [
      null,
      "",
      "https://yomon.example",
      "//yomon.example/x",
      "/\\yomon.example",
      "javascript:alert(1)",
    ]) {
      assert.equal(keyingiManzil(yomon), "/", String(yomon));
    }
  });
});
