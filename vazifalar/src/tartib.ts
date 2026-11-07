// tartib.ts — qo'lda tartiblash (20/#17, sudrab tashlash). Sof funksiya:
// DOM va React'siz, Vitest (node muhiti) bilan tekshiriladi.
// "standart" saralash massiv tartibini saqlaydi (faollar — oldin,
// barqaror sort, 14/#27) — shuning uchun qo'lda tartib = massivdagi joy.
// Ko'chirish ekrandagi (filtrlangan) ro'yxatda bo'ladi, lekin yoziladigani —
// TO'LIQ massiv: A elementi B ning joyiga (B dan oldin yoki keyin)
import type { VazifaMalumoti } from "./turlar.ts";

export type TartibNatijasi =
  | { ok: true; vazifalar: readonly VazifaMalumoti[]; joy: number }
  | { ok: false; sabab: "bir-xil" | "topilmadi" | "boshqa-guruh" };

/**
 * @param korinadigan ekrandagi tartib (filtr bilan) — yo'nalish shundan
 * @returns joy — A ning ekrandagi yangi o'rni (1 dan)
 */
export function kochir(
  vazifalar: readonly VazifaMalumoti[],
  korinadigan: readonly VazifaMalumoti[],
  aId: number,
  bId: number,
): TartibNatijasi {
  if (aId === bId) {
    return { ok: false, sabab: "bir-xil" };
  }
  const a = vazifalar.find((v) => v.id === aId);
  const b = vazifalar.find((v) => v.id === bId);
  const ekranA = korinadigan.findIndex((v) => v.id === aId);
  const ekranB = korinadigan.findIndex((v) => v.id === bId);
  if (a === undefined || b === undefined || ekranA < 0 || ekranB < 0) {
    return { ok: false, sabab: "topilmadi" };
  }
  // Faol va bajarilgan — alohida guruhlar: "standart" bajarilganni baribir
  // pastga tushiradi, ko'chirish ko'rinmay qolardi
  if (a.bajarildi !== b.bajarildi) {
    return { ok: false, sabab: "boshqa-guruh" };
  }
  const pastga = ekranA < ekranB;
  const qolgan = vazifalar.filter((v) => v.id !== aId);
  const joyB = qolgan.findIndex((v) => v.id === bId);
  const yangi = [
    ...qolgan.slice(0, pastga ? joyB + 1 : joyB),
    a,
    ...qolgan.slice(pastga ? joyB + 1 : joyB),
  ];
  return { ok: true, vazifalar: yangi, joy: ekranB + 1 };
}
