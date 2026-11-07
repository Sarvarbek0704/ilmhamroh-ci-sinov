// tekshiruv/flaglar.test.js — flag matni (src/flag-royxati.ts, 21/#20)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  FLAGLAR,
  flagMatniniOqi,
  flagmi,
} from "../src/flag-royxati.ts";

describe("flaglar", () => {
  test("ma'lum flag — true/false, noma'lumi tashlanadi", () => {
    assert.deepEqual(flagMatniniOqi("teglar-grafigi"), {
      "teglar-grafigi": true,
    });
    assert.deepEqual(flagMatniniOqi(" -teglar-grafigi , boshqa"), {
      "teglar-grafigi": false,
    });
    assert.deepEqual(flagMatniniOqi(""), {});
  });
  test("flagmi: faqat ro'yxatdagi (prototip kalitlari emas)", () => {
    assert.equal(flagmi("teglar-grafigi"), true);
    assert.equal(flagmi("toString"), false);
    assert.equal(flagmi("__proto__"), false);
  });
  test("standartlar", () => {
    assert.equal(FLAGLAR["teglar-grafigi"], true);
  });
});
