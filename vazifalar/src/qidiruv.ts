// qidiruv.ts — vazifalar ichida matn qidirish: normallash va moslar

// O'zbek matnida o' va g' bir necha xil yoziladi: ' (klaviatura),
// ‘ va ’ (U+2018, U+2019), ʻ (U+02BB, rasmiy), ʼ (U+02BC), ba'zan `.
// Qidiruvda hammasi bitta belgi: "o'quv" so'rovi "oʻquv" ni ham topadi
const APOSTROFLAR = new Set(["'", "‘", "’", "ʻ", "ʼ", "`"]);
const BOSHLIQ = /\s/u;

/** Asl matndagi [boshi, oxiri) — oxiri kirmaydi */
export type Oraliq = [boshi: number, oxiri: number];

/**
 * Normal shakl: kichik harf, apostrof bitta, bo'shliqlar ketma-ketligi
 * bitta probel, boshi va oxiri kesilgan. joylar[i] — normal matnning
 * i-belgisi asl matnning qaysi qismidan kelgani (belgilash uchun).
 * Bitta o'tish: O(L), L — matn uzunligi
 */
function normalShakl(
  matn: string,
  joylarKerak: boolean,
): { toza: string; joylar: Oraliq[] } {
  let toza = "";
  const joylar: Oraliq[] = [];
  let oldingiBoshliq = true; // boshidagi bo'shliqlar tashlanadi
  // for...of — kod nuqtalari bo'yicha: emoji ikkiga bo'linmaydi
  let i = 0;
  for (const belgi of matn) {
    const oxiri = i + belgi.length;
    let yangi;
    if (BOSHLIQ.test(belgi)) {
      yangi = oldingiBoshliq ? "" : " ";
      oldingiBoshliq = true;
    } else {
      // "İ" kabi harf kichiklashganda ikki belgi bo'ladi — har biri
      // o'sha bitta asl belgiga bog'lanadi
      yangi = APOSTROFLAR.has(belgi) ? "'" : belgi.toLowerCase();
      oldingiBoshliq = false;
    }
    toza += yangi;
    if (joylarKerak) {
      for (let j = 0; j < yangi.length; j++) {
        joylar.push([i, oxiri]);
      }
    }
    i = oxiri;
  }
  if (toza.endsWith(" ")) {
    toza = toza.slice(0, -1); // oxiridagi bo'shliq (trim)
    joylar.pop();
  }
  return { toza, joylar };
}

/** @returns qidiruv uchun normal shakl */
export function normalla(matn: string): string {
  return normalShakl(matn, false).toza;
}

/**
 * So'rov bir marta normallanadi, har vazifa matni — bir marta:
 * O(n · L), n — vazifalar soni, L — matn uzunligi (≤ 100).
 * Generic: Vazifa ham, oddiy { matn } obyekt ham — qaysi tur kirsa,
 * o'sha tur chiqadi (T faqat "matn: string bor" sharti bilan)
 * @returns tartib saqlanadi; bo'sh so'rov — hammasi
 */
export function qidir<T extends { readonly matn: string }>(
  vazifalar: readonly T[],
  sorov: string,
): T[] {
  const toza = normalla(sorov);
  if (toza === "") {
    return [...vazifalar];
  }
  return vazifalar.filter((v) => normalla(v.matn).includes(toza));
}

/**
 * Asl matndagi mos bo'laklar — ekranda belgilash uchun.
 * Bir-birini qoplamaydi, chapdan o'ngga
 */
export function moslar(matn: string, sorov: string): Oraliq[] {
  const izlanadi = normalla(sorov);
  if (izlanadi === "") {
    return [];
  }
  const { toza, joylar } = normalShakl(matn, true);
  const natija: Oraliq[] = [];
  let joy = toza.indexOf(izlanadi);
  while (joy !== -1) {
    const oxiri = joy + izlanadi.length;
    // joylar toza bilan bir uzunlikda, moslik toza ichida — ikkalasi
    // ham bor. noUncheckedIndexedAccess buni bilmaydi: massiv[i] turi
    // T | undefined. "!" o'rniga tekshiruv — invariant buzilsa,
    // belgilash to'xtaydi, sahifa yiqilmaydi
    const birinchi = joylar[joy];
    const oxirgi = joylar[oxiri - 1];
    if (birinchi === undefined || oxirgi === undefined) {
      break;
    }
    natija.push([birinchi[0], oxirgi[1]]);
    joy = toza.indexOf(izlanadi, oxiri);
  }
  return natija;
}
