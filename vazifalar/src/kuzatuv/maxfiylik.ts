// kuzatuv/maxfiylik.ts — analitika va xatolar uchun umumiy qoidalar
// (21/#18–#19): nima yuboriladi va nima YO'Q. Sof funksiyalar (Vitest (node muhiti))

/**
 * Sahifa yo'li — umumlashtirilgan: raqam (vazifa id'si) → ":id",
 * so'rov (?filtr=...) va # — tashlanadi. Kim qaysi vazifani ochgani
 * analitikaga kerak emas, "vazifa sahifasi necha marta ochildi" — kerak
 */
export function yolniUmumlashtir(yol: string): string {
  const [faqatYol = "/"] = yol.split(/[?#]/);
  return faqatYol.replace(/\/\d+(?=\/|$)/g, "/:id") || "/";
}

/**
 * Matndan shaxsiy ma'lumotni olib tashlash (xato xabari, stack):
 * email, telefon, uzun raqamlar, so'rov qatori
 */
export function shaxsiyniYashir(matn: string): string {
  return matn
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/\+?\d[\d\s()-]{7,}\d/g, "[raqam]")
    .replace(/\?[^\s)'"]*/g, "?…");
}

/**
 * Foydalanuvchi kuzatishga qarshimi: Global Privacy Control yoki
 * Do Not Track. Bunda analitika yuborilmaydi (xatolar — yuboriladi:
 * ular shaxssiz va ilovani tuzatish uchun)
 */
export function kuzatmaslikSoralgan(nav: {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
}): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}
