// tekshiruv/maxfiylik.test.js — analitika/xato kuzatuvi nimani yubormaydi (21/#18–#19)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  kuzatmaslikSoralgan,
  shaxsiyniYashir,
  yolniUmumlashtir,
} from "../src/kuzatuv/maxfiylik.ts";

describe("maxfiylik", () => {
  test("yo'l: id'lar :id, so'rov va # yo'q", () => {
    assert.equal(
      yolniUmumlashtir("/vazifa/12/tahrir"),
      "/vazifa/:id/tahrir",
    );
    assert.equal(yolniUmumlashtir("/vazifa/7"), "/vazifa/:id");
    assert.equal(yolniUmumlashtir("/?filtr=faol&q=non#royxat"), "/");
    assert.equal(yolniUmumlashtir("/statistika"), "/statistika");
  });
  test("shaxsiy ma'lumot matndan olib tashlanadi", () => {
    assert.equal(
      shaxsiyniYashir("aziz@example.com ga yozilmadi"),
      "[email] ga yozilmadi",
    );
    assert.equal(
      shaxsiyniYashir("+998 90 000 00 00 topilmadi"),
      "[raqam] topilmadi",
    );
    assert.equal(
      shaxsiyniYashir("at https://x.uz/vazifa?kalit=abc (main.js:1)"),
      "at https://x.uz/vazifa?… (main.js:1)",
    );
  });
  test("GPC yoki DNT — kuzatmaslik", () => {
    assert.equal(
      kuzatmaslikSoralgan({ globalPrivacyControl: true }),
      true,
    );
    assert.equal(kuzatmaslikSoralgan({ doNotTrack: "1" }), true);
    assert.equal(kuzatmaslikSoralgan({ doNotTrack: null }), false);
  });
});

describe("xatoYozuvi (src/kuzatuv/xato-yozuvi.ts)", async () => {
  const { xatoYozuvi } = await import("../src/kuzatuv/xato-yozuvi.ts");
  const muhit = {
    yol: "/vazifa/5/tahrir?x=1",
    til: "ru",
    reliz: "abc1234",
    iz: ["/", "/vazifa/:id"],
  };
  test("Error: nom, xabar (yashirilgan), stack ≤ 8 qator, yo'l, reliz, iz", () => {
    const x = new TypeError("aziz@example.com uchun topilmadi");
    const y = xatoYozuvi(x, "window", muhit);
    assert.deepEqual(
      [y.nom, y.xabar, y.manba, y.yol, y.til, y.reliz, y.iz],
      [
        "TypeError",
        "[email] uchun topilmadi",
        "window",
        "/vazifa/:id/tahrir",
        "ru",
        "abc1234",
        ["/", "/vazifa/:id"],
      ],
    );
    assert.ok(y.stack.split("\n").length <= 8);
  });
  test('Error bo\'lmagan qiymat (throw "matn", reject({kod}))', () => {
    assert.equal(
      xatoYozuvi("satr xato", "promise", muhit).xabar,
      "satr xato",
    );
    assert.equal(
      xatoYozuvi({ kod: 42 }, "promise", muhit).xabar,
      '{"kod":42}',
    );
  });
});
