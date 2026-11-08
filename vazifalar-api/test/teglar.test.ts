// teglar.test.ts — 34 #19 (K-11) regressiyasi: teglarda uch xil apostrof (' ‘ ’) — telefon klaviaturasi ’ (U+2019) beradi.
//   Voqea: "apostroflarni bir xillashtirish" refaktori xaritada ’ ni unutdi → shunday tegli vazifasi bor foydalanuvchida ro'yxat 500 (TypeError).
//   Testlar faqat ' bilan yozilgan edi — CI yashil, production'da faqat ba'zi foydalanuvchilarda xato. Kanon qarori: teglar frontend bilan bir xil (o'zgartirilmaydi).
import { test } from "vitest";
import assert from "node:assert/strict";
import { teglariniOl } from "../src/vazifalar/vazifa.ts";

test("uch xil apostrofli teglar — xatosiz, frontend qoidasidagidek (normallashtirilmaydi)", () => {
  assert.deepEqual(teglariniOl("Kitob #o'qish, #o‘qish va #o’qish"), ["o'qish", "o‘qish", "o’qish"]);
  assert.deepEqual(teglariniOl("#O’QISH #o’qish"), ["o’qish"]);
});
