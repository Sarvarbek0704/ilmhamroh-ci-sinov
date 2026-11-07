// saqlash.ts — brauzer xotirasi: vazifalar keshi va server kaliti
import { eksportMatni, paketniTekshir } from "./paket.ts";
import type { Foydalanuvchi, VazifaMalumoti } from "./turlar.ts";

export const SAQLASH_KALITI = "vazifalar:v3";
const SERVER_KALITI_NOMI = "vazifalar:kalit";
const QORALAMA_KALITI = "vazifalar:qoralama";
// tema.ts (<head> dagi oddiy skript) ham shu nomni o'qiydi
const TEMA_KALITI = "vazifalar:tema";
// 18/#42: soxta kirish — faqat ism (parol, token YO'Q)
const FOYDALANUVCHI_KALITI = "vazifalar:foydalanuvchi";

// catch'dagi qiymat — unknown: throw istalgan narsani tashlashi mumkin.
// localStorage DOMException (Error) tashlaydi; boshqasi — matn qilib
function xatoNomi(xato: unknown): string {
  return xato instanceof Error ? xato.name : String(xato);
}

// Massiv ham, VazifalarRoyxati ham (eksportMatni ikkalasini oladi)
export function saqla(
  vazifalar: Parameters<typeof eksportMatni>[0],
): boolean {
  try {
    localStorage.setItem(SAQLASH_KALITI, eksportMatni(vazifalar));
    return true;
  } catch (xato) {
    console.warn(`Vazifalar saqlanmadi: ${xatoNomi(xato)}`);
    return false;
  }
}

export function yukla(): VazifaMalumoti[] | null {
  let matn;
  try {
    matn = localStorage.getItem(SAQLASH_KALITI);
  } catch (xato) {
    console.warn(`Xotirani o'qib bo'lmadi: ${xatoNomi(xato)}`);
    return null;
  }
  if (matn === null) {
    return null;
  }
  const natija = paketniTekshir(matn);
  if (!natija.ok) {
    console.warn(`Saqlangan vazifalar buzuq: ${natija.xato.message}`);
    return null;
  }
  return natija.qiymat;
}

// Shu brauzerning serverdagi ro'yxati: kalit bir marta yaratiladi
export function kalitniOl(): string {
  try {
    let kalit = localStorage.getItem(SERVER_KALITI_NOMI);
    if (kalit === null) {
      kalit = crypto.randomUUID();
      localStorage.setItem(SERVER_KALITI_NOMI, kalit);
    }
    return kalit;
  } catch (xato) {
    console.warn(`Kalit saqlanmadi: ${xatoNomi(xato)}`);
    return crypto.randomUUID();
  }
}

// Yozib tugatilmagan vazifa matni: sahifa yangilansa ham yo'qolmasin
export function qoralamaniSaqla(matn: string): void {
  try {
    if (matn === "") {
      localStorage.removeItem(QORALAMA_KALITI);
    } else {
      localStorage.setItem(QORALAMA_KALITI, matn);
    }
  } catch (xato) {
    console.warn(`Qoralama saqlanmadi: ${xatoNomi(xato)}`);
  }
}

/**
 * 28-qism: foydalanuvchiga TEGISHLI brauzer nusxalari (vazifalar ro'yxati,
 * qoralama) — chiqishda va sessiya tugaganini bilganda o'chiriladi. Umumiy
 * kompyuter: busiz keyingi kirgan odam oldingisining ro'yxatini ko'rardi
 * (o'lchandi: natijalar/tajriba/t-frontend.txt). Qurilma sozlamalari (tema,
 * til) — foydalanuvchiniki emas, qoladi
 */
export function foydalanuvchiNusxasiniTozala(): void {
  try {
    localStorage.removeItem(SAQLASH_KALITI);
    localStorage.removeItem(QORALAMA_KALITI);
  } catch (xato) {
    console.warn(`Brauzer nusxasi o'chirilmadi: ${xatoNomi(xato)}`);
  }
}

export function qoralamaniOl(): string {
  try {
    return localStorage.getItem(QORALAMA_KALITI) ?? "";
  } catch {
    return ""; // xotira yopiq — qoralamasiz ochiladi
  }
}

// "tizim" — yozuv o'chadi: tanlov yo'q, tizim sozlamasi ishlaydi
export function temaniSaqla(tema: string): void {
  try {
    if (tema === "tizim") {
      localStorage.removeItem(TEMA_KALITI);
    } else {
      localStorage.setItem(TEMA_KALITI, tema);
    }
  } catch (xato) {
    console.warn(`Tema saqlanmadi: ${xatoNomi(xato)}`);
  }
}

// null — tanlov saqlanmagan (yoki xotira yopiq)
export function temaniOl(): string | null {
  try {
    return localStorage.getItem(TEMA_KALITI);
  } catch {
    return null;
  }
}

/**
 * Kirgan foydalanuvchi — XOM matn (18/#42): useSyncExternalStore
 * snapshot'i satr bo'lishi kerak (barqaror); o'qish/tekshirish —
 * xususiyatlar/auth/foydalanuvchi.ts. Xotira yopiq — null (kirilmagan)
 */
export function foydalanuvchiMatni(): string | null {
  try {
    return localStorage.getItem(FOYDALANUVCHI_KALITI);
  } catch {
    return null;
  }
}

/** null — chiqish (yozuv o'chadi) */
export function foydalanuvchiniSaqla(
  foydalanuvchi: Foydalanuvchi | null,
): void {
  try {
    if (foydalanuvchi === null) {
      localStorage.removeItem(FOYDALANUVCHI_KALITI);
    } else {
      localStorage.setItem(
        FOYDALANUVCHI_KALITI,
        JSON.stringify(foydalanuvchi),
      );
    }
  } catch (xato) {
    console.warn(`Kirish saqlanmadi: ${xatoNomi(xato)}`);
  }
}
