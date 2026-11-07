// kuzatuv/xato-yozuvi.ts — xato yozuvining shakli va yasovchisi (21/#19).
// Sof (import.meta.env'siz) — Vitest (node muhiti) bilan tekshiriladi
import { shaxsiyniYashir, yolniUmumlashtir } from "./maxfiylik.ts";

export type XatoManbai = "window" | "promise" | "react" | "chegara";

export type XatoYozuvi = {
  readonly nom: string;
  readonly xabar: string;
  readonly stack: string;
  readonly manba: XatoManbai;
  readonly yol: string;
  readonly til: string;
  readonly reliz: string;
  readonly iz: readonly string[];
  readonly vaqt: number;
};

/** Har qanday throw qilingan qiymatdan yozuv (sof — Vitest (node muhiti)) */
export function xatoYozuvi(
  xato: unknown,
  manba: XatoManbai,
  muhit: {
    yol: string;
    til: string;
    reliz: string;
    iz: readonly string[];
  },
): XatoYozuvi {
  const e =
    xato instanceof Error
      ? xato
      : new Error(
          typeof xato === "string" ? xato : JSON.stringify(xato),
        );
  return {
    nom: e.name,
    xabar: shaxsiyniYashir(e.message).slice(0, 300),
    stack: shaxsiyniYashir(
      (e.stack ?? "").split("\n").slice(0, 8).join("\n"),
    ),
    manba,
    yol: yolniUmumlashtir(muhit.yol),
    til: muhit.til,
    reliz: muhit.reliz,
    iz: [...muhit.iz],
    vaqt: Date.now(),
  };
}
