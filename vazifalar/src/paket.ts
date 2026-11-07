// paket.ts — eksport va import: {versiya: 1, vazifalar: [...]}; tashqi
// ma'lumotni (fayl, kesh, boshqa tab) tekshiradigan yagona joy
import { Vazifa, VazifaXatosi } from "./vazifa.ts";
import type { Natija, Paket, VazifaMalumoti } from "./turlar.ts";

// Eksport shakli o'zgarsa — versiya oshadi, eski matnlar rad etiladi.
// Turi — 1 (literal), number emas: Paket bilan bir joyda o'zgaradi
const PAKET_VERSIYASI: Paket["versiya"] = 1;
const VAZIFA_MAYDONLARI = ["id", "matn", "bajarildi"] as const;
const EKSPORT_MAYDONLARI = [
  "versiya",
  "vazifalar",
  ...VAZIFA_MAYDONLARI,
];

/**
 * Ikkinchi argument — massiv: JSON'ga faqat shu kalitlar chiqadi,
 * keyin qo'shilgan maydon eksportga o'zi sizib ketmaydi.
 * @param vazifalar massiv yoki VazifalarRoyxati (toJSON bilan)
 */
export function eksportMatni(
  vazifalar: Paket["vazifalar"] | { toJSON(): VazifaMalumoti[] },
): string {
  const paket = { versiya: PAKET_VERSIYASI, vazifalar };
  return JSON.stringify(paket, EKSPORT_MAYDONLARI, 2);
}

/**
 * Eksport fayli nomi — sana bilan, tartiblaganda xronologik turadi.
 * Mahalliy sana (UTC emas): kechasi soat 2 da olingan fayl kechagi
 * sanani olmasin
 * @returns masalan "vazifalar-2026-10-05.json"
 */
export function eksportFaylNomi(sana: Date = new Date()): string {
  const oy = String(sana.getMonth() + 1).padStart(2, "0");
  const kun = String(sana.getDate()).padStart(2, "0");
  return `vazifalar-${sana.getFullYear()}-${oy}-${kun}.json`;
}

// Tur predikati: true bo'lsa, TS qiymatni Record deb biladi
function oddiyObyektmi(
  qiymat: unknown,
): qiymat is Record<string, unknown> {
  return (
    typeof qiymat === "object" &&
    qiymat !== null &&
    !Array.isArray(qiymat)
  );
}

/**
 * Oq ro'yxat: faqat uch maydon va faqat o'z kalitlari
 * @returns hali tekshirilmagan
 */
function vazifaniOl(xom: unknown): Record<string, unknown> {
  const vazifa: Record<string, unknown> = {};
  if (!oddiyObyektmi(xom)) {
    return vazifa;
  }
  for (const maydon of VAZIFA_MAYDONLARI) {
    if (Object.hasOwn(xom, maydon)) {
      vazifa[maydon] = xom[maydon];
    }
  }
  return vazifa;
}

/** @param tartib 1 dan boshlanadi */
function vazifaXatosi(tartib: number, sabab: string): VazifaXatosi {
  return new VazifaXatosi(`${tartib}-vazifa: ${sabab}`, {
    kod: "VAZIFA",
  });
}

// Assertion funksiya: qaytsa — massiv VazifaMalumoti[]; aks holda throw
function malumotlarniTekshir(
  malumotlar: Record<string, unknown>[],
): asserts malumotlar is VazifaMalumoti[] {
  const idlar = new Set<number>();
  malumotlar.forEach((v, i) => {
    const tartib = i + 1;
    if (
      typeof v.id !== "number" ||
      !Number.isInteger(v.id) ||
      v.id < 1 ||
      idlar.has(v.id)
    ) {
      throw vazifaXatosi(tartib, "id musbat, takrorlanmas son emas.");
    }
    idlar.add(v.id);
    if (typeof v.matn !== "string" || v.matn.trim() === "") {
      throw vazifaXatosi(tartib, "matn bo'sh.");
    }
    if (v.matn.length > Vazifa.MAKS_UZUNLIK) {
      throw vazifaXatosi(tartib, "matn juda uzun.");
    }
    if (typeof v.bajarildi !== "boolean") {
      throw vazifaXatosi(tartib, "bajarildi true yoki false emas.");
    }
  });
}

function vazifalarniTekshir(xom: unknown[]): VazifaMalumoti[] {
  const malumotlar = xom.map(vazifaniOl);
  malumotlarniTekshir(malumotlar);
  return malumotlar;
}

/**
 * @param matn eksport qilingan JSON
 * @throws {VazifaXatosi} kod: JSON | TUZILMA | VERSIYA | VAZIFA
 */
export function paketniOqi(matn: string): VazifaMalumoti[] {
  let xom: unknown;
  try {
    xom = JSON.parse(matn);
  } catch (xato) {
    throw new VazifaXatosi("Matn JSON emas. Eksportni to'liq oling.", {
      kod: "JSON",
      cause: xato,
    });
  }
  if (!oddiyObyektmi(xom)) {
    throw new VazifaXatosi("Bu matn vazifalar eksporti emas.", {
      kod: "TUZILMA",
    });
  }
  if (xom.versiya !== PAKET_VERSIYASI) {
    // versiya — unknown: shablon satrga String() bilan aniq beramiz
    // (16/#38, ESLint topdi) — xabar matni avvalgidek
    const versiya = String(xom.versiya);
    throw new VazifaXatosi(
      `Versiya ${versiya} o'qilmaydi — faqat ${PAKET_VERSIYASI}.`,
      { kod: "VERSIYA" },
    );
  }
  if (!Array.isArray(xom.vazifalar)) {
    throw new VazifaXatosi("Matnda vazifalar ro'yxati yo'q.", {
      kod: "TUZILMA",
    });
  }
  return vazifalarniTekshir(xom.vazifalar);
}

/**
 * paketniOqi ning throw'siz shakli. Kutilgan xato (buzuq matn —
 * VazifaXatosi) — natija qiymati: chaqiruvchi ok ni tekshirmasdan
 * vazifalarni ololmaydi. Boshqa xato — dasturchi xatosi, throw qoladi
 */
export function paketniTekshir(
  matn: string,
): Natija<VazifaMalumoti[], VazifaXatosi> {
  try {
    return { ok: true, qiymat: paketniOqi(matn) };
  } catch (xato) {
    if (xato instanceof VazifaXatosi) {
      return { ok: false, xato };
    }
    throw xato;
  }
}
