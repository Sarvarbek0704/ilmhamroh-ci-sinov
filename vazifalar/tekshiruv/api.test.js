// tekshiruv/api.test.js — api.js internetsiz: fetch o'rniga soxta javob
// Soxta fetch tikuv (seam) orqali beriladi — globalThis'ga tegmaymiz
import { afterEach, describe, test, vi } from "vitest";
import assert from "node:assert/strict";
import { apiKlient, ApiXatosi } from "../src/api.ts";

const asosiyUrl = "https://ilmhamroh.uz/api/mashq";
// 25-qism: o'z API'miz — ro'yxat kalitsiz, GET to'liq sahifa bilan
const manzil = `${asosiyUrl}/vazifalar`;
const royxatManzili = `${manzil}?limit=100`;

// 19/#12: javob shartnomaga mos bo'lishi kerak — sukut bo'yicha har
// metodga to'g'ri javob (ro'yxat, vazifa yoki bo'sh)
function togriJavob(_url, sozlama) {
  const metod = sozlama?.method ?? "GET";
  if (metod === "GET" || metod === "PUT") {
    return Response.json({ vazifalar: [], versiya: 1 });
  }
  if (metod === "DELETE") {
    return new Response(null, { status: 204 });
  }
  return Response.json({ id: 3, matn: "Non", bajarildi: false });
}

// Chaqiruvlarni yozib boradigan soxta fetch; oxirgisi soxtaKlient'ga
let joriyFetch;
function soxtaFetch(javob = togriJavob) {
  joriyFetch = vi.fn(async (url, sozlama) => javob(url, sozlama));
  return joriyFetch;
}

function soxtaKlient(qoshimcha = {}) {
  return apiKlient({
    asosiyUrl,
    kalit: "k1",
    fetch: joriyFetch,
    ...qoshimcha,
  });
}

afterEach(() => vi.restoreAllMocks());

describe("apiKlient so'rovlari", () => {
  test("royxat — GET, tanasiz", async () => {
    const soxta = soxtaFetch(() =>
      Response.json({ vazifalar: [], versiya: 0 }),
    );
    assert.deepEqual(await soxtaKlient().royxat(), {
      vazifalar: [],
      versiya: 0,
    });
    const [url, sozlama] = soxta.mock.calls[0];
    assert.equal(url, royxatManzili);
    assert.equal(sozlama.method, "GET");
    assert.deepEqual(sozlama.headers, { Accept: "application/json" });
    assert.equal(sozlama.body, undefined);
    assert.ok(sozlama.signal instanceof AbortSignal);
  });

  test("qosh, yangila, ochir, almashtir — metod, manzil, tana", async () => {
    const soxta = soxtaFetch();
    const api = soxtaKlient();
    await api.qosh("Non");
    await api.yangila(3, { bajarildi: true });
    await api.ochir(3);
    await api.almashtir([{ id: 1, matn: "A", bajarildi: false }]);
    const chaqiruvlar = soxta.mock.calls.map(([u, s]) => [
      s.method,
      u,
      s.body ?? null,
    ]);
    assert.deepEqual(chaqiruvlar, [
      ["POST", manzil, '{"matn":"Non"}'],
      ["PATCH", `${manzil}/3`, '{"bajarildi":true}'],
      ["DELETE", `${manzil}/3`, null],
      [
        "PUT",
        manzil,
        '{"vazifalar":[{"id":1,"matn":"A","bajarildi":false}]}',
      ],
    ]);
    const tanali = soxta.mock.calls[0][1].headers;
    assert.equal(tanali["Content-Type"], "application/json");
  });

  test("muvaffaqiyatsiz: faqat yozuvlarga ?muvaffaqiyatsiz=1", async () => {
    const soxta = soxtaFetch();
    const api = soxtaKlient({ muvaffaqiyatsiz: true });
    await api.royxat();
    await api.qosh("Non");
    await api.yangila(2, { matn: "B" });
    await api.ochir(2);
    await api.almashtir([]);
    assert.deepEqual(
      soxta.mock.calls.map((c) => c[0]),
      [
        royxatManzili,
        `${manzil}?muvaffaqiyatsiz=1`,
        `${manzil}/2?muvaffaqiyatsiz=1`,
        `${manzil}/2?muvaffaqiyatsiz=1`,
        `${manzil}?muvaffaqiyatsiz=1`,
      ],
    );
  });

  test("bo'sh javob (DELETE) — undefined", async () => {
    soxtaFetch(() => new Response(null, { status: 204 }));
    assert.equal(await soxtaKlient().ochir(1), undefined);
  });

  // 19/#12: tiplangan kontrakt — shakl mos kelmasa ApiXatosi (JAVOB)
  test("javob shartnomaga mos emas — JAVOB, Zod xatosi cause'da", async () => {
    soxtaFetch(() => Response.json({ vazifalar: [{ id: "1" }] }));
    await assert.rejects(soxtaKlient().royxat(), (xato) => {
      assert.ok(xato instanceof ApiXatosi);
      assert.equal(xato.kod, "JAVOB");
      assert.match(
        xato.message,
        /^Server javobi kutilgan shaklda emas/,
      );
      // zod/mini xatosi — "$ZodError" (klassik zod'da "ZodError")
      assert.match(xato.cause?.name ?? "", /ZodError$/);
      return true;
    });
  });
});

