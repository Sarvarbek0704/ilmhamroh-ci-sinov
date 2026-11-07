// tekshiruv/api.tarmoq.js — api.js haqiqiy mashq API bilan (internet kerak)
// npm test buni ishga tushirmaydi (alohida "tarmoq" loyihasi): npm run test:tarmoq
import { test } from "vitest";
import assert from "node:assert/strict";
import { apiKlient } from "../src/api.ts";

const asosiyUrl = "https://ilmhamroh.uz/api/mashq";

test("yangi kalit: GET → PUT → POST → PATCH → DELETE", async () => {
  const api = apiKlient({ asosiyUrl, kalit: crypto.randomUUID() });

  const bosh = await api.royxat();
  assert.deepEqual(bosh, { vazifalar: [], versiya: 0 });

  const kochdi = await api.almashtir([
    { id: 1, matn: "Non olish", bajarildi: false },
    { id: 3, matn: "Choy damlash", bajarildi: true },
  ]);
  assert.deepEqual(
    kochdi.vazifalar.map((v) => v.id),
    [1, 3],
  );
  assert.equal(kochdi.versiya, 1);

  const yangi = await api.qosh("Sabzi olish");
  assert.equal(yangi.id, 4);
  assert.equal(yangi.matn, "Sabzi olish");

  const belgi = await api.yangila(1, { bajarildi: true });
  assert.equal(belgi.bajarildi, true);
  // 22/#02: DELETE 204 — ochir() undefined qaytaradi (api.test.js ham
  // shuni kutadi). Bu test npm test da yo'q edi va eskirib qolgan
  // (v11 da ham yiqilardi: null kutardi) — hech kim ishga tushirmagan
  assert.equal(await api.ochir(3), undefined);

  const oxiri = await api.royxat();
  assert.deepEqual(
    oxiri.vazifalar.map((v) => v.matn),
    ["Non olish", "Sabzi olish"],
  );
  assert.equal(oxiri.versiya, 4);
});

test("xatolar: ataylab 500, yo'q id, vaqt, bekor", async () => {
  const api = apiKlient({ asosiyUrl, kalit: crypto.randomUUID() });
  const sinov = apiKlient({
    asosiyUrl,
    kalit: crypto.randomUUID(),
    muvaffaqiyatsiz: true,
  });
  await assert.rejects(sinov.qosh("Non olish"), {
    name: "ApiXatosi",
    kod: "SERVER",
    holat: 500,
    message: "Sinov uchun ataylab xato",
  });
  await assert.rejects(api.ochir(999), {
    kod: "TOPILMADI",
    holat: 404,
    message: "Vazifa topilmadi",
  });
  await assert.rejects(api.royxat({ kutish: 1 }), { kod: "VAQT" });
  await assert.rejects(api.royxat({ signal: AbortSignal.abort() }), {
    kod: "BEKOR",
  });
});
