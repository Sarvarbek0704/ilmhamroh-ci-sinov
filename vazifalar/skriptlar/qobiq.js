// skriptlar/qobiq.js — Service Worker qobig'i build vaqtida (16/#31,
// Vite plagini). Vite fayl nomlariga hash qo'shadi (index-Dvsf2Sj6.js)
// — ro'yxatni qo'lda yozib bo'lmaydi. Build tugagach dist/ dagi hamma
// faylni dist/sw.js ning QOBIQ ro'yxatiga, ularning tarkibidan
// olingan hash'ni VERSIYA ga yozamiz
import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

/**
 * Qobiq: sahifa ("./") va dist/ dagi hamma fayl — sw.js o'zidan
 * (brauzer uni o'zi yangilaydi) va source map'lardan (.map — faqat
 * DevTools uchun, oflayn kerak emas) va 404.html dan (19/#02: index.html
 * nusxasi — faqat GitHub Pages serveri uchun; SW sahifani index.html
 * dan beradi) tashqari, tartiblangan
 * @param {string[]} fayllar dist/ ga nisbatan yo'llar ("/" bilan)
 * @returns {string[]}
 */
export function qobiqRoyxati(fayllar) {
  const qolgani = fayllar
    .filter(
      (yol) =>
        yol !== "sw.js" && yol !== "404.html" && !yol.endsWith(".map"),
    )
    .toSorted();
  return ["./", ...qolgani];
}

/**
 * sw.js matnidagi VERSIYA va QOBIQ qiymatini almashtiradi
 * @param {string} matn sw.js manbasi
 * @param {string[]} royxat
 * @param {string} versiya
 * @returns {string}
 */
export function swgaYoz(matn, royxat, versiya) {
  const versiyaQatori = /const VERSIYA = "[^"]*";/;
  const qobiqQatori = /const QOBIQ = \[[^\]]*\];/;
  if (!versiyaQatori.test(matn) || !qobiqQatori.test(matn)) {
    throw new Error("sw.js da VERSIYA yoki QOBIQ topilmadi");
  }
  return matn
    .replace(versiyaQatori, `const VERSIYA = "${versiya}";`)
    .replace(
      qobiqQatori,
      `const QOBIQ = ${JSON.stringify(royxat, null, 2)};`,
    );
}

/**
 * Build papkasidagi sw.js ni to'ldiradi
 * @param {string} papka build papkasi (dist)
 * @returns {{ soni: number, versiya: string }}
 */
export function qobiqniYoz(papka) {
  const yol = (/** @type {string} */ fayl) => resolve(papka, fayl);
  // Windows'da ajratgich "\\" — URL va brauzer uchun "/"
  const fayllar = readdirSync(papka, {
    recursive: true,
    encoding: "utf8",
  })
    .map((fayl) => fayl.replaceAll("\\", "/"))
    .filter((fayl) => statSync(yol(fayl)).isFile());
  const royxat = qobiqRoyxati(fayllar);
  // Tarkib o'zgarsa — VERSIYA ham (yangi kesh): index.html, manifest
  // va ikonlar nomida hash yo'q, ular ham hisobga kiradi
  const hash = createHash("sha256");
  for (const fayl of royxat.slice(1)) {
    hash.update(fayl).update(readFileSync(yol(fayl)));
  }
  const versiya = `v11-${hash.digest("hex").slice(0, 8)}`;
  const sw = yol("sw.js");
  writeFileSync(sw, swgaYoz(readFileSync(sw, "utf8"), royxat, versiya));
  return { soni: royxat.length, versiya };
}

/**
 * Vite plagini: build oxirida (closeBundle — hamma fayl, public/ dan
 * ko'chirilgan sw.js ham, diskka yozilgan) qobiqni yozadi. npm
 * skriptiga (postbuild) bog'liq emas: "npx vite build" ham to'liq
 * @returns {import("vite").Plugin}
 */
export function qobiqPlagini() {
  /** @type {import("vite").ResolvedConfig} */
  let sozlama;
  return {
    name: "vazifalar-qobiq",
    apply: "build", // npm run dev da ishlamaydi
    configResolved(tayyor) {
      sozlama = tayyor;
    },
    closeBundle() {
      const papka = resolve(sozlama.root, sozlama.build.outDir);
      const { soni, versiya } = qobiqniYoz(papka);
      sozlama.logger.info(
        `sw.js: QOBIQ — ${soni} ta, VERSIYA — ${versiya}`,
      );
    },
  };
}
