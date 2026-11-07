// virtual-oraliq.ts — virtualizatsiya hisobi (18/#23), sof funksiyalar:
// React va DOM'siz, Vitest (node muhiti) bilan sinaladi. useOynaVirtual (hook) shu
// yerdan oladi: qaysi qatorlar chiziladi va ustida/ostida qancha bo'sh joy

/**
 * O'rinlar: joylar[i] — i-qatorning boshi (ro'yxat ichida, px),
 * joylar[n] — jami balandlik. O'lchanmagan qatorga — taxmin. O(n)
 */
export function joylarniHisobla(
  kalitlar: readonly number[],
  balandliklar: ReadonlyMap<number, number>,
  taxmin: number,
): Float64Array {
  const joylar = new Float64Array(kalitlar.length + 1);
  let y = 0;
  for (let i = 0; i < kalitlar.length; i++) {
    const kalit = kalitlar[i];
    y +=
      (kalit === undefined ? undefined : balandliklar.get(kalit)) ??
      taxmin;
    joylar[i + 1] = y;
  }
  return joylar;
}

/** y nuqtasini o'z ichiga olgan qator (ikkilik qidiruv, O(log n)) */
function qatorIndeksi(joylar: Float64Array, y: number): number {
  let past = 0;
  let yuqori = joylar.length - 1;
  while (past < yuqori) {
    const orta = (past + yuqori) >> 1;
    if ((joylar[orta + 1] ?? 0) <= y) {
      past = orta + 1;
    } else {
      yuqori = orta;
    }
  }
  return past;
}

export type Oraliq = {
  readonly boshi: number; // birinchi chiziladigan indeks
  readonly oxiri: number; // oxirgisi (kirmaydi)
  readonly yuqori: number; // ustidagi bo'sh joy (px)
  readonly pastki: number; // ostidagi bo'sh joy (px)
};

/**
 * Ko'rinadigan oraliq + zaxira (ekrandan tashqarida ham chiziladigan
 * qatorlar — tez aylantirganda bo'sh joy ko'rinmasin)
 * @param dan ko'rinadigan qismning boshi (ro'yxat ichidagi koordinata)
 * @param gacha oxiri
 */
export function korinadiganOraliq(
  joylar: Float64Array,
  dan: number,
  gacha: number,
  zaxira: number,
): Oraliq {
  const n = joylar.length - 1;
  const jami = joylar[n] ?? 0;
  const boshi = Math.max(0, qatorIndeksi(joylar, dan) - zaxira);
  const oxiri = Math.min(n, qatorIndeksi(joylar, gacha) + 1 + zaxira);
  return {
    boshi,
    oxiri,
    yuqori: joylar[boshi] ?? 0,
    pastki: jami - (joylar[oxiri] ?? jami),
  };
}
