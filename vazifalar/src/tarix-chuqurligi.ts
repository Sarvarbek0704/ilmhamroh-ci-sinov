// tarix-chuqurligi.ts — «Orqaga» uchun (19/#04): ilova ichida tarixda
// necha qadam bosib kelindi. location.key "default" ("birinchi
// sahifa") yetmaydi: /vazifa/02 → /vazifa/2 almashtirishi (replace)
// yangi kalit beradi va to'g'ridan ochilgan sahifa "ichkaridan
// kelgan"dek ko'rinadi — Orqaga saytdan chiqib ketardi (o'lchandi).
// Brauzer chuqurlikni bermaydi: history.length — boshqa saytlar
// bilan, history.state.idx — router'ning hujjatlanmagan ichki
// maydoni. Shuning uchun o'zimiz sanaymiz: tarix yozuvi
// (location.key) → qadam (ilova ichida orqada nechta yozuv bor).
// sessionStorage — shu tab uchun; sahifa yangilansa ham qoladi

const KALIT = "vazifalar:tarix";

export type TarixXaritasi = Record<string, number>;
// useNavigationType() qiymatlari
type NavigatsiyaTuri = "POP" | "PUSH" | "REPLACE";

function qadam(xarita: TarixXaritasi, kalit: string | null): number {
  // hasOwn — "constructor" kabi meros kalitlar qadam bo'lib qolmasin
  return kalit !== null && Object.hasOwn(xarita, kalit)
    ? (xarita[kalit] ?? 0)
    : 0;
}

// Yangi yozuvning qadami. PUSH — oldingisidan +1; REPLACE — oldingisi
// (yozuv almashdi, chuqurlik o'sha); POP — Orqaga/Oldinga yoki sahifa
// yangilandi: yozib qo'yilgani. Notanish yozuv, birinchi sahifa — 0
export function qadamHisobi(
  xarita: TarixXaritasi,
  tur: NavigatsiyaTuri,
  oldingi: string | null,
  kalit: string,
): number {
  if (tur === "PUSH") return qadam(xarita, oldingi) + 1;
  if (tur === "REPLACE") return qadam(xarita, oldingi);
  return qadam(xarita, kalit);
}

// sessionStorage matni → xarita; buzuq yoki begona qiymat tashlanadi
export function xaritaniOqi(matn: string | null): TarixXaritasi {
  let qiymat: unknown;
  try {
    qiymat = JSON.parse(matn ?? "{}");
  } catch {
    return {};
  }
  if (
    typeof qiymat !== "object" ||
    qiymat === null ||
    Array.isArray(qiymat)
  ) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(qiymat).filter(
      (yozuv): yozuv is [string, number] =>
        Number.isInteger(yozuv[1]) && Number(yozuv[1]) >= 0,
    ),
  );
}

// Xotiradagi nusxa: sessionStorage yopiq bo'lsa ham shu sahifada
let xarita: TarixXaritasi | null = null;

function xaritaniOl(): TarixXaritasi {
  if (xarita === null) {
    try {
      xarita = xaritaniOqi(sessionStorage.getItem(KALIT));
    } catch {
      xarita = {};
    }
  }
  return xarita;
}

// Ildiz layout'dan (useTarixQadami) — har navigatsiyadan keyin
export function qadamniYoz(
  tur: NavigatsiyaTuri,
  oldingi: string | null,
  kalit: string,
): void {
  const joriy = xaritaniOl();
  joriy[kalit] = qadamHisobi(joriy, tur, oldingi, kalit);
  try {
    sessionStorage.setItem(KALIT, JSON.stringify(joriy));
  } catch {
    // Yozilmadi (xotira yopiq/to'la) — xotiradagi nusxa yetadi
  }
}

// 0 — orqada ilovaning yozuvi yo'q: navigate(-1) saytdan chiqarardi
export function joriyQadam(kalit: string): number {
  return qadam(xaritaniOl(), kalit);
}
