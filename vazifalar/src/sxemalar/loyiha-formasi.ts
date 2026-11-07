// loyiha-formasi.ts — "Qadamlarga bo'lib qo'shish" ustasi (wizard,
// 19/#33) sxemasi. Bitta forma, uch qadam: har qadam o'z maydonlarini
// tekshiradi (trigger), oxirida — butun sxema. Natija — bir nechta
// vazifa: har qadam alohida vazifa, hammasi bitta teg bilan
import { z } from "zod/mini";
import { Vazifa } from "../vazifa.ts";

export const QADAM_ENG_KOP = 10;

// Teg (12/#08 qoidasi): # bilan, harf/raqam/_ va ichida apostrof
const TEG = /^#[\p{L}\p{N}_]+(?:['‘’][\p{L}\p{N}_]+)*$/u;

/** Vazifa matni: "<qadam> <teg>" */
export function vazifaMatni(qadam: string, teg: string): string {
  return `${qadam.trim()} ${teg.trim()}`;
}

/**
 * serverdaBormi — ASYNC tekshiruv (19/#33): serverdagi ro'yxatda shu
 * matnli vazifa bormi. Sxema serverni bilmaydi — funksiya tashqaridan
 */
export function loyihaSxemasi(
  serverdaBormi: (matnlar: readonly string[]) => Promise<string | null>,
) {
  const qadam = z.object({
    matn: z
      .string()
      .check(
        z.trim(),
        z.minLength(1, "Qadamni yozing yoki olib tashlang."),
      ),
  });
  return z
    .object({
      teg: z
        .string()
        .check(
          z.trim(),
          z.regex(TEG, "Teg # bilan boshlansin, bo'shliqsiz: #ta'mir."),
        ),
      qadamlar: z
        .array(qadam)
        .check(
          z.minLength(1, "Kamida bitta qadam."),
          z.maxLength(
            QADAM_ENG_KOP,
            `Ko'pi bilan ${QADAM_ENG_KOP} qadam.`,
          ),
        ),
    })
    .check(
      // Butun forma darajasidagi qoidalar: matn uzunligi va takror (teg
      // bilan birga hisoblanadi) — xato tegishli qadam maydoniga
      z.superRefine(async ({ teg, qadamlar }, ctx) => {
        const matnlar = qadamlar.map((q) => vazifaMatni(q.matn, teg));
        matnlar.forEach((matn, i) => {
          if (matn.length > Vazifa.MAKS_UZUNLIK) {
            ctx.issues.push({
              code: "custom",
              input: matn,
              path: ["qadamlar", i, "matn"],
              message: `Teg bilan ${Vazifa.MAKS_UZUNLIK} belgidan oshdi.`,
            });
          }
          if (matnlar.indexOf(matn) !== i) {
            ctx.issues.push({
              code: "custom",
              input: matn,
              path: ["qadamlar", i, "matn"],
              message: "Bu qadam yuqorida bor.",
            });
          }
        });
        if (ctx.issues.length > 0) {
          return;
        }
        const bor = await serverdaBormi(matnlar);
        if (bor !== null) {
          ctx.issues.push({
            code: "custom",
            input: bor,
            path: ["qadamlar", matnlar.indexOf(bor), "matn"],
            message: `«${bor}» ro'yxatda allaqachon bor.`,
          });
        }
      }),
    );
}

export type LoyihaKirishi = z.input<ReturnType<typeof loyihaSxemasi>>;
export type LoyihaQiymati = z.output<ReturnType<typeof loyihaSxemasi>>;
