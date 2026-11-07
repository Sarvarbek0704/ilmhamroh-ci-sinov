// tekshiruv/sw.test.js — Service Worker: qobiq ro'yxati va hayot sikli
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { ILOVA, soxtaCaches, sorov, swniYukla } from "./sw-muhit.js";

describe("sw.js qobig'i", () => {
  test("manbada — faqat sahifa; qolganini build yozadi (qobiq.js)", () => {
    // Fayl nomlarida hash bor (Vite) — ro'yxatni qo'lda yuritmaymiz:
    // tekshiruv/qobiq.test.js
    const sw = swniYukla();
    assert.deepEqual([...sw.qiymat("QOBIQ")], ["./", "index.html"]);
    assert.equal(sw.qiymat("VERSIYA"), "manba");
  });
});

describe("sw.js hayot sikli", () => {
  // 21/#28: skipWaiting endi o'rnatishda EMAS — "yangila" xabarida
  test("install: qobiq versiyali keshga olinadi, kutadi (skipWaiting yo'q)", async () => {
    const sw = swniYukla();
    await sw.yubor("install");
    const nom = `vazifalar-qobiq-${sw.qiymat("VERSIYA")}`;
    assert.deepEqual(
      [...sw.caches.keshlar.get(nom).keys()],
      // Kesh kalitlari — sw.js manziliga nisbatan to'liq URL
      // [...] — vm konteksti boshqa "realm", massiv o'zimiznikiga ko'chadi
      [...sw.qiymat("QOBIQ")].map((yol) => new URL(yol, ILOVA).href),
    );
    assert.equal(sw.self.kutmadi, undefined);
  });

  test('message "yangila" — skipWaiting (foydalanuvchi bosgandagina)', async () => {
    const sw = swniYukla();
    sw.tinglovchilar.message({ data: "boshqa" });
    assert.equal(sw.self.kutmadi, undefined);
    sw.tinglovchilar.message({ data: "yangila" });
    assert.equal(sw.self.kutmadi, true);
  });

  test("activate: faqat o'zimizning eski keshlar o'chadi, claim", async () => {
    const caches = soxtaCaches(["vazifalar-qobiq-v0", "portfolio-v3"]);
    const sw = swniYukla({ caches });
    await sw.yubor("install");
    await sw.yubor("activate");
    assert.deepEqual(await caches.keys(), [
      "portfolio-v3",
      `vazifalar-qobiq-${sw.qiymat("VERSIYA")}`,
    ]);
    assert.equal(sw.self.egallandi, true);
  });
});

describe("sw.js so'rovlar (fetch)", () => {
  const tarmoq = async (s) => new Response(`tarmoq: ${s.url}`);
  const tarmoqYoq = async () => {
    throw new TypeError("Failed to fetch");
  };

  test("API (boshqa origin) va POST — SW aralashmaydi", async () => {
    const sw = swniYukla({ fetch: tarmoq });
    const api = sorov("https://ilmhamroh.uz/api/mashq/vazifalar/k");
    assert.equal(
      (await sw.yubor("fetch", { request: api })).javobBormi,
      false,
    );
    const post = sorov("index.html", { method: "POST" });
    assert.equal(
      (await sw.yubor("fetch", { request: post })).javobBormi,
      false,
    );
  });

  test("ilovadan boshqa navigatsiya (README.md) — aralashmaydi", async () => {
    const sw = swniYukla({ fetch: tarmoq });
    const readme = sorov("README.md", { mode: "navigate" });
    assert.equal(
      (await sw.yubor("fetch", { request: readme })).javobBormi,
      false,
    );
  });

  test("tarmoq bor: javob tarmoqdan, kesh yangilanadi", async () => {
    const sw = swniYukla({ fetch: tarmoq });
    await sw.yubor("install");
    const css = sorov("assets/index-B3x9.css");
    const { natija } = await sw.yubor("fetch", { request: css });
    assert.equal(await natija.text(), `tarmoq: ${css.url}`);
    const kesh = await sw.caches.open(
      `vazifalar-qobiq-${sw.qiymat("VERSIYA")}`,
    );
    assert.equal(
      await (await kesh.match(css)).text(),
      `tarmoq: ${css.url}`,
    );
  });

  test("tarmoq yo'q: ?filtr=faol sahifasi — keshdagi index.html", async () => {
    const sw = swniYukla({ fetch: tarmoqYoq });
    await sw.yubor("install");
    const sahifa = sorov("?filtr=faol", { mode: "navigate" });
    const { natija } = await sw.yubor("fetch", { request: sahifa });
    assert.equal(await natija.text(), "kesh: index.html");
  });

  // 19/#02: sahifalar (React Router) — chuqur havola ham shu index.html
  test("tarmoq yo'q: chuqur havola (vazifa/2) — keshdagi index.html", async () => {
    const sw = swniYukla({ fetch: tarmoqYoq });
    await sw.yubor("install");
    const sahifa = sorov("vazifa/2", { mode: "navigate" });
    const { natija } = await sw.yubor("fetch", { request: sahifa });
    assert.equal(await natija.text(), "kesh: index.html");
  });

  // 21/#28: deploydan keyin eski sahifa — fayl serverda yo'q
  test("fayl 404 — keshdagi eski versiyasi; keshda yo'q — 404 o'zi", async () => {
    const yoq = async () => new Response("topilmadi", { status: 404 });
    const sw = swniYukla({ fetch: yoq, caches: soxtaCaches() });
    await sw.yubor("install");
    const eski = await sw.caches.open("vazifalar-qobiq-eski");
    await eski.put(
      sorov("assets/Tartiblash-AAA.js"),
      new Response("eski chunk"),
    );
    const bor = await sw.yubor("fetch", {
      request: sorov("assets/Tartiblash-AAA.js", {
        destination: "script",
      }),
    });
    assert.equal(await bor.natija.text(), "eski chunk");
    const yoqFayl = await sw.yubor("fetch", {
      request: sorov("assets/yoq.js", { destination: "script" }),
    });
    assert.equal(yoqFayl.natija.status, 404);
  });

  test("skript o'rniga HTML (SPA zaxirasi, 200) — keshdagi skript", async () => {
    const html = async () =>
      new Response("<!doctype html>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    const sw = swniYukla({ fetch: html });
    await sw.yubor("install");
    const eski = await sw.caches.open("vazifalar-qobiq-eski");
    await eski.put(sorov("assets/a-1.js"), new Response("export {}"));
    const { natija } = await sw.yubor("fetch", {
      request: sorov("assets/a-1.js", { destination: "script" }),
    });
    assert.equal(await natija.text(), "export {}");
  });

  test("tarmoq yo'q, keshda ham yo'q — tarmoq xatosi o'zi", async () => {
    const sw = swniYukla({ fetch: tarmoqYoq });
    await sw.yubor("install");
    await assert.rejects(
      sw.yubor("fetch", { request: sorov("yoq.png") }),
      { name: "TypeError", message: "Failed to fetch" },
    );
  });
});
