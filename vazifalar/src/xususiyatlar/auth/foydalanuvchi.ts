// foydalanuvchi.ts — kirishning sof qismi (18/#42): ism tekshiruvi va
// saqlangan matnni o'qish. React'siz — Vitest (node muhiti) bilan sinaladi.
// 28-qism: kimlik — serverda (sessiya, HttpOnly cookie); localStorage'dagi
// ism — faqat ko'rsatish uchun nusxa (AuthKonteksti uni /auth/men bilan
// tekshiradi). Bu yerdagi maqsad — UI: holat Context'da, himoyalangan qism,
// hamma tablarda chiqish
import type { Foydalanuvchi } from "../../turlar.ts";

const ISM_ENG_KAM = 2;
export const ISM_ENG_KOP = 40;

/** @returns xato matni yoki null (ism to'g'ri) */
export function ismXatosi(ism: string): string | null {
  const toza = ism.trim();
  if (toza.length < ISM_ENG_KAM) {
    return `Ismingizni yozing (kamida ${ISM_ENG_KAM} harf).`;
  }
  if (toza.length > ISM_ENG_KOP) {
    return `Ism juda uzun (ko'pi bilan ${ISM_ENG_KOP} harf).`;
  }
  return null;
}

/**
 * localStorage'dagi matn — tashqi ma'lumot (unknown): boshqa tab, eski
 * versiya yoki DevTools'da qo'lda yozilgan bo'lishi mumkin. Buzuq — null
 * (kirilmagan deb hisoblanadi, ilova yiqilmaydi)
 */
export function foydalanuvchiniOqi(
  matn: string | null,
): Foydalanuvchi | null {
  if (matn === null) {
    return null;
  }
  let xom: unknown;
  try {
    xom = JSON.parse(matn);
  } catch {
    return null;
  }
  if (
    typeof xom !== "object" ||
    xom === null ||
    !("ism" in xom) ||
    typeof xom.ism !== "string" ||
    ismXatosi(xom.ism) !== null
  ) {
    return null;
  }
  return { ism: xom.ism.trim() };
}

/**
 * Kirgandan keyin qayerga (19/#07): "/kirish?keyin=/vazifa/2" dagi
 * qiymat. Faqat SHU ilova ichidagi yo'l: "/" bilan boshlanadi, lekin
 * "//" yoki "/\" emas — aks holda "?keyin=//yomon.example" foydalanuvchini
 * begona saytga olib ketardi (open redirect). Yo'q yoki shubhali — "/"
 */
export function keyingiManzil(keyin: string | null): string {
  if (
    keyin === null ||
    !keyin.startsWith("/") ||
    /^\/[/\\]/.test(keyin)
  ) {
    return "/";
  }
  return keyin;
}
