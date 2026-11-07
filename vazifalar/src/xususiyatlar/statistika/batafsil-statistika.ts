// batafsil-statistika.ts — «Batafsil statistika» paneli hisobi (18/#03).
// Sof funksiya, React'siz: Vitest (node muhiti) bilan sinaladi. Ro'yxat katta
// bo'lsa qimmat (har vazifa matni normallanadi, so'zlarga bo'linadi) —
// shuning uchun panel uni kutish bilan (Suspense + use) oladi
import { normalla } from "../../qidiruv.ts";
import { TEG, teglariniOl } from "../../royxat.ts";
import type { VazifaMalumoti } from "../../turlar.ts";
import { csvYoz } from "../../csv.ts";

export type TegHisobi = {
  readonly teg: string;
  readonly jami: number;
  readonly bajarildi: number;
};

type SozHisobi = {
  readonly soz: string;
  readonly soni: number;
};

export type BatafsilStatistika = {
  readonly jami: number;
  readonly bajarildi: number;
  /** 0..100, butun son */
  readonly foiz: number;
  /** matn uzunligining o'rtachasi (belgi), butun */
  readonly ortachaUzunlik: number;
  /** ko'p ishlatilgani oldin, teng bo'lsa — kod tartibida */
  readonly teglar: readonly TegHisobi[];
  /** eng ko'p uchragan so'zlar (teglarsiz, 3+ harf) */
  readonly sozlar: readonly SozHisobi[];
};

export const SOZLAR_SONI = 10;
// normalla() dan keyin apostroflar bitta (') — o'quv bitta so'z
const SOZ = /[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu;
const QISQA = 3;

// Teng bo'lsa — kod nuqtasi tartibida (Intl.Collator emas: Node va
// Chrome'da "uz" qoidalari har xil — 12-qism; natija hamma joyda bir xil)
function kamayib<T>(soni: (x: T) => number, nomi: (x: T) => string) {
  return (a: T, b: T): number =>
    soni(b) - soni(a) || (nomi(a) < nomi(b) ? -1 : 1);
}

export function batafsilHisobla(
  vazifalar: readonly VazifaMalumoti[],
): BatafsilStatistika {
  const teglar = new Map<string, { jami: number; bajarildi: number }>();
  const sozlar = new Map<string, number>();
  let bajarildi = 0;
  let uzunlik = 0;
  for (const vazifa of vazifalar) {
    if (vazifa.bajarildi) {
      bajarildi++;
    }
    uzunlik += vazifa.matn.length;
    for (const teg of teglariniOl(vazifa.matn)) {
      const hisob = teglar.get(teg) ?? { jami: 0, bajarildi: 0 };
      hisob.jami++;
      if (vazifa.bajarildi) {
        hisob.bajarildi++;
      }
      teglar.set(teg, hisob);
    }
    const matn = normalla(vazifa.matn.replaceAll(TEG, " "));
    for (const soz of matn.match(SOZ) ?? []) {
      if (soz.length >= QISQA) {
        sozlar.set(soz, (sozlar.get(soz) ?? 0) + 1);
      }
    }
  }
  const jami = vazifalar.length;
  return {
    jami,
    bajarildi,
    foiz: jami === 0 ? 0 : Math.round((bajarildi / jami) * 100),
    ortachaUzunlik: jami === 0 ? 0 : Math.round(uzunlik / jami),
    teglar: [...teglar]
      .map(([teg, h]) => ({ teg, ...h }))
      .sort(
        kamayib(
          (t) => t.jami,
          (t) => t.teg,
        ),
      ),
    sozlar: [...sozlar]
      .map(([soz, soni]) => ({ soz, soni }))
      .sort(
        kamayib(
          (s) => s.soni,
          (s) => s.soz,
        ),
      )
      .slice(0, SOZLAR_SONI),
  };
}

// --- Hisobot fayli (18/#26: «Hisobotni yuklab olish» menyusi) ---

// CSV yozish — csv.ts (21/#15: vazifalar eksporti bilan bitta kod)

/**
 * Statistika — CSV (Excel uchun): teglar jadvali, bo'sh qator, so'zlar.
 * Boshida BOM — Excel UTF-8 ni taniydi (o'zbekcha harflar buzilmaydi)
 */
export function statistikaCsv(s: BatafsilStatistika): string {
  const qatorlar = [
    ["Teg", "Jami", "Bajarilgan"],
    ...s.teglar.map((t) => [t.teg, t.jami, t.bajarildi]),
    [],
    ["So'z", "Soni"],
    ...s.sozlar.map((z) => [z.soz, z.soni]),
  ];
  return csvYoz(qatorlar);
}
