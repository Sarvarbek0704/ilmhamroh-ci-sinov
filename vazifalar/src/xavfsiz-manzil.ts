// xavfsiz-manzil.ts — Trusted Types siyosati (13/#32; 18/#24 dan alohida
// modul). CSP: require-trusted-types-for 'script' — skript manzili qabul
// qiladigan joylar (script.src, serviceWorker.register, new Worker...)
// oddiy satrni rad etadi, faqat siyosatdan o'tganini oladi. CSP'da
// "trusted-types vazifalar" — siyosat FAQAT shu nom bilan va bir marta
// yaratiladi: shuning uchun bitta modulda. Trusted Types bo'lmagan
// brauzerda — satrning o'zi. Turlari — trusted-types.d.ts (lib.dom'da yo'q).
// Oq ro'yxat: "sw.js" (aniq) va O'Z build fayllarimiz — shu sayt (origin),
// ilova papkasidagi assets/ ichidagi .js (Vite chiqargan, masalan
// statistika ishchisi, 18/#24). 18/#32 dan — naqsh: bu modul umumiy
// qatlamda (shared) va xususiyatlarni (statistika) bilmasligi kerak.
// Begona sayt, blob:, data:, boshqa papka, so'rov qatori (?...) — rad
// 19/#02: ilova papkasidan (BASE_URL, masalan "/vazifalar/") —
// nisbiy "sw.js" /vazifalar/vazifa/2 sahifasida /vazifalar/vazifa/sw.js
// bo'lardi (boshqa scope, 404)
const ILOVA_PAPKASI = import.meta.env.BASE_URL;
export const SW_MANZILI = `${ILOVA_PAPKASI}sw.js`;

function ruxsatmi(url: string): boolean {
  if (url === SW_MANZILI) {
    return true;
  }
  // Ilova papkasi (Pages'da /vazifalar/, lokal — /): vite.config.ts
  // base. 19/#02 gacha sahifa manziliga nisbatan edi (document.baseURI)
  const assets = new URL(`${ILOVA_PAPKASI}assets/`, location.origin);
  const manzil = new URL(url, document.baseURI);
  // npm run dev: Vite ishchini manba manzilidan beradi
  // (/src/...ishchi.ts?worker_file&type=module) — faqat dev server'da
  if (import.meta.env.DEV && manzil.origin === location.origin) {
    return true;
  }
  return (
    manzil.origin === location.origin &&
    manzil.pathname.startsWith(assets.pathname) &&
    manzil.pathname.endsWith(".js") &&
    manzil.search === ""
  );
}

const siyosat = globalThis.trustedTypes?.createPolicy("vazifalar", {
  createScriptURL(url) {
    if (!ruxsatmi(url)) {
      throw new TypeError(`Ruxsat etilmagan skript manzili: ${url}`);
    }
    return url;
  },
});

/** Skript manzili — siyosatdan o'tgan (Trusted Types bo'lsa) */
export function skriptManzili(url: string): string | TrustedScriptURL {
  return siyosat?.createScriptURL(url) ?? url;
}
