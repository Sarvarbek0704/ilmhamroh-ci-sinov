// fabrika.ts — 22/#15: test ma'lumotlari fabrikasi. Har test faylida
// { id: 1, matn: "...", bajarildi: false } ni qo'lda yozish o'rniga:
// faqat test uchun MUHIM maydon aytiladi, qolgani — mantiqiy sukut.
// id — o'suvchi hisoblagich: ikki vazifa tasodifan bir xil id olmaydi.
// Kutubxona (fishery, @faker-js/faker) kerak emas: model 3 maydonli,
// tasodifiy matn esa test natijasini takrorlanmas qilardi
import type { VazifaMalumoti } from "../../src/turlar.ts";

let keyingiId = 1;

/** Hisoblagich — testlar orasida (vitest-sozlash.ts, afterEach) */
export function fabrikaniTikla(): void {
  keyingiId = 1;
}

export function vazifa(
  ozgarish: Partial<VazifaMalumoti> = {},
): VazifaMalumoti {
  const id = ozgarish.id ?? keyingiId++;
  return { id, matn: `Vazifa ${id}`, bajarildi: false, ...ozgarish };
}

/** n ta vazifa; har biriga ozgarish(i) qo'shiladi (masalan, har 2-si bajarilgan) */
export function vazifalar(
  n: number,
  ozgarish: (i: number) => Partial<VazifaMalumoti> = () => ({}),
): VazifaMalumoti[] {
  return Array.from({ length: n }, (_, i) => vazifa(ozgarish(i)));
}
