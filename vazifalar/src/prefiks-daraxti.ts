// prefiks-daraxti.ts — Trie: so'zlar harfma-harf, umumiy boshlanishi
// bitta yo'lda. Prefiks bo'yicha qidiruv ro'yxat uzunligiga bog'liq emas

type Tugun = {
  // keyingi harf → tugun
  readonly bolalar: Map<string, Tugun>;
  // 0 — so'z shu yerda tugamaydi; > 0 — tugaydi va shuncha marta
  // qo'shilgan (teg nechta vazifada)
  soni: number;
};

function yangiTugun(): Tugun {
  return { bolalar: new Map(), soni: 0 };
}

export class PrefiksDaraxti {
  readonly #ildiz = yangiTugun();
  #hajmi = 0;

  /** Turli so'zlar soni */
  get hajmi(): number {
    return this.#hajmi;
  }

  /**
   * O(l), l — so'z uzunligi
   * @param soni og'irligi
   */
  qosh(soz: string, soni = 1): void {
    let tugun = this.#ildiz;
    // for...of — kod nuqtalari bo'yicha: emoji ikkiga bo'linmaydi
    for (const harf of soz) {
      let bola = tugun.bolalar.get(harf);
      if (bola === undefined) {
        bola = yangiTugun();
        tugun.bolalar.set(harf, bola);
      }
      tugun = bola;
    }
    if (tugun.soni === 0) {
      this.#hajmi++;
    }
    tugun.soni += soni;
  }

  /** O(p), p — prefiks uzunligi */
  #tugunniTop(prefiks: string): Tugun | undefined {
    let tugun: Tugun | undefined = this.#ildiz;
    for (const harf of prefiks) {
      tugun = tugun.bolalar.get(harf);
      if (tugun === undefined) {
        return undefined;
      }
    }
    return tugun;
  }

  bormi(soz: string): boolean {
    return (this.#tugunniTop(soz)?.soni ?? 0) > 0;
  }

  /**
   * Prefiks bilan boshlanadigan so'zlar: ko'p ishlatilgani oldin, teng
   * bo'lsa — kod birligi tartibida. O(p + s·l + s log s), s — shu
   * prefiksli so'zlar (butun lug'at emas)
   */
  boshlanganlar(prefiks: string, nechta = 5): string[] {
    const boshi = this.#tugunniTop(prefiks);
    if (boshi === undefined) {
      return [];
    }
    const topilgan: Array<{ soz: string; soni: number }> = [];
    // Chuqurlik bo'yicha aylanish (DFS) — rekursiyasiz, stek bilan
    const stek: Array<[Tugun, string]> = [[boshi, prefiks]];
    let element = stek.pop();
    while (element !== undefined) {
      const [tugun, soz] = element;
      if (tugun.soni > 0) {
        topilgan.push({ soz, soni: tugun.soni });
      }
      for (const [harf, bola] of tugun.bolalar) {
        stek.push([bola, soz + harf]);
      }
      element = stek.pop();
    }
    return topilgan
      .sort(
        (a, b) =>
          b.soni - a.soni ||
          (a.soz < b.soz ? -1 : a.soz > b.soz ? 1 : 0),
      )
      .slice(0, nechta)
      .map(({ soz }) => soz);
  }
}
