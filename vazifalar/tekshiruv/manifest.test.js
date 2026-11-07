// tekshiruv/manifest.test.js — o'rnatiladigan ilova: manifest va ikonlar
import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { pngYasa } from "../skriptlar/ikonlar.js";

// public/ — Vite uni dist/ ga o'zgarishsiz (nomi ham) ko'chiradi
const ildiz = new URL("../public/", import.meta.url);
const manifest = JSON.parse(
  readFileSync(new URL("manifest.webmanifest", ildiz), "utf8"),
);

// PNG o'lchami IHDR bo'lagida: 16-baytdan eni, 20-baytdan bo'yi
function pngOlchami(bayt) {
  return `${bayt.readUInt32BE(16)}x${bayt.readUInt32BE(20)}`;
}

describe("manifest.webmanifest", () => {
  test("o'rnatish uchun kerakli maydonlar", () => {
    assert.equal(manifest.name, "Vazifalar");
    assert.equal(manifest.start_url, "./");
    assert.equal(manifest.scope, "./");
    assert.equal(manifest.display, "standalone");
  });

  test("192 va 512 ikon bor, maskable ham", () => {
    const olchamlar = manifest.icons.map((ikon) => ikon.sizes);
    assert.ok(olchamlar.includes("192x192"));
    assert.ok(olchamlar.includes("512x512"));
    assert.ok(
      manifest.icons.some((ikon) => ikon.purpose === "maskable"),
    );
  });

  test("har ikon fayli PNG va o'lchami sizes bilan bir xil", () => {
    for (const ikon of manifest.icons) {
      const bayt = readFileSync(new URL(ikon.src, ildiz));
      assert.equal(bayt.subarray(1, 4).toString(), "PNG", ikon.src);
      assert.equal(pngOlchami(bayt), ikon.sizes, ikon.src);
    }
  });
});

describe("pngYasa", () => {
  test("2×2 rasm: sarlavha va piksellar to'g'ri", () => {
    const qizil = [255, 0, 0, 255];
    const png = pngYasa(2, () => qizil);
    assert.equal(pngOlchami(png), "2x2");
    // IDAT: 8 (imzo) + 25 (IHDR bo'lagi) dan keyin
    const uzunlik = png.readUInt32BE(33);
    const idat = png.subarray(41, 41 + uzunlik);
    assert.deepEqual(
      [...inflateSync(idat)],
      [0, ...qizil, ...qizil, 0, ...qizil, ...qizil],
    );
  });
});
