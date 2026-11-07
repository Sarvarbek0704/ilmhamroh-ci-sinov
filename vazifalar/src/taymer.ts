// taymer.ts — tez-tez keladigan chaqiruvlarni kamaytirish

export type Kechiktirilgan<A extends unknown[]> = ((
  ...argumentlar: A
) => void) & {
  /** Kutayotgan chaqiruvni hoziroq bajaradi (masalan, sahifa yopilganda) */
  hoziroq(): void;
  /** Kutayotgan chaqiruvni bajarmasdan tashlab yuboradi */
  bekor(): void;
};

/**
 * Debounce: chaqiruvlar to'xtagach, `kutish` ms o'tib, faqat
 * oxirgisi bajariladi. Har yangi chaqiruv taymerni boshidan boshlaydi.
 * A — ishlovchi argumentlari (tuple): kechiktirilgan funksiya aynan
 * shu argumentlarni qabul qiladi
 * @param kutish millisekund
 */
export function kechiktir<A extends unknown[]>(
  ishlovchi: (...argumentlar: A) => void,
  kutish: number,
): Kechiktirilgan<A> {
  let taymer: ReturnType<typeof setTimeout> | undefined;
  // kutayotgan chaqiruv argumentlari
  let kutayotgan: A | null = null;

  function hoziroq(): void {
    clearTimeout(taymer);
    if (kutayotgan === null) {
      return;
    }
    const argumentlar = kutayotgan;
    kutayotgan = null;
    ishlovchi(...argumentlar);
  }

  function bekor(): void {
    clearTimeout(taymer);
    kutayotgan = null;
  }

  function kechiktirilgan(...argumentlar: A): void {
    kutayotgan = argumentlar;
    clearTimeout(taymer);
    taymer = setTimeout(hoziroq, kutish);
  }

  return Object.assign(kechiktirilgan, { hoziroq, bekor });
}
