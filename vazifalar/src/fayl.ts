// fayl.ts — fayl yaratish va o'qish (Blob, File)

/**
 * Matnni fayl qilib beradi: Blob → vaqtinchalik blob: URL →
 * <a download> bosiladi. Sahifa hech qayerga o'tmaydi.
 * @param nomi foydalanuvchi ko'radigan fayl nomi
 * @param tur MIME turi
 */
export function faylniYuklabBer(
  matn: string,
  nomi: string,
  tur = "application/json",
): void {
  const blob = new Blob([matn], { type: tur });
  const url = URL.createObjectURL(blob);
  const havola = document.createElement("a");
  havola.href = url;
  havola.download = nomi;
  havola.click();
  // blob: URL Blob'ni xotirada ushlab turadi — bo'shatamiz. Keyingi
  // vazifada: yuklash shu paytgacha boshlangan bo'ladi
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// 100 ta vazifa eksporti ~10 KB; 1 MB dan kattasi — boshqa fayl
export const MAKS_FAYL_HAJMI = 1_000_000;

/**
 * O'qishdan OLDIN tekshiruv: nomi va hajmi — tarkibini paketniOqi
 * tekshiradi. MIME turiga ishonmaymiz: ba'zi tizimlarda .json uchun
 * file.type bo'sh keladi. Pick<File, ...>: testda butun File shart
 * emas — nomi va hajmi bor obyekt yetadi
 * @returns xato matni yoki null
 */
export function faylniTekshir(
  fayl: Pick<File, "name" | "size">,
): string | null {
  // 21/#15: CSV ham (Excel'dan saqlangan ro'yxat)
  if (!/\.(json|csv)$/i.test(fayl.name)) {
    return "Faqat .json yoki .csv fayl import qilinadi.";
  }
  if (fayl.size === 0) {
    return "Fayl bo'sh.";
  }
  if (fayl.size > MAKS_FAYL_HAJMI) {
    return "Fayl juda katta: 1 MB dan oshmasin.";
  }
  return null;
}

export type SaqlashNatijasi =
  | { readonly tur: "saqlandi"; readonly nomi: string }
  | { readonly tur: "bekor" };

/** "Joyini tanlab saqlash" bormi: Chrome/Edge (Firefox, Safari — yo'q) */
export const joyTanlashBor = (): boolean =>
  typeof window.showSaveFilePicker === "function";

/**
 * 21/#17: faylni foydalanuvchi tanlagan joyga saqlash (showSaveFilePicker).
 * Progressiv qo'shimcha: oddiy «yuklab olish» (faylniYuklabBer) qoladi,
 * bu — qo'shimcha tugma, faqat API bor brauzerda. Foydalanuvchi bosgan
 * zahoti chaqiriladi (user activation): oldin await bo'lsa — SecurityError.
 * Oyna yopilsa — AbortError ("bekor"); boshqa xato (iframe, ruxsat) —
 * oddiy yuklab berishga tushadi
 */
export async function joyTanlabSaqla(
  matn: string,
  nomi: string,
  tur = "application/json",
): Promise<SaqlashNatijasi> {
  const kengaytma = nomi.slice(nomi.lastIndexOf("."));
  const asosiyTur = tur.split(";")[0] ?? tur;
  try {
    const qayer = await window.showSaveFilePicker?.({
      suggestedName: nomi,
      types: [{ accept: { [asosiyTur]: [kengaytma] } }],
    });
    if (qayer === undefined) {
      throw new TypeError("showSaveFilePicker yo'q");
    }
    const yozuvchi = await qayer.createWritable();
    await yozuvchi.write(new Blob([matn], { type: tur }));
    await yozuvchi.close();
    return { tur: "saqlandi", nomi: qayer.name };
  } catch (xato) {
    if (xato instanceof DOMException && xato.name === "AbortError") {
      return { tur: "bekor" };
    }
    faylniYuklabBer(matn, nomi, tur);
    return { tur: "saqlandi", nomi };
  }
}