describe("tikuv (seam)", () => {
  test("fetch berilmasa — globalThis.fetch ishlatiladi", async () => {
    const global = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () =>
        Response.json({ vazifalar: [], versiya: 0 }),
      );
    const api = apiKlient({ asosiyUrl, kalit: "k1" });
    await api.royxat();
    assert.equal(global.mock.calls.length, 1);
  });

  test("berilgan fetch this'siz chaqiriladi", async () => {
    const soxta = soxtaFetch();
    await soxtaKlient().royxat();
    assert.equal(soxta.mock.contexts[0], undefined);
  });
});

describe("ApiXatosi", () => {
  async function xatosi(javob) {
    soxtaFetch(javob);
    try {
      await soxtaKlient().royxat();
    } catch (xato) {
      assert.ok(xato instanceof ApiXatosi);
      return { kod: xato.kod, holat: xato.holat, xabar: xato.message };
    }
    assert.fail("xato chiqmadi");
  }

  test("status → kod; server xabari olinadi", async () => {
    const javob =
      (status, tana = "") =>
      () =>
        new Response(tana, { status });
    assert.deepEqual(
      await xatosi(javob(404, '{"xato":"Vazifa topilmadi"}')),
      { kod: "TOPILMADI", holat: 404, xabar: "Vazifa topilmadi" },
    );
    assert.deepEqual(await xatosi(javob(400)), {
      kod: "NOTOGRI",
      holat: 400,
      xabar: "Server xatosi: 400",
    });
    assert.deepEqual(await xatosi(javob(422)), {
      kod: "NOTOGRI",
      holat: 422,
      xabar: "Server xatosi: 422",
    });
    assert.deepEqual(await xatosi(javob(503)), {
      kod: "SERVER",
      holat: 503,
      xabar: "Server xatosi: 503",
    });
    assert.deepEqual(await xatosi(javob(429)), {
      kod: "HTTP",
      holat: 429,
      xabar: "Server xatosi: 429",
    });
  });

  test("JSON emas — JAVOB", async () => {
    assert.deepEqual(await xatosi(() => new Response("<html>")), {
      kod: "JAVOB",
      holat: 200,
      xabar: "Server JSON qaytarmadi.",
    });
  });

  test("tarmoq, vaqt, bekor", async () => {
    const tashla = (xato) => () => {
      throw xato;
    };
    assert.deepEqual(
      await xatosi(tashla(new TypeError("fetch failed"))),
      {
        kod: "TARMOQ",
        holat: 0,
        xabar: "Internet aloqasini tekshiring.",
      },
    );
    assert.deepEqual(
      await xatosi(tashla(new DOMException("t", "TimeoutError"))),
      { kod: "VAQT", holat: 0, xabar: "Server javob bermadi." },
    );
    assert.deepEqual(
      await xatosi(tashla(new DOMException("a", "AbortError"))),
      { kod: "BEKOR", holat: 0, xabar: "So'rov bekor qilindi." },
    );
  });
});
