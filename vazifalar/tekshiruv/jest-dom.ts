/// <reference types="@vitest/browser/matchers" />
// jest-dom.ts — 22/#04: jest-dom matcherlari (toBeVisible, toBePressed,
// toHaveAccessibleName …) Vitest'ning expect'iga.
// Nega "@testing-library/jest-dom/vitest" emas: jest-dom 7.0.1 ning
// tur fayli Vitest 4 dagi Assertion<T> shaklini kengaytiradi, Vitest 5
// da u Assertion<R, T> — tsc -b uch xato beradi (TS2428, o'lchandi).
// Matcherlar o'zi ishlaydi (kod bir xil) — ulashni o'zimiz qilamiz.
// 22/#08: TURLAR — yuqoridagi reference: @vitest/browser dagi Vitest'ning
// o'z jest-dom tur nusxasi (Assertion<R, T> ga mos). #04 dagi o'z
// "declare module ... Matchers" imiz Browser Mode qo'shilgach u bilan
// to'qnashdi (TS2320, 16 xato) — endi turlar bitta manbadan
import { expect } from "vitest";
import * as matcherlar from "@testing-library/jest-dom/matchers";

expect.extend(matcherlar);

// jest-dom 7 da bor, Vitest nusxasida hali yo'q matcherlar (#04 dan ishlatiladi)
// T — vitest e'lonidagi bilan bir xil bo'lishi shart (ishlatilmasa ham)
declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<R, T> {
    toBePressed(): R;
    toBePartiallyPressed(): R;
  }
}
