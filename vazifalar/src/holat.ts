// holat.ts — ilova holatining SOF qismi. 17/#28 dan holatning o'zi —
// App'ning useState'larida (v6 dagi mutable "holat" obyekti va uning
// o'zgartiruvchilari yo'q); bu yerda faqat qiymat qaytaradigan funksiyalar
import { VazifalarRoyxati } from "./royxat.ts";
import { qidir } from "./qidiruv.ts";
import type { Filtr, Saralash, VazifaMalumoti } from "./turlar.ts";

function chuqurMuzlat<T extends object>(obyekt: T): Readonly<T> {
  for (const qiymat of Object.values(obyekt)) {
    if (typeof qiymat === "object" && qiymat !== null) {
      chuqurMuzlat(qiymat);
    }
  }
  return Object.freeze(obyekt);
}

export const boshlangichVazifalar: readonly VazifaMalumoti[] =
  chuqurMuzlat([
    { id: 1, matn: "Non olish", bajarildi: false },
    { id: 2, matn: "DOM darsini takrorlash", bajarildi: true },
    { id: 3, matn: "Onamga qo'ng'iroq qilish", bajarildi: false },
  ]);

// So'rovlar: faqat qiymat qaytaradi
export function xatoniTop(
  matn: string,
  vazifalar: VazifalarRoyxati,
  ozId: number | null,
): string | null {
  if (matn === "") {
    return "Vazifa matnini yozing.";
  }
  if (vazifalar.matnBormi(matn, ozId)) {
    return "Bu vazifa ro'yxatda allaqachon bor.";
  }
  return null;
}

// Filtr, keyin qidiruv: qidir tartibni saqlaydi.
// 18/#20: natija — ro'yxatdagi O'SHA obyektlar (Vazifa nusxalari emas):
// o'zgarmagan vazifa havolasi o'zgarmaydi — memo'li qator (VazifaQatori)
// uni Object.is bilan solishtirib, qayta chizilmaydi. Avval har renderda
// yangi Vazifa yasalardi va 1 000 qatorning hammasi qayta chizilardi
// (o'lchandi: bitta katak — 18 056 komponent render, natijalar/18-*)
export function korinadiganVazifalar<T extends VazifaMalumoti>(
  vazifalar: readonly T[],
  filtr: Filtr,
  saralash: Saralash,
  qidiruv: string,
): T[] {
  const asl = new Map(vazifalar.map((v) => [v.id, v]));
  return qidir(
    VazifalarRoyxati.dan(vazifalar).korinadiganlar(filtr, saralash),
    qidiruv,
  ).flatMap((v) => asl.get(v.id) ?? []); // id lar bir xil — doim topiladi
}

/**
 * Yangi vazifa ekranda ko'rinsin: "bajarilgan" filtri "hammasi" ga
 * o'tadi, qidiruvga mos kelmasa — qidiruv tozalanadi (v6 dagi
 * vazifaQosh() ning holatga tegadigan qismi)
 */
export function qoshilgandaKorinsin(
  matn: string,
  filtr: Filtr,
  qidiruv: string,
): { filtr: Filtr; qidiruv: string } {
  return {
    filtr: filtr === "bajarilgan" ? "hammasi" : filtr,
    qidiruv: qidir([{ matn }], qidiruv).length === 0 ? "" : qidiruv,
  };
}

/**
 * Fokus qayerga o'tadi (17/#34): ko'rinib turgan ro'yxatda keyingi,
 * u bo'lmasa oldingi qator. v6 da DOM'dan (nextElementSibling) olinardi —
 * endi ekrandagi tartibning o'zidan (hosilaviy qiymat)
 */
export function qoshniId(
  korinadigan: readonly { readonly id: number }[],
  id: number,
): number | null {
  const joy = korinadigan.findIndex((v) => v.id === id);
  if (joy === -1) {
    return null;
  }
  return (korinadigan[joy + 1] ?? korinadigan[joy - 1])?.id ?? null;
}
