// tekshiruv/vazifa-formasi.test.js — forma sxemasi (19/#30): trim
// (transform), bo'sh, uzun, takror (refine — tashqi funksiya bilan)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  matnSxemasi,
  tahrirSxemasi,
} from "../src/sxemalar/vazifa-formasi.ts";

const xabar = (natija) =>
  natija.success ? null : natija.error.issues.map((i) => i.message);

describe("vazifa formasi sxemasi", () => {
  const sxema = matnSxemasi((m) => m.toLowerCase() === "non olish");

  test("chetlari kesiladi — natija kesilgan matn", () => {
    assert.deepEqual(sxema.safeParse("  Sut olish  "), {
      success: true,
      data: "Sut olish",
    });
  });

  test("bo'sh va faqat bo'shliq — bitta xabar", () => {
    assert.deepEqual(xabar(sxema.safeParse("   ")), [
      "Vazifa matnini yozing.",
    ]);
  });

  test("101 belgi — uzun; 100 — to'g'ri", () => {
    assert.deepEqual(xabar(sxema.safeParse("x".repeat(101))), [
      "Matn juda uzun (ko'pi bilan 100 belgi).",
    ]);
    assert.equal(sxema.safeParse("x".repeat(100)).success, true);
  });

  test("takror (kesilgandan keyin tekshiriladi)", () => {
    assert.deepEqual(xabar(sxema.safeParse(" NON OLISH ")), [
      "Bu vazifa ro'yxatda allaqachon bor.",
    ]);
  });

  test("tahrir: bajarildi — faqat boolean", () => {
    const t = tahrirSxemasi(() => false);
    assert.equal(
      t.safeParse({ matn: "A", bajarildi: "ha" }).success,
      false,
    );
    assert.deepEqual(t.parse({ matn: " A ", bajarildi: true }), {
      matn: "A",
      bajarildi: true,
    });
  });
});
