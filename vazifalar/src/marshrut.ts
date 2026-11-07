// marshrut.ts — filtr va saralash URL'da: ?filtr=faol&saralash=alifbo.
// 19/#09 dan faqat SOF qism (qiymatni o'qish va yangi parametrlar);
// URL'ga yozish — React Router (hooklar/useUrlTanlovi.ts). 17/#38 dagi
// o'z pushState'imiz va obunachilar ro'yxati olib tashlandi: tarixning
// egasi bitta bo'lsin (o'lchandi: natijalar/09-tarix-oldin.txt —
// pushState(null) yozuvlarini router tanimaydi, uning idx hisobi adashadi)
import { SARALASHLAR } from "./saralash.ts";
import type { Filtr, Saralash } from "./turlar.ts";

// Filtrlarning yagona ro'yxati: URL ham, tugmalar ham shunga qaraydi
export const FILTRLAR: readonly Filtr[] = Object.freeze([
  "hammasi",
  "faol",
  "bajarilgan",
]);

/** To'liq manzil (testlar) yoki router bergan parametrlar */
type Manba = string | URLSearchParams;

const parametrlar = (manba: Manba): URLSearchParams =>
  typeof manba === "string" ? new URL(manba).searchParams : manba;

// URL'dagi qiymat — oq ro'yxatdan; yo'q yoki begona bo'lsa — standart
function parametrniOl<T extends string>(
  manba: Manba,
  nomi: string,
  ruxsatlar: readonly T[],
  standart: T,
): T {
  // get() — string | null: parametr yo'q bo'lsa null. find ruxsat
  // etilganini T turida qaytaradi; null hech biriga teng emas
  const qiymat = parametrlar(manba).get(nomi);
  return ruxsatlar.find((ruxsat) => ruxsat === qiymat) ?? standart;
}

/**
 * Yangi parametrlar (eskisi o'zgarmaydi): standart qiymat URL'ga
 * yozilmaydi, boshqa parametrlar (muvaffaqiyatsiz=1...) joyida qoladi
 */
export function parametrniQoy(
  eski: URLSearchParams,
  nomi: string,
  qiymat: string,
  standart: string,
): URLSearchParams {
  const yangi = new URLSearchParams(eski);
  if (qiymat === standart) {
    yangi.delete(nomi);
  } else {
    yangi.set(nomi, qiymat);
  }
  return yangi;
}

export function filtrniOl(manba: Manba): Filtr {
  return parametrniOl(manba, "filtr", FILTRLAR, "hammasi");
}

export function saralashniOl(manba: Manba): Saralash {
  return parametrniOl(manba, "saralash", SARALASHLAR, "standart");
}
