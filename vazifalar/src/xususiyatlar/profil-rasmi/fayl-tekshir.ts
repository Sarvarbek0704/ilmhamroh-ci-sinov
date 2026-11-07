// fayl-tekshir.ts — tanlangan rasm (19/#36), sof funksiya (Vitest (node muhiti)).
// Klientdagi tekshiruv — foydalanuvchiga TEZ javob uchun, himoya emas:
// file.type — brauzer kengaytmadan taxmin qiladi, o'zgartirib bo'ladi.
// Haqiqiy tekshiruv (tarkib, hajm) — serverda (29-qism)

export const RUXSAT_TURLAR = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
/** 1 MB — «Bahor» mashq serveri (aks) ham taxminan shunchasini qabul qiladi */
const ENG_KATTA = 1_000_000;

type Fayl = {
  readonly name: string;
  readonly type: string;
  readonly size: number;
};

/** Hajm — odam o'qiydigan: 950 B, 12.3 KB, 1.2 MB */
export function hajmMatni(bayt: number): string {
  if (bayt < 1000) {
    return `${bayt} B`;
  }
  if (bayt < 1_000_000) {
    return `${(bayt / 1000).toFixed(1)} KB`;
  }
  return `${(bayt / 1_000_000).toFixed(1)} MB`;
}

/** @returns xato matni yoki null (fayl yaroqli) */
export function faylniTekshir(fayl: Fayl): string | null {
  if (!RUXSAT_TURLAR.some((tur) => tur === fayl.type)) {
    return `«${fayl.name}» — rasm emas (PNG, JPEG yoki WebP kerak).`;
  }
  if (fayl.size === 0) {
    return `«${fayl.name}» bo'sh.`;
  }
  if (fayl.size > ENG_KATTA) {
    return `«${fayl.name}» juda katta (${hajmMatni(fayl.size)}; ko'pi bilan ${hajmMatni(ENG_KATTA)}).`;
  }
  return null;
}
