// royxat.ts — vazifalar to'plami: so'rovlar (filtr, statistika, teglar).
// 17/#14 dan faqat O'QIYDI: o'zgartirish — amallar.ts (yangi massiv),
// obuna — kerak emas (holat.ts xabar beradi)
import { Vazifa } from "./vazifa.ts";
import { tartibla } from "./saralash.ts";
import type { Filtr, Saralash, VazifaMalumoti } from "./turlar.ts";

function guruhNomi(vazifa: Vazifa): "bajarilgan" | "faol" {
  return vazifa.bajarildi ? "bajarilgan" : "faol";
}

// Teg: # dan keyin harf, raqam yoki _ — har qanday alifbo (\p{L}, u
// flagi). Apostrof faqat harflar orasida: #o'quv, #g'isht. ʻ (U+02BB)
// \p{L} ga kiradi; ' ‘ ’ — tinish belgisi, alohida. Oldida harf
// yoki # bo'lsa (Non#uy, ##uy) — teg emas
export const TEG =
  /(?<![\p{L}\p{N}_#])#[\p{L}\p{N}_]+(?:['‘’][\p{L}\p{N}_]+)*/gu;

// Yozilayotgan teg: kursor oldida "#" va teg belgilari (oxirgi
// apostrof ham — "#o'" hali yozilmoqda). Kursordan keyin teg belgisi
// bo'lsa — so'z o'rtasida, taklif yo'q
const YOZILAYOTGAN_TEG =
  /(?<![\p{L}\p{N}_#])#[\p{L}\p{N}_]*(?:['‘’][\p{L}\p{N}_]*)*$/u;
const TEG_BELGISI = /[\p{L}\p{N}_'‘’]/u;

export type JoriyTeg = {
  readonly boshi: number;
  // kichik harfda — teglar ham shunday saqlanadi
  readonly prefiks: string;
};

/**
 * @param matn maydondagi matn
 * @param kursor kursor o'rni (selectionStart)
 */
export function joriyTeg(
  matn: string,
  kursor: number,
): JoriyTeg | null {
  if (TEG_BELGISI.test(matn.charAt(kursor))) {
    return null;
  }
  const topildi = YOZILAYOTGAN_TEG.exec(matn.slice(0, kursor));
  if (topildi === null) {
    return null;
  }
  return { boshi: topildi.index, prefiks: topildi[0].toLowerCase() };
}

/**
 * @returns kichik harfda, takrorsiz (18/#03 dan batafsil statistika ham
 *   ishlatadi)
 */
export function teglariniOl(matn: string): Set<string> {
  const teglar = matn.match(TEG) ?? [];
  return new Set(teglar.map((teg) => teg.toLowerCase()));
}

function tegToplami(vazifalar: readonly Vazifa[]): Set<string> {
  return new Set(
    vazifalar.flatMap((vazifa) => [...teglariniOl(vazifa.matn)]),
  );
}

export class VazifalarRoyxati {
  #vazifalar: Vazifa[] = [];

  static dan(malumotlar: readonly VazifaMalumoti[]): VazifalarRoyxati {
    const yangi = new VazifalarRoyxati();
    yangi.#vazifalar = malumotlar.map((malumot) => Vazifa.dan(malumot));
    return yangi;
  }

  static mosmi(vazifa: Vazifa, filtr: Filtr): boolean {
    if (filtr === "faol") {
      return !vazifa.bajarildi;
    }
    if (filtr === "bajarilgan") {
      return vazifa.bajarildi;
    }
    return true;
  }

  // So'rovlar: royxatni o'zgartirmaydi
  statistika(): { qoldi: number; bajarildi: number } {
    const guruhlar = Object.groupBy(this.#vazifalar, guruhNomi);
    return {
      qoldi: guruhlar.faol?.length ?? 0,
      bajarildi: guruhlar.bajarilgan?.length ?? 0,
    };
  }

  get qoldi(): number {
    return this.statistika().qoldi;
  }

  /**
   * @param saralash "standart" — faollar oldin, qolgani qo'shilish
   *   tartibida (oldingi xulq)
   */
  korinadiganlar(
    filtr: Filtr,
    saralash: Saralash = "standart",
  ): Vazifa[] {
    return tartibla(
      this.#vazifalar.filter((v) => VazifalarRoyxati.mosmi(v, filtr)),
      saralash,
    );
  }

  top(id: number): Vazifa | undefined {
    return this.#vazifalar.find((v) => v.id === id);
  }

  /** @param ozId tekshirilmaydigan vazifa (tahrirdagi) */
  matnBormi(matn: string, ozId: number | null): boolean {
    const kichik = matn.toLowerCase();
    return this.#vazifalar.some(
      (v) => v.id !== ozId && v.matn.toLowerCase() === kichik,
    );
  }

  /** @returns teg → nechta vazifada */
  tegHisobi(): Map<string, number> {
    return this.#vazifalar
      .flatMap((vazifa) => [...teglariniOl(vazifa.matn)])
      .reduce(
        (sanoq, teg) => sanoq.set(teg, (sanoq.get(teg) ?? 0) + 1),
        new Map<string, number>(),
      );
  }

  yopilganTeglar(): Set<string> {
    const bajarilgan = this.#vazifalar.filter((v) => v.bajarildi);
    const faol = this.#vazifalar.filter((v) => !v.bajarildi);
    return tegToplami(bajarilgan).difference(tegToplami(faol));
  }

  *[Symbol.iterator](): Generator<Vazifa, void, undefined> {
    yield* this.#vazifalar;
  }

  toJSON(): VazifaMalumoti[] {
    return this.#vazifalar.map((v) => v.toJSON());
  }
}
