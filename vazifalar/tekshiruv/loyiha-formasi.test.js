// tekshiruv/loyiha-formasi.test.js — ko'p qadamli forma sxemasi (19/#33):
// teg, qadamlar (dinamik massiv), forma darajasidagi va async tekshiruv
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import {
  loyihaSxemasi,
  vazifaMatni,
} from "../src/sxemalar/loyiha-formasi.ts";

function sxema(serverda = []) {
  const sorovlar = [];
  const s = loyihaSxemasi(async (matnlar) => {
    sorovlar.push(matnlar);
    return matnlar.find((m) => serverda.includes(m)) ?? null;
  });
  return { s, sorovlar };
}
const xatolar = async (s, qiymat) => {
  const n = await s.safeParseAsync(qiymat);
  return n.success
    ? null
    : n.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};

describe("loyiha formasi", () => {
  test("to'g'ri — kesilgan qiymatlar, server bir marta so'raldi", async () => {
    const { s, sorovlar } = sxema();
    const n = await s.parseAsync({
      teg: " #ta'mir ",
      qadamlar: [
        { matn: " Bo'yoq olish " },
        { matn: "Devorni bo'yash" },
      ],
    });
    assert.deepEqual(
      n.qadamlar.map((q) => vazifaMatni(q.matn, n.teg)),
      ["Bo'yoq olish #ta'mir", "Devorni bo'yash #ta'mir"],
    );
    assert.equal(sorovlar.length, 1);
  });

  test("teg noto'g'ri, qadam bo'sh — maydon xatolari; serverga so'rov YO'Q", async () => {
    const { s, sorovlar } = sxema();
    assert.deepEqual(
      await xatolar(s, { teg: "ta'mir", qadamlar: [{ matn: " " }] }),
      [
        "teg: Teg # bilan boshlansin, bo'shliqsiz: #ta'mir.",
        "qadamlar.0.matn: Qadamni yozing yoki olib tashlang.",
      ],
    );
    assert.equal(sorovlar.length, 0);
  });

  test("takror qadam (forma ichida) — ikkinchisiga xato, serverga yo'q", async () => {
    const { s, sorovlar } = sxema();
    assert.deepEqual(
      await xatolar(s, {
        teg: "#a",
        qadamlar: [{ matn: "X" }, { matn: " X" }],
      }),
      ["qadamlar.1.matn: Bu qadam yuqorida bor."],
    );
    assert.equal(sorovlar.length, 0);
  });

  test("serverda bor (async) — o'sha qadamga xato", async () => {
    const { s } = sxema(["Sut olish #bozor"]);
    assert.deepEqual(
      await xatolar(s, {
        teg: "#bozor",
        qadamlar: [{ matn: "Non olish" }, { matn: "Sut olish" }],
      }),
      ["qadamlar.1.matn: «Sut olish #bozor» ro'yxatda allaqachon bor."],
    );
  });

  test("qadam yo'q yoki 11 ta — massiv xatosi", async () => {
    const { s } = sxema();
    assert.deepEqual(await xatolar(s, { teg: "#a", qadamlar: [] }), [
      "qadamlar: Kamida bitta qadam.",
    ]);
    const kop = Array.from({ length: 11 }, (_, i) => ({
      matn: `q${i}`,
    }));
    assert.deepEqual(await xatolar(s, { teg: "#a", qadamlar: kop }), [
      "qadamlar: Ko'pi bilan 10 qadam.",
    ]);
  });
});
