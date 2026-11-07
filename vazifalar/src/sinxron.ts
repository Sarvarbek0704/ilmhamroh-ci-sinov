// sinxron.ts — bir saytning tablari orasida xabar almashish
import type { SinxronXabar } from "./turlar.ts";

const kanal = new BroadcastChannel("vazifalar");

// Xabar turi: yuboruvchi ham, qabul qiluvchi ham shu nomni ishlatadi.
// const — turi "ozgardi" (literal), string emas
export const OZGARDI = "ozgardi";
// 18/#42: kirish yoki chiqish bo'ldi (AuthKonteksti)
export const AUTH = "auth";

export function tarqat(xabar: SinxronXabar): void {
  kanal.postMessage(xabar);
}

// Boshqa tabda ilovaning eski yoki yangi versiyasi ochiq bo'lishi
// mumkin: kelgan ma'lumot — unknown. Bilmagan xabar jim tashlanadi
function xabarmi(malumot: unknown): malumot is SinxronXabar {
  if (
    typeof malumot !== "object" ||
    malumot === null ||
    !("tur" in malumot)
  ) {
    return false;
  }
  if (malumot.tur === AUTH) {
    return true;
  }
  return (
    malumot.tur === OZGARDI &&
    "paket" in malumot &&
    typeof malumot.paket === "string"
  );
}

/**
 * @returns obunani bekor qiladi (17/#28: effekt cleanup'i shu
 *   funksiyani qaytaradi — komponent yopilsa, tinglovchi qolmaydi)
 */
export function tingla(
  ishlovchi: (xabar: SinxronXabar) => void,
): () => void {
  const tinglovchi = (event: MessageEvent) => {
    if (xabarmi(event.data)) {
      ishlovchi(event.data);
    }
  };
  kanal.addEventListener("message", tinglovchi);
  return () => kanal.removeEventListener("message", tinglovchi);
}
