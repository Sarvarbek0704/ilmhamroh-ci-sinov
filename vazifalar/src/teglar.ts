// teglar.ts — teg qatori matni va teg takliflari (sof funksiyalar).
// v6 da render.ts ichida edi; 17/#16 dan App chaqiradi
import { PrefiksDaraxti } from "./prefiks-daraxti.ts";
import type { JoriyTeg } from "./royxat.ts";

const TAKLIFLAR_SONI = 5;

/** "#bozor — 2, #uy — 1" */
export function teglarMatni(
  sanoq: ReadonlyMap<string, number>,
): string {
  return [...sanoq].map(([teg, soni]) => `${teg} — ${soni}`).join(", ");
}

/**
 * Teglar lug'ati ro'yxat o'zgarganda BIR marta quriladi (O(T · l)),
 * har harf yozilganda faqat so'raladi (O(p + s)) — ro'yxat aylanmaydi
 */
export function tegDaraxtiniQur(
  sanoq: ReadonlyMap<string, number>,
): PrefiksDaraxti {
  const daraxt = new PrefiksDaraxti();
  for (const [teg, soni] of sanoq) {
    daraxt.qosh(teg, soni);
  }
  return daraxt;
}

/** joriy — joriyTeg() natijasi; null — taklif yo'q */
export function tegTakliflari(
  daraxt: PrefiksDaraxti,
  joriy: JoriyTeg | null,
): readonly string[] {
  if (joriy === null) {
    return [];
  }
  return daraxt
    .boshlanganlar(joriy.prefiks, TAKLIFLAR_SONI + 1)
    .filter((teg) => teg !== joriy.prefiks)
    .slice(0, TAKLIFLAR_SONI);
}
