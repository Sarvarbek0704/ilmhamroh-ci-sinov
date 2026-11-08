import { afterAll, beforeAll, test } from "vitest";
import assert from "node:assert/strict";
import { ishgaTushir as ishga } from "../src/ishga-tushir.ts";
import { yop } from "../src/yopish.ts";
import { XotiraOmbori } from "../src/vazifalar/xotira-ombor.ts";
import { xotiraLogi } from "./yordamchi.ts";

const { log, qatorlar } = xotiraLogi();
let asos = "";
let toxta: () => Promise<boolean>;
beforeAll(async () => {
  const { server, manzil } = await ishga({ port: 0, bogliqliklar: { ombor: new XotiraOmbori(), log } });
  asos = manzil;
  toxta = () => yop(server, 1000);
});
afterAll(() => toxta());

test("correlation ID: xizmat ichidagi log (req'siz) so'rov sorovId'sini oladi — POST tanasi bilan ham (AsyncLocalStorage)", async () => {
  await fetch(`${asos}/v1/vazifalar`, { method: "POST", headers: { "Content-Type": "application/json", "X-Request-Id": "kor-0001-abc" }, body: '{"matn":"Non"}' });
  const xizmat = qatorlar.find((q) => q.msg === "vazifa yaratildi");
  assert.ok(xizmat);
  assert.equal(xizmat.sorovId, "kor-0001-abc");
  assert.equal(xizmat.vazifaId, 1);
  const sorov = qatorlar.find((q) => q.msg === "POST /v1/vazifalar 201");
  assert.ok(sorov);
  assert.equal(sorov.sorovId, "kor-0001-abc");
  assert.equal(sorov.daraja, "info");
  assert.equal(typeof sorov.ms, "number");
  assert.match(String(sorov.time), /^\d{4}-\d{2}-\d{2}T.*Z$/);
});

test("parallel so'rovlar loglari aralashmaydi", async () => {
  await Promise.all(["par-aaaa-1", "par-bbbb-2", "par-cccc-3"].map((id, i) =>
    fetch(`${asos}/v1/vazifalar`, { method: "POST", headers: { "Content-Type": "application/json", "X-Request-Id": id }, body: JSON.stringify({ matn: `p${String(i)}` }) })));
  const yaratilgan = qatorlar.filter((q) => q.msg === "vazifa yaratildi" && String(q.sorovId).startsWith("par-"));
  assert.equal(yaratilgan.length, 3);
  assert.equal(new Set(yaratilgan.map((q) => q.sorovId)).size, 3);
});

test("4xx — warn; Authorization va cookie logga tushmaydi (redact)", async () => {
  await fetch(`${asos}/v1/vazifalar/999`, { headers: { Authorization: "Bearer SOXTA-TOKEN", "X-Request-Id": "red-0001-abc" } });
  const q = qatorlar.find((x) => x.sorovId === "red-0001-abc" && x.msg === "GET /v1/vazifalar/999 404");
  assert.ok(q);
  assert.equal(q.daraja, "warn");
  assert.doesNotMatch(JSON.stringify(qatorlar), /SOXTA-TOKEN/);
});

test("fon ishi (eksport) logi ham boshlagan so'rov sorovId'si bilan", async () => {
  const r = await fetch(`${asos}/v1/eksportlar`, { method: "POST", headers: { "X-Request-Id": "eks-0001-abc" } });
  const joy = String(r.headers.get("location"));
  for (let i = 0; i < 50 && !qatorlar.some((q) => q.msg === "eksport tayyor"); i++) await new Promise((ok) => setTimeout(ok, 10));
  const q = qatorlar.find((x) => x.msg === "eksport tayyor");
  assert.ok(q);
  assert.equal(q.sorovId, "eks-0001-abc");
  assert.equal(q.eksportId, joy.split("/").at(-1));
});

// 33 #22 (regressiya): nginx ortida (TRUST_PROXY=1) so'rov logidagi ip — haqiqiy mijoz (X-Forwarded-For'ning o'ng chekkasi), proxy'ning 127.0.0.1 i EMAS.
// Avval serializer soket manzilini (remoteAddress) yozardi — hamma qator 127.0.0.1 (33 natijalar/tajriba/t22b-xff.txt)
test("trust proxy: so'rov logidagi ip — X-Forwarded-For dan (Express req.ip), soxta chap qiymat emas", async () => {
  const p = xotiraLogi();
  const { server, manzil } = await ishga({ port: 0, bogliqliklar: { ombor: new XotiraOmbori(), log: p.log, trustProxy: 1 } });
  try {
    await fetch(`${manzil}/v1/vazifalar/999`, { headers: { "X-Forwarded-For": "6.6.6.6, 203.0.113.7", "X-Request-Id": "xff-0001-abc" } });
    const q = p.qatorlar.find((x) => x.sorovId === "xff-0001-abc" && typeof x.req === "object");
    assert.ok(q);
    assert.equal((q.req as { ip?: string }).ip, "203.0.113.7");
  } finally {
    await yop(server, 1000);
  }
});

// 34 #17: log ↔ trace — faol span bo'lsa traceId/spanId, bo'lmasa (OTel SDK yo'q) — hech narsa
test("traceMaydonlari: yaroqli span konteksti → traceId/spanId; yaroqsiz yoki yo'q → {}", async () => {
  const { trace } = await import("@opentelemetry/api");
  const { traceMaydonlari } = await import("../src/umumiy/log.ts");
  const sc = { traceId: "95a24ea362b49707c9ac107d6f7dd388", spanId: "4bf92f3577b34da6", traceFlags: 1 };
  assert.deepEqual(traceMaydonlari(trace.wrapSpanContext(sc)), { traceId: sc.traceId, spanId: sc.spanId });
  assert.deepEqual(traceMaydonlari(trace.wrapSpanContext({ ...sc, traceId: "0".repeat(32) })), {});
  assert.deepEqual(traceMaydonlari(undefined), {});
  assert.deepEqual(traceMaydonlari(), {});   // SDK'siz — faol span yo'q
});
