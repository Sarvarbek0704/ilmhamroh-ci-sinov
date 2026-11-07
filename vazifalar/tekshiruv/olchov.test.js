// tekshiruv/olchov.test.js — Web Vitals natijasini matnga aylantirish
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { olchovMatni } from "../src/olchov.ts";

describe("olchovMatni", () => {
  test("vaqt metrikalari — butun millisekund, baho o'zbekcha", () => {
    assert.equal(
      olchovMatni({ name: "LCP", value: 1234.56, rating: "good" }),
      "LCP: 1235 ms (yaxshi)",
    );
    assert.equal(
      olchovMatni({
        name: "INP",
        value: 350,
        rating: "needs-improvement",
      }),
      "INP: 350 ms (yaxshilash kerak)",
    );
  });

  test("CLS — birliksiz, uch xona", () => {
    assert.equal(
      olchovMatni({ name: "CLS", value: 0.30001, rating: "poor" }),
      "CLS: 0.300 (yomon)",
    );
  });
});
