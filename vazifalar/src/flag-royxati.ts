// flag-royxati.ts — flaglar ro'yxati va "a,-b" matnini o'qish (21/#20).
// Sof (import.meta.env'siz) — Vitest (node muhiti); ishlatish — flaglar.ts

export const FLAGLAR = {
  /** 21/#04: statistikada teglar grafigi */
  "teglar-grafigi": true,
  /** 21/#26: AI yordamchi (oqimli javob) — faqat VITE_AI_URL bor build'da */
  "ai-yordamchi": false,
} as const satisfies Record<string, boolean>;

export type FlagNomi = keyof typeof FLAGLAR;

export function flagmi(nom: string): nom is FlagNomi {
  return Object.hasOwn(FLAGLAR, nom);
}

/** "a,-b" → { a: true, b: false } (faqat ma'lum flaglar) */
export function flagMatniniOqi(
  matn: string,
): Partial<Record<FlagNomi, boolean>> {
  const natija: Partial<Record<FlagNomi, boolean>> = {};
  for (const bolak of matn.split(",")) {
    const toza = bolak.trim();
    const nom = toza.replace(/^-/, "");
    if (flagmi(nom)) {
      natija[nom] = !toza.startsWith("-");
    }
  }
  return natija;
}
