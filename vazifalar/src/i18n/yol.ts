// i18n/yol.ts — til manzilda (21/#03): /statistika — o'zbekcha (lotin),
// /ru/statistika — ruscha, /uz-cyrl/... — kirill, /en/... — inglizcha.
// Sof funksiyalar (DOM'siz) — Vitest (node muhiti) bilan tekshiriladi.
// Nega manzilda (localStorage emas): havola ulashilsa o'sha tilda ochiladi,
// qidiruv tizimi har tilni alohida sahifa sifatida ko'radi (21/#32 hreflang),
// "orqaga" tilni ham qaytaradi. Asosiy til — prefikssiz (eski havolalar buzilmaydi)

export const TILLAR = ["uz", "uz-Cyrl", "ru", "en"] as const;
export type Til = (typeof TILLAR)[number];
export const ASOSIY_TIL: Til = "uz";

/** Til → manzil bo'lagi. BCP 47 kodi ("uz-Cyrl"), manzilda — kichik harf */
const PREFIKSLAR: Readonly<Record<Til, string>> = Object.freeze({
  uz: "",
  "uz-Cyrl": "uz-cyrl",
  ru: "ru",
  en: "en",
});

/** Satr bizning tillardan birimi (tashqi qiymat) */
export function tilmi(qiymat: unknown): qiymat is Til {
  return TILLAR.some((til) => til === qiymat);
}

export type TilYoli = {
  readonly til: Til;
  /** router basename'i: ilova papkasi + til ("/vazifalar/ru") */
  readonly asos: string;
  /** til prefiksidan keyingi yo'l ("/statistika") */
  readonly qolgani: string;
};

/**
 * Manzil yo'lidan til. ilova — Vite BASE_URL ("/" yoki "/vazifalar/").
 * Birinchi bo'lak til prefiksi bo'lmasa — asosiy til, yo'l o'zgarmaydi
 */
export function yoldanTil(yol: string, ilova = "/"): TilYoli {
  const papka = ilova.endsWith("/") ? ilova : `${ilova}/`;
  const ichki = yol.startsWith(papka) ? yol.slice(papka.length) : "";
  const [birinchi = "", ...qolgan] = ichki.split("/");
  const til = TILLAR.find(
    (t) => t !== ASOSIY_TIL && PREFIKSLAR[t] === birinchi.toLowerCase(),
  );
  const ildiz = papka.replace(/\/$/, "");
  if (til === undefined) {
    return {
      til: ASOSIY_TIL,
      asos: ildiz || "/",
      qolgani: `/${ichki}`,
    };
  }
  return {
    til,
    asos: `${ildiz}/${PREFIKSLAR[til]}`,
    qolgani: `/${qolgan.join("/")}`,
  };
}

/**
 * Xuddi shu sahifa boshqa tilda: yo'l + so'rov (?filtr=...) saqlanadi
 * ("/vazifalar/ru/statistika?x=1", "en" → "/vazifalar/en/statistika?x=1")
 */
export function tildaYol(
  yol: string,
  qidiruv: string,
  til: Til,
  ilova = "/",
): string {
  const { qolgani } = yoldanTil(yol, ilova);
  const papka = (ilova.endsWith("/") ? ilova : `${ilova}/`).replace(
    /\/$/,
    "",
  );
  const prefiks = PREFIKSLAR[til] === "" ? "" : `/${PREFIKSLAR[til]}`;
  const toliq = `${papka}${prefiks}${qolgani}`;
  return `${toliq === "" ? "/" : toliq}${qidiruv}`;
}
