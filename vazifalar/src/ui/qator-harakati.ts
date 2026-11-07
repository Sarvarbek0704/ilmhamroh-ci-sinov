// qator-harakati.ts — ro'yxat qatorlari animatsiyasi (20/#23–#26).
// Faqat opacity va transform — kompozitor, layout qayta hisoblanmaydi
// (20/#21 tamoyili). Davomiylik qisqa: 150 ms.
// KIRISH — Motion (m.li, initial → animate). CHIQISH — AnimatePresence
// EMAS: u o'chirilgan, filtrdan chiqqan, server rad etgan qatorni ham exit
// tugaguncha DOM'da ushlab turadi — o'lchandi (natijalar/25-animatepresence.txt):
// e2e 5 tekshiruvi yiqildi, fon tabda (requestAnimationFrame to'xtaydi)
// o'chirilgan qator 10 s da ham DOM'dan ketmadi. Shuning uchun chiqish —
// faqat foydalanuvchi O'CHIRGANDA, o'chirishdan OLDIN (chiqishAnimatsiyasi)
import { useReducedMotion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

type QatorHarakati = Pick<
  HTMLMotionProps<"li">,
  "initial" | "animate" | "transition"
>;

/** @param yangi — ro'yxat ochilgandan KEYIN qo'shilgan qator */
export function useQatorHarakati(yangi: boolean): QatorHarakati {
  // prefers-reduced-motion — animatsiyasiz (opacity ham)
  const kamaytir = useReducedMotion() ?? false;
  return {
    initial: yangi && !kamaytir ? { opacity: 0, y: -8 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
  };
}

/**
 * O'chirilayotgan qator — avval ko'rinishdan chiqadi, keyin ro'yxatdan.
 * Brauzerning o'z Web Animations API'si (Motion'ning useAnimate'i butun
 * animatsiya yadrosini birinchi yuklashga qo'shardi). Ko'pi bilan 300 ms
 * kutadi: fon tabda animatsiya tugashi kechikishi mumkin
 */
export async function chiqishAnimatsiyasi(
  li: Element | null,
): Promise<void> {
  if (
    li === null ||
    typeof li.animate !== "function" || // jsdom (Vitest)
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  const animatsiya = li.animate(
    [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateX(1rem)" },
    ],
    { duration: 150, easing: "ease-in", fill: "forwards" },
  );
  await Promise.race([
    animatsiya.finished.then(
      () => undefined,
      () => undefined,
    ),
    new Promise<void>((tugadi) => setTimeout(tugadi, 300)),
  ]);
}
