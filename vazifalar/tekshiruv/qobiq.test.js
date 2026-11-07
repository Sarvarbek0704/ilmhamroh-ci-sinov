// tekshiruv/qobiq.test.js — build'dagi qobiq ro'yxati (skriptlar/qobiq.js)
import { describe, onTestFinished, test } from "vitest";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  qobiqniYoz,
  qobiqRoyxati,
  swgaYoz,
} from "../skriptlar/qobiq.js";

const SW = readFileSync(
  new URL("../public/sw.js", import.meta.url),
  "utf8",
);

describe("qobiqRoyxati", () => {
  test("sahifa birinchi, sw.js, 404.html va .map yo'q, qolgani tartiblangan", () => {
    const fayllar = [
      "sw.js",
      "404.html",
      "assets/index-B3x9.js.map",
      "manifest.webmanifest",
      "index.html",
      "assets/index-B3x9.js",
      "assets/ikonlar/ikon.svg",
    ];
    assert.deepEqual(qobiqRoyxati(fayllar), [
      "./",
      "assets/ikonlar/ikon.svg",
      "assets/index-B3x9.js",
      "index.html",
      "manifest.webmanifest",
    ]);
  });
});

describe("swgaYoz", () => {
  test("VERSIYA va QOBIQ almashadi, qolgan kod o'zgarmaydi", () => {
    const royxat = ["./", "assets/index-B3x9.js", "index.html"];
    const yangi = swgaYoz(SW, royxat, "v10-1a2b3c4d");
    assert.match(yangi, /const VERSIYA = "v10-1a2b3c4d";/);
    assert.ok(yangi.includes(JSON.stringify(royxat, null, 2)));
    const qoldiq = (matn) =>
      matn.replace(/const (VERSIYA|QOBIQ) = [^;]*;/g, "");
    assert.equal(qoldiq(yangi), qoldiq(SW));
  });

  test("VERSIYA yoki QOBIQ topilmasa — xato (jim o'tmaydi)", () => {
    assert.throws(() => swgaYoz("const QOBIQ = [];", [], "v"), {
      message: "sw.js da VERSIYA yoki QOBIQ topilmadi",
    });
  });
});

describe("qobiqniYoz (plagin build oxirida chaqiradi)", () => {
  test("papkadagi fayllar QOBIQ ga, VERSIYA tarkibga bog'liq", () => {
    const papka = mkdtempSync(join(tmpdir(), "qobiq-"));
    onTestFinished(() =>
      rmSync(papka, { recursive: true, force: true }),
    );
    mkdirSync(join(papka, "assets"));
    writeFileSync(join(papka, "sw.js"), SW);
    writeFileSync(join(papka, "index.html"), "<!DOCTYPE html>");
    writeFileSync(join(papka, "assets/index-B3x9.js"), "1");
    const birinchi = qobiqniYoz(papka);
    const sw = readFileSync(join(papka, "sw.js"), "utf8");
    assert.equal(birinchi.soni, 3);
    assert.ok(sw.includes(`const VERSIYA = "${birinchi.versiya}";`));
    assert.ok(sw.includes('"assets/index-B3x9.js"'));
    // Bitta fayl o'zgarsa — yangi VERSIYA (brauzer yangi kesh ochadi)
    writeFileSync(join(papka, "sw.js"), SW);
    writeFileSync(join(papka, "index.html"), "<!DOCTYPE html>!");
    assert.notEqual(qobiqniYoz(papka).versiya, birinchi.versiya);
  });
});
