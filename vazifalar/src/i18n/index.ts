// i18n/index.ts — ko'p tilli interfeys (21/#02): i18next + react-i18next.
// Matnlar komponentda emas — tarjima fayllarida (src/i18n/<til>/<ns>.json),
// komponent faqat KALITni aytadi: t("bolimlar.royxat"). Namespace — fayl:
// "umumiy" (qobiq, ro'yxat, statistika) va "sozlamalar".
// O'zbekcha (asosiy til) — build'ga qo'shilgan (birinchi chizish tarjimasiz
// kutmaydi), qolgan tillar — kerak bo'lganda alohida chunk (kechYuklash).
// 21/#03: til — manzildan (yol.ts), kirill fayllari — skriptlar/kirill.js,
// kalitlar turi — turlar.d.ts (noto'g'ri kalit — tsc xatosi)
import i18next from "i18next";
import type { BackendModule, ReadCallback } from "i18next";
import { initReactI18next } from "react-i18next";
import umumiy from "./uz/umumiy.json";
import sozlamalar from "./uz/sozlamalar.json";
import { ASOSIY_TIL, TILLAR, tildaYol, yoldanTil } from "./yol.ts";
import { sanaYoz } from "./sana.ts";
import type { Til } from "./yol.ts";

export { TILLAR, tilmi } from "./yol.ts";
export type { Til } from "./yol.ts";

// Til nomi — o'sha tilning o'zida (autonym): tanlovda foydalanuvchi o'z
// tilini taniydi. lang atributi bilan chiziladi (ekran o'quvchi talaffuzi)
export const TIL_NOMLARI: Readonly<Record<Til, string>> = Object.freeze(
  {
    uz: "O'zbekcha",
    "uz-Cyrl": "Ўзбекча",
    ru: "Русский",
    en: "English",
  },
);

/** Joriy manzildagi til va router basename'i (main.tsx shuni oladi) */
export const tilYoli = yoldanTil(
  location.pathname,
  import.meta.env.BASE_URL,
);

// Kech yuklash "backend"i: i18next resurs kerak bo'lsa read() ni
// chaqiradi. import() — Vite har til/namespace faylini alohida chunk
// qiladi (http backend kerak emas: fayl o'z origin'imizdan, CSP o'zgarmaydi)
const kechYuklash: BackendModule = {
  type: "backend",
  init() {},
  read(til: string, ns: string, tayyor: ReadCallback) {
    import(`./${til}/${ns}.json`).then(
      (modul: { default: Record<string, unknown> }) =>
        tayyor(null, modul.default),
      (xato: unknown) => tayyor(xato as Error, false),
    );
  },
};

const i18n = i18next.createInstance();

void i18n
  .use(kechYuklash)
  .use(initReactI18next)
  .init({
    lng: tilYoli.til,
    fallbackLng: ASOSIY_TIL,
    supportedLngs: TILLAR,
    // "uz-Cyrl" uchun "uz" ni (lotin) ham yuklamasin — u build'da bor
    load: "currentOnly",
    ns: ["umumiy", "sozlamalar"],
    defaultNS: "umumiy",
    // O'zbekcha — shu yerda; boshqa til — kechYuklash orqali
    resources: { uz: { umumiy, sozlamalar } },
    partialBundledLanguages: true,
    // React o'zi ekranlaydi (XSS'dan) — ikkinchi marta kerak emas
    interpolation: { escapeValue: false },
    // Til fayli kelguncha komponent Suspense'ga tushmasin: main.tsx
    // birinchi chizishdan oldin tilni yuklab oladi (tilniTayyorla)
    react: { useSuspense: false },
  });

// O'z formatlovchimiz: tarjimada {{vaqt, sana}} (sana.ts — Chrome'da
// o'zbek lotin sanasi Intl'da yo'q). {{ulush, number(...)}} — i18next'ning
// o'zi (Intl.NumberFormat)
i18n.services.formatter?.add("sana", (qiymat: Date, til?: string) =>
  sanaYoz(qiymat, til ?? ASOSIY_TIL),
);

/**
 * Birinchi chizishdan oldin: asosiy tildan boshqa bo'lsa — fayllarini
 * yuklash (Promise). O'zbekcha — null: tarjima allaqachon build'da, ilova
 * avvalgidek SINXRON chiziladi (13/#30: blocking="render", CLS 0).
 * <html lang>: ekran o'quvchi talaffuzi, brauzer tarjimoni, imlo
 * tekshiruvi, CSS :lang() — hammasi shunga qaraydi ("uz-Cyrl" ham)
 */
export function tilniTayyorla(): Promise<unknown> | null {
  document.documentElement.lang = tilYoli.til;
  return tilYoli.til === ASOSIY_TIL
    ? null
    : i18n.loadNamespaces(["umumiy", "sozlamalar"]);
}

/**
 * Til tanlandi: xuddi shu sahifa boshqa til manzilida. Router basename'i
 * ("/ru") ilova yaratilganda qotadi — sahifa qayta yuklanadi (fayllar
 * keshda/SW'da, tarjima — bitta kichik chunk). Ro'yxat va sozlamalar
 * localStorage'da — hech narsa yo'qolmaydi
 */
export function tilniAlmashtir(til: Til): void {
  location.assign(
    tildaYol(
      location.pathname,
      location.search,
      til,
      import.meta.env.BASE_URL,
    ),
  );
}
