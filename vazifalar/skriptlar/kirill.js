// skriptlar/kirill.js — o'zbekcha lotin tarjima fayllaridan kirill
// nusxasini yasaydi (21/#03): npm run kirill. src/i18n/uz/*.json →
// src/i18n/uz-Cyrl/*.json. Qo'lda ikki marta yozilmaydi: lotinchada matn
// o'zgarsa — skript qayta ishga tushiriladi, test (kirill.test.js) esa
// fayllar eskirgan bo'lsa yiqiladi. Kalitlar va {{o'rinlar}} o'zgarmaydi.
// Transliteratsiya — 1995-yilgi lotin alifbosi qoidalari bo'yicha, bitta
// istisnosiz emas: ruscha o'zlashmalar (ts → ц, "е" so'z boshida) so'zma-so'z
// to'g'ri chiqmaydi — natija baribir ko'z bilan tekshiriladi (QADAMLAR #03)
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve } from "node:path";

const APOSTROFLAR = "'‘’ʻʼ`";
const UNLILAR = "aeiouAEIOU";

/** @type {Readonly<Record<string, string>>} */
const HARFLAR = Object.freeze({
  a: "а",
  b: "б",
  c: "ц",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "ҳ",
  i: "и",
  j: "ж",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  q: "қ",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  x: "х",
  y: "й",
  z: "з",
});

/** @type {ReadonlyArray<[string, string]>} ikki harfli birikmalar */
const BIRIKMALAR = [
  ["sh", "ш"],
  ["ch", "ч"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
];

/**
 * Harf katta bo'lsa — kirill harfini ham katta qiladi
 * @param {string} asl
 * @param {string} kirill
 */
const holatida = (asl, kirill) =>
  asl === asl.toUpperCase() && asl !== asl.toLowerCase()
    ? kirill.toUpperCase()
    : kirill;

/**
 * Bitta satr: lotin → kirill. {{...}} ichi tegilmaydi
 * @param {string} matn
 * @returns {string}
 */
export function kirillga(matn) {
  return matn
    .split(/(\{\{[^}]*\}\})/)
    .map((bolak, i) => (i % 2 === 1 ? bolak : bolakniOgir(bolak)))
    .join("");
}

/** @param {string} s */
function bolakniOgir(s) {
  let natija = "";
  for (let i = 0; i < s.length; i++) {
    const h = s[i] ?? "";
    const kichik = h.toLowerCase();
    const keyingi = s[i + 1] ?? "";
    const oldingi = s[i - 1] ?? "";
    // o' va g' — alohida harflar (ў, ғ)
    if (
      (kichik === "o" || kichik === "g") &&
      APOSTROFLAR.includes(keyingi)
    ) {
      natija += holatida(h, kichik === "o" ? "ў" : "ғ");
      i++;
      continue;
    }
    // yo' — "yo" emas: y + o' (yo'q → йўқ)
    const ikki = kichik + keyingi.toLowerCase();
    const birikma = BIRIKMALAR.find(([lotin]) => lotin === ikki);
    if (
      birikma !== undefined &&
      !(ikki === "yo" && APOSTROFLAR.includes(s[i + 2] ?? ""))
    ) {
      natija += holatida(h, birikma[1]);
      i++;
      continue;
    }
    // e — so'z boshida va unlidan keyin "э", qolgan joyda "е"
    if (kichik === "e") {
      const boshida = oldingi === "" || !/\p{L}/u.test(oldingi);
      natija += holatida(
        h,
        boshida || UNLILAR.includes(oldingi) ? "э" : "е",
      );
      continue;
    }
    // tutuq belgisi (ma'lumot) — ъ
    if (
      APOSTROFLAR.includes(h) &&
      /\p{L}/u.test(oldingi) &&
      /\p{L}/u.test(keyingi)
    ) {
      natija += "ъ";
      continue;
    }
    const harf = HARFLAR[/** @type {keyof typeof HARFLAR} */ (kichik)];
    natija += harf === undefined ? h : holatida(h, harf);
  }
  return natija;
}

/**
 * JSON qiymatlarini (ichma-ich obyekt ham) o'giradi, kalitlar o'zgarmaydi
 * @param {unknown} qiymat
 * @returns {unknown}
 */
export function obyektniOgir(qiymat) {
  if (typeof qiymat === "string") return kirillga(qiymat);
  if (qiymat !== null && typeof qiymat === "object") {
    return Object.fromEntries(
      Object.entries(qiymat).map(([k, v]) => [k, obyektniOgir(v)]),
    );
  }
  return qiymat;
}

/**
 * src/i18n/uz/*.json → src/i18n/uz-Cyrl/*.json (matni qaytadi — test
 * fayl eskirganini shu bilan tekshiradi)
 * @param {string} ildiz loyiha papkasi
 * @returns {Map<string, string>} fayl nomi → yangi matn
 */
export function kirillFayllari(ildiz) {
  const manba = resolve(ildiz, "src/i18n/uz");
  /** @type {Map<string, string>} */
  const natija = new Map();
  for (const fayl of readdirSync(manba).filter((f) =>
    f.endsWith(".json"),
  )) {
    const json = JSON.parse(readFileSync(resolve(manba, fayl), "utf8"));
    natija.set(
      fayl,
      `${JSON.stringify(obyektniOgir(json), null, 2)}\n`,
    );
  }
  return natija;
}

if (import.meta.main) {
  const ildiz = resolve(import.meta.dirname, "..");
  const papka = resolve(ildiz, "src/i18n/uz-Cyrl");
  mkdirSync(papka, { recursive: true });
  for (const [fayl, matn] of kirillFayllari(ildiz)) {
    writeFileSync(resolve(papka, fayl), matn);
    console.log(`uz-Cyrl/${fayl}`);
  }
}
