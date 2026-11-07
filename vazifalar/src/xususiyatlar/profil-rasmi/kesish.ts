// kesish.ts — kesish hisobi (21/#12): sof funksiya, Vitest (node muhiti) bilan.
// Rasm kvadrat maydonni TO'LIQ yopadi ("cover"), zoom — shundan katta,
// x/y — siljish oralig'ining ulushi (-1 chap/yuqori … 1 o'ng/past)

/** Natija rasmi va ko'rinish maydonining tomoni (px) */
export const KESISH_OLCHAMI = 256;

export type Kesish = {
  readonly zoom: number; // 1–3
  readonly x: number; // -1–1
  readonly y: number; // -1–1
};

export type KesishOrni = {
  /** ko'rinishdagi rasm o'lchami va chap-yuqori burchagi (maydonga nisbatan) */
  readonly korinishEni: number;
  readonly korinishBoyi: number;
  readonly chap: number;
  readonly tepa: number;
  /** sudrashda: 1 px ning ulushi uchun to'liq oraliq (px) */
  readonly oraliqX: number;
  readonly oraliqY: number;
  /** asl rasmdan olinadigan kvadrat (asl piksellarda) */
  readonly manba: {
    readonly x: number;
    readonly y: number;
    readonly tomon: number;
  };
};

export function kesishOrni(
  eni: number,
  boyi: number,
  { zoom, x, y }: Kesish,
  maydon = KESISH_OLCHAMI,
): KesishOrni {
  const masshtab = Math.max(maydon / eni, maydon / boyi) * zoom;
  const korinishEni = eni * masshtab;
  const korinishBoyi = boyi * masshtab;
  // Siljish: x = -1 → rasmning chap cheti maydon chetida, 1 → o'ng cheti
  const ortiqX = korinishEni - maydon;
  const ortiqY = korinishBoyi - maydon;
  // + 0: -0 ni 0 ga (o'qishda farqi yo'q, taqqoslashda — bor)
  const chap = -ortiqX / 2 - (x * ortiqX) / 2 + 0;
  const tepa = -ortiqY / 2 - (y * ortiqY) / 2 + 0;
  return {
    korinishEni,
    korinishBoyi,
    chap,
    tepa,
    oraliqX: -ortiqX / 2,
    oraliqY: -ortiqY / 2,
    manba: {
      x: -chap / masshtab + 0,
      y: -tepa / masshtab + 0,
      tomon: maydon / masshtab,
    },
  };
}
