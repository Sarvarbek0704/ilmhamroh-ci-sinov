// tekshiruv/oqim.test.js — SSE matnini o'qish (src/xususiyatlar/yordamchi/oqim.ts, 21/#26)
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { sseHodisalari } from "../src/xususiyatlar/yordamchi/oqim.ts";

/** Satrlar → bayt bo'laklari oqimi (har satr — alohida bo'lak) */
const oqim = (bolaklar) =>
  new ReadableStream({
    start(k) {
      for (const b of bolaklar)
        k.enqueue(
          typeof b === "string" ? new TextEncoder().encode(b) : b,
        );
      k.close();
    },
  });
const yigil = async (o) => {
  const r = [];
  for await (const h of sseHodisalari(o)) r.push(h);
  return r;
};

describe("sseHodisalari", () => {
  test("data va event, CRLF, ko'p qatorli data", async () => {
    assert.deepEqual(
      await yigil(
        oqim([
          'data: {"matn":"Sa"}\r\n\r\ndata: a\ndata: b\n\nevent: tugadi\ndata: {}\n\n',
        ]),
      ),
      [
        { tur: "message", malumot: '{"matn":"Sa"}' },
        { tur: "message", malumot: "a\nb" },
        { tur: "tugadi", malumot: "{}" },
      ],
    );
  });
  test("hodisa bo'laklar orasida uzilgan", async () => {
    assert.deepEqual(
      await yigil(oqim(["da", "ta: sal", "om\n", "\n"])),
      [{ tur: "message", malumot: "salom" }],
    );
  });
  test("UTF-8 harf ikki bo'lakka bo'lingan (o'zbekcha/kirill)", async () => {
    const b = new TextEncoder().encode("data: Ўзбек\n\n");
    assert.deepEqual(await yigil(oqim([b.slice(0, 7), b.slice(7)])), [
      { tur: "message", malumot: "Ўзбек" },
    ]);
  });
  test("izoh qatori (:) va oxirida yopilmagan hodisa — tashlanadi", async () => {
    assert.deepEqual(await yigil(oqim([": ping\n\ndata: x"])), []);
  });
});
