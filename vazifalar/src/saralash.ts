// saralash.ts — ko'rinadigan vazifalar tartibi: bir nechta kalit bilan
import { normalla } from "./qidiruv.ts";
import type { Saralash, VazifaMalumoti } from "./turlar.ts";

// Strukturaviy tiplash: Vazifa klassi ham VazifaMalumoti ga mos (id,
// matn, bajarildi bor) — klassni import qilish shart emas
type Taqqoslovchi = (a: VazifaMalumoti, b: VazifaMalumoti) => number;

// URL ham, <select> ham shu ro'yxatga qaraydi
export const SARALASHLAR: readonly Saralash[] = Object.freeze([
  "standart",
  "yangi",
  "alifbo",
]);

const faollarOldin: Taqqoslovchi = (a, b) =>
  Number(a.bajarildi) - Number(b.bajarildi);
// id — qo'shilish tartibi: kattasi — yangisi
const yangilarOldin: Taqqoslovchi = (a, b) => b.id - a.id;
const eskilarOldin: Taqqoslovchi = (a, b) => a.id - b.id;

// Bir marta yaratiladi — har taqqoslashda emas. numeric: "2-dars"
// "10-dars" dan oldin. Chrome 154 da "uz" qoidalari yo'q: brauzer
// tiliga o'tadi (12-qism) — o', g', sh, ch alifbo oxirida emas
const alifbo = new Intl.Collator("uz", { numeric: true });

/**
 * Har saralash: avval faollar (oldingi xulq), keyin tanlangan kalit.
 * Array.prototype.toSorted barqaror (stable): kalitlari teng
 * vazifalar kelgan tartibida qoladi — "standart" shunga tayanadi.
 * Generic: Vazifa[] kirsa — Vazifa[] chiqadi
 * @returns yangi massiv
 */
export function tartibla<T extends VazifaMalumoti>(
  vazifalar: readonly T[],
  saralash: Saralash,
): T[] {
  switch (saralash) {
    case "standart":
      return vazifalar.toSorted(faollarOldin);
    case "yangi":
      // Bir nechta kalit: birinchisi 0 (teng) bo'lsa, || keyingisiga o'tadi
      return vazifalar.toSorted(
        (a, b) => faollarOldin(a, b) || yangilarOldin(a, b),
      );
    case "alifbo":
      return alifboTartibida(vazifalar);
    default: {
      // To'liqlik tekshiruvi: Saralash'ga yangi qiymat qo'shilib, bu
      // yerda case yozilmasa — saralash never emas, tsc xato beradi.
      // Ish vaqtida esa (JS'dan begona satr kelsa) — "standart"
      const qolmadi: never = saralash;
      void qolmadi;
      return vazifalar.toSorted(faollarOldin);
    }
  }
}

function alifboTartibida<T extends VazifaMalumoti>(
  vazifalar: readonly T[],
): T[] {
  // Kalit har vazifa uchun BIR marta (n ta normalla), har taqqoslashda
  // emas (~n log n ta): bezash → saralash → qaytarish
  const bezalgan = vazifalar.map((vazifa) => ({
    vazifa,
    kalit: normalla(vazifa.matn),
  }));
  bezalgan.sort(
    (a, b) =>
      faollarOldin(a.vazifa, b.vazifa) ||
      alifbo.compare(a.kalit, b.kalit) ||
      eskilarOldin(a.vazifa, b.vazifa),
  );
  return bezalgan.map(({ vazifa }) => vazifa);
}
