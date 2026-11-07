// skriptlar/ikonlar.js — ilova ikonlarini (PNG) yasaydi: npm run ikonlar
// Tashqi paketsiz: piksellarni o'zimiz chizamiz, PNG'ni node:zlib bilan
// siqamiz. Natija har safar bayt-bayt bir xil.
import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";

// Turlar JSDoc'da (16/#42: tsconfig.node.json skriptlarni ham tekshiradi)
/** @typedef {[number, number]} Nuqta */
/** @typedef {(x: number, y: number) => number[]} Piksel RGBA, 0–255 */

const YASHIL = [0x1f, 0x6f, 0x4a];
const OQ = [0xff, 0xff, 0xff];

/**
 * PNG: imzo + IHDR (o'lcham) + IDAT (siqilgan piksellar) + IEND
 * @param {string} tur
 * @param {Buffer} malumot
 */
function bolak(tur, malumot) {
  const uzunlik = Buffer.alloc(4);
  uzunlik.writeUInt32BE(malumot.length);
  const turVaMalumot = Buffer.concat([
    Buffer.from(tur, "ascii"),
    malumot,
  ]);
  const nazorat = Buffer.alloc(4);
  nazorat.writeUInt32BE(crc32(turVaMalumot));
  return Buffer.concat([uzunlik, turVaMalumot, nazorat]);
}

/**
 * @param {number} olcham eni va bo'yi (kvadrat)
 * @param {Piksel} piksel
 */
export function pngYasa(olcham, piksel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(olcham, 0);
  ihdr.writeUInt32BE(olcham, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8 bit, RGBA
  const qatorlar = Buffer.alloc(olcham * (olcham * 4 + 1));
  for (let y = 0; y < olcham; y++) {
    const boshi = y * (olcham * 4 + 1); // har qator boshida filtr: 0
    for (let x = 0; x < olcham; x++) {
      qatorlar.set(piksel(x + 0.5, y + 0.5), boshi + 1 + x * 4);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bolak("IHDR", ihdr),
    bolak("IDAT", deflateSync(qatorlar, { level: 9 })),
    bolak("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Nuqtadan kesmagacha masofa — belgi chizig'i shu bilan chiziladi
 * @param {number} px
 * @param {number} py
 * @param {Nuqta} a kesma boshi
 * @param {Nuqta} b kesma oxiri
 */
function kesmagacha(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy),
    ),
  );
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Chegarada 1 piksel yumshoq o'tish (anti-aliasing)
const qoplam = (/** @type {number} */ masofa) =>
  Math.max(0, Math.min(1, 0.5 - masofa));

/**
 * @param {number[]} ost
 * @param {number[]} ost2
 * @param {number} ulush 0 — ost, 1 — ost2
 */
function aralashtir(ost, ost2, ulush) {
  return ost.map((r, i) => Math.round(r + (ost2[i] - r) * ulush));
}

// To'liq kvadrat (maskable) yoki yumaloq burchakli kvadrat (any) ichida
// oq "✓" belgisi. Maskable: tizim ikonni doira yoki boshqa shaklda
// qirqadi — belgi markazdagi xavfsiz hududda (80%) qolishi kerak
/**
 * @param {number} olcham
 * @param {boolean} maskable
 * @returns {Piksel}
 */
function ikonChiz(olcham, maskable) {
  const o = olcham;
  const belgiMasshtabi = maskable ? 0.62 : 0.8;
  const m = (/** @type {number} */ k) =>
    o / 2 + (k - 0.5) * o * belgiMasshtabi;
  /** @type {Nuqta[]} */
  const nuqtalar = [
    [m(0.24), m(0.52)],
    [m(0.42), m(0.7)],
    [m(0.76), m(0.32)],
  ];
  const qalinlik = o * 0.1 * belgiMasshtabi;
  const radius = maskable ? 0 : o * 0.22;
  return (x, y) => {
    // Yumaloq burchakli kvadratgacha ishorali masofa
    // (ichkarida manfiy, tashqarida musbat)
    const qx = Math.abs(x - o / 2) - (o / 2 - radius);
    const qy = Math.abs(y - o / 2) - (o / 2 - radius);
    const masofa =
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
      Math.min(Math.max(qx, qy), 0) -
      radius;
    const fon = qoplam(masofa);
    const chiziq = Math.min(
      kesmagacha(x, y, nuqtalar[0], nuqtalar[1]),
      kesmagacha(x, y, nuqtalar[1], nuqtalar[2]),
    );
    const belgi = qoplam(chiziq - qalinlik / 2);
    return [...aralashtir(YASHIL, OQ, belgi), Math.round(fon * 255)];
  };
}

/** @type {[nomi: string, olcham: number, maskable: boolean][]} */
const IKONLAR = [
  ["ikon-192.png", 192, false],
  ["ikon-512.png", 512, false],
  ["ikon-maskable-512.png", 512, true],
  ["ikon-180.png", 180, true], // apple-touch-icon: iOS o'zi yumaloqlaydi
];

if (import.meta.main) {
  const papka = new URL("../public/assets/ikonlar/", import.meta.url);
  for (const [nomi, olcham, maskable] of IKONLAR) {
    const png = pngYasa(olcham, ikonChiz(olcham, maskable));
    writeFileSync(new URL(nomi, papka), png);
    console.log(`${nomi}: ${olcham}×${olcham}, ${png.length} bayt`);
  }
}
