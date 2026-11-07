// flaglar.ts — oddiy feature flag'lar (21/#20): funksiyani deploysiz
// yoqish/o'chirish. Manbalar (kuchlisi birinchi):
//  1. localStorage "vazifalar:flaglar" — shu brauzerda (Sozlamalar →
//     «Tajribaviy imkoniyatlar» yoki manzilda ?flag=nom / ?flag=-nom —
//     sinovchi havola: bir marta ochilsa, yoziladi va manzildan olinadi)
//  2. VITE_FLAGLAR — build paytida ("ai-yordamchi,-teglar-grafigi")
//  3. FLAGLAR dagi standart qiymat
// Qiymat SINXRON o'qiladi (sahifa ochilganda) — birinchi kadrdayoq to'g'ri,
// "miltillash" yo'q. Masofaviy flag (GrowthBook +14.1 KB, OpenFeature +8.6;
// tajriba) — server kerak va javob kelguncha qaysi variantni ko'rsatish
// muammosi bor: 25-qismdan keyin. A/B test (foydalanuvchilarni guruhlash,
// statistika) — bu yerda YO'Q (TEXNIK-QARZ)
import { useSyncExternalStore } from "react";
import { FLAGLAR, flagMatniniOqi, flagmi } from "./flag-royxati.ts";
import type { FlagNomi } from "./flag-royxati.ts";

export type { FlagNomi } from "./flag-royxati.ts";

const KALIT = "vazifalar:flaglar";
const tinglovchilar = new Set<() => void>();

function saqlangan(): Partial<Record<FlagNomi, boolean>> {
  try {
    const j: unknown = JSON.parse(localStorage.getItem(KALIT) ?? "{}");
    if (j === null || typeof j !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(j).filter(
        ([k, v]) => flagmi(k) && typeof v === "boolean",
      ),
    );
  } catch {
    return {};
  }
}

const muhitdan = flagMatniniOqi(import.meta.env.VITE_FLAGLAR ?? "");

/** Joriy qiymat: localStorage > VITE_FLAGLAR > standart */
function flag(nom: FlagNomi): boolean {
  return saqlangan()[nom] ?? muhitdan[nom] ?? FLAGLAR[nom];
}

/** Shu brauzerda o'rnatish (null — standartga qaytarish) */
export function flagniQoy(nom: FlagNomi, qiymat: boolean | null): void {
  const joriy = saqlangan();
  if (qiymat === null) {
    delete joriy[nom];
  } else {
    joriy[nom] = qiymat;
  }
  try {
    localStorage.setItem(KALIT, JSON.stringify(joriy));
  } catch {
    // saqlanmasa — o'zgarish yo'q
  }
  for (const t of tinglovchilar) {
    t();
  }
}

/** Komponentda: flag o'zgarsa (sozlama, boshqa tab) — qayta chiziladi */
export function useFlag(nom: FlagNomi): boolean {
  return useSyncExternalStore(
    (t) => {
      tinglovchilar.add(t);
      return () => tinglovchilar.delete(t);
    },
    () => flag(nom),
  );
}

// ?flag=nom,-boshqa — sinovchi havola: yoziladi va manzildan olib tashlanadi
// (keyingi havola/ulashishda takrorlanmasin). Router'dan OLDIN (main.tsx)
export function manzildagiFlaglar(): void {
  const url = new URL(location.href);
  const matn = url.searchParams.get("flag");
  if (matn === null) {
    return;
  }
  for (const [nom, qiymat] of Object.entries(flagMatniniOqi(matn))) {
    if (flagmi(nom)) {
      flagniQoy(nom, qiymat);
    }
  }
  url.searchParams.delete("flag");
  history.replaceState(history.state, "", url);
}

addEventListener("storage", (event) => {
  if (event.key === KALIT) {
    for (const t of tinglovchilar) {
      t();
    }
  }
});
