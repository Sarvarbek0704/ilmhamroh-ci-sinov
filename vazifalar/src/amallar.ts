// amallar.ts — vazifalar ro'yxatini o'zgartiruvchi SOF funksiyalar
// (17/#14). Hech biri massivni yoki vazifani joyida o'zgartirmaydi:
// yangi massiv qaytaradi, tegilmagan vazifalar — o'sha obyektlarning
// o'zi (nusxa emas). React o'zgarishni havola bo'yicha (Object.is)
// sezadi: push() yoki v.bajarildi = true dan keyin massiv "o'sha-o'sha"
// — ekran yangilanmaydi. v6 dagi VazifalarRoyxati.qosh/almashtir... shu
// yerga ko'chdi (17/#14)
import { Vazifa } from "./vazifa.ts";
import type { VazifaMalumoti } from "./turlar.ts";

type Vazifalar = readonly VazifaMalumoti[];

/**
 * Yangi id — eng kattasidan keyingisi. Alohida hisoblagich saqlanmaydi:
 * u ro'yxatdan kelib chiqadi (hosilaviy qiymat, 17/#15)
 */
export function keyingiId(vazifalar: Vazifalar): number {
  return vazifalar.reduce((eng, v) => Math.max(eng, v.id), 0) + 1;
}

/** @returns oxiriga yangi vazifa qo'shilgan YANGI massiv */
export function qosh(vazifalar: Vazifalar, matn: string): Vazifalar {
  const yangi = { id: keyingiId(vazifalar), matn, bajarildi: false };
  return [...vazifalar, yangi];
}

/** @returns id li vazifaning bajarildi'si teskarisiga o'zgargan massiv */
export function almashtir(vazifalar: Vazifalar, id: number): Vazifalar {
  return vazifalar.map((v) =>
    v.id === id ? { ...v, bajarildi: !v.bajarildi } : v,
  );
}

/**
 * Bo'sh yoki juda uzun matn qabul qilinmaydi — o'sha massivning o'zi
 * qaytadi (havola o'zgarmadi = o'zgarish yo'q)
 */
export function matnniOzgartir(
  vazifalar: Vazifalar,
  id: number,
  matn: string,
): Vazifalar {
  const toza = matn.trim();
  if (toza === "" || toza.length > Vazifa.MAKS_UZUNLIK) {
    return vazifalar;
  }
  return vazifalar.map((v) => (v.id === id ? { ...v, matn: toza } : v));
}

export function ochir(vazifalar: Vazifalar, id: number): Vazifalar {
  return vazifalar.filter((v) => v.id !== id);
}
