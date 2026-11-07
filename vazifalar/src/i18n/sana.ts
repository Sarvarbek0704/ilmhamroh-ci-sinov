// i18n/sana.ts — sana va vaqt matni (21/#03). Intl.DateTimeFormat har
// tilda o'z qoidasi bilan yozadi, LEKIN Chrome'da o'zbek LOTIN ma'lumoti
// yo'q (o'lchandi, Chrome 155: "uz" → "2026 M10 17 19:04", "uz-Cyrl" esa
// to'g'ri — "17 октябр, 2026 19:04"). Node'da "uz" to'liq — farq faqat
// brauzerda ko'rinadi. Shuning uchun "uz" uchun CLDR'dagi shakl
// ("d-MMMM, y HH:mm") o'zimiz, qolgan tillar — Intl
const OYLAR = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

const ikki = (son: number) => String(son).padStart(2, "0");

/** "17-oktabr, 2026 19:04" (uz) yoki Intl'ning uzun sana + qisqa vaqti */
export function sanaYoz(sana: Date, til: string): string {
  if (til === "uz") {
    const oy = OYLAR[sana.getMonth()] ?? "";
    return `${sana.getDate()}-${oy}, ${sana.getFullYear()} ${ikki(sana.getHours())}:${ikki(sana.getMinutes())}`;
  }
  return new Intl.DateTimeFormat(til, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(sana);
}
