// navbat.ts — oflayn yozuvlar navbati (21/#29, offline-first). Internet
// yo'q paytda qo'shish, belgilash, matnni o'zgartirish va o'chirish rad
// etilmaydi: ekranda darhol (kesh va localStorage), serverga esa navbatga —
// localStorage "vazifalar:navbat" (sahifa yopilsa ham yo'qolmaydi). Internet
// qaytganda (Query qayta so'raganda — server-sinxron.ts) navbat TARTIB bilan
// yuboriladi, keyin ro'yxat serverdan olinadi (haqiqat manbai — server).
// Konflikt (boshqa qurilma vazifani o'chirgan — 404): o'zgarish tashlanadi,
// foydalanuvchiga aytiladi. Sof mantiq (siqish, yuborish) — Vitest (node muhiti);
// saqlash — parametr (testda xotira, ilovada localStorage)
import type { VazifaMalumoti } from "./turlar.ts";

export type NavbatAmali =
  /** id — mahalliy (vaqtincha) id: server o'zinikini beradi */
  | { readonly tur: "qosh"; readonly id: number; readonly matn: string }
  | {
      readonly tur: "yangila";
      readonly id: number;
      /** xabar uchun — navbatga qo'yilgandagi matn */
      readonly nomi: string;
      readonly maydonlar: {
        readonly bajarildi?: boolean;
        readonly matn?: string;
      };
    }
  | {
      readonly tur: "ochir";
      readonly id: number;
      readonly nomi: string;
    };

export type NavbatOmbori = {
  oqi: () => readonly NavbatAmali[];
  yoz: (royxat: readonly NavbatAmali[]) => void;
};

const KALIT = "vazifalar:navbat";
const tinglovchilar = new Set<() => void>();

function amalmi(x: unknown): x is NavbatAmali {
  if (x === null || typeof x !== "object") {
    return false;
  }
  const a = x as Record<string, unknown>;
  return (
    typeof a["id"] === "number" &&
    (a["tur"] === "qosh" ||
      a["tur"] === "yangila" ||
      a["tur"] === "ochir")
  );
}

/** localStorage ombori (buzuq yozuv — bo'sh navbat) */
export const mahalliyOmbor: NavbatOmbori = {
  oqi() {
    try {
      const x: unknown = JSON.parse(
        localStorage.getItem(KALIT) ?? "[]",
      );
      return Array.isArray(x) ? x.filter(amalmi) : [];
    } catch {
      return [];
    }
  },
  yoz(royxat) {
    try {
      if (royxat.length === 0) {
        localStorage.removeItem(KALIT);
      } else {
        localStorage.setItem(KALIT, JSON.stringify(royxat));
      }
    } catch {
      // xotira to'la/yopiq — navbat shu sahifada ham yo'q
    }
    for (const t of tinglovchilar) {
      t();
    }
  },
};

/**
 * Navbatni qisqartirish: serverga keraksiz so'rov ketmasin.
 *  - ketma-ket "yangila" (bir id) — bittaga birlashadi
 *  - mahalliy qo'shilgan vazifa matni o'zgarsa — "qosh" ning o'ziga
 *  - mahalliy qo'shilgan vazifa o'chirilsa — u bilan bog'liq hammasi yo'q
 *    (server uni hech qachon ko'rmagan)
 *  - serverdagi vazifa o'chirilsa — undan oldingi "yangila"lari keraksiz
 */
export function navbatniSiq(
  royxat: readonly NavbatAmali[],
): NavbatAmali[] {
  let natija: NavbatAmali[] = [];
  for (const kelgan of royxat) {
    let amal = kelgan;
    const qoshilgan = natija.find(
      (a) => a.tur === "qosh" && a.id === amal.id,
    );
    if (amal.tur === "ochir") {
      natija = natija.filter((a) => a.id !== amal.id);
      if (qoshilgan === undefined) {
        natija.push(amal);
      }
      continue;
    }
    if (amal.tur === "yangila") {
      const { matn, bajarildi } = amal.maydonlar;
      if (qoshilgan?.tur === "qosh" && matn !== undefined) {
        natija = natija.map((a) =>
          a === qoshilgan ? { ...qoshilgan, matn } : a,
        );
        if (bajarildi === undefined) {
          continue;
        }
        amal = { ...amal, maydonlar: { bajarildi } };
      }
      const oxirgi = natija.at(-1);
      if (oxirgi?.tur === "yangila" && oxirgi.id === amal.id) {
        natija[natija.length - 1] = {
          ...amal,
          maydonlar: { ...oxirgi.maydonlar, ...amal.maydonlar },
        };
        continue;
      }
    }
    natija.push(amal);
  }
  return natija;
}

export function navbatgaQosh(
  amal: NavbatAmali,
  ombor: NavbatOmbori = mahalliyOmbor,
): void {
  ombor.yoz(navbatniSiq([...ombor.oqi(), amal]));
}

export type NavbatApi = {
  qosh: (matn: string) => Promise<VazifaMalumoti>;
  yangila: (
    id: number,
    maydonlar: { bajarildi?: boolean; matn?: string },
  ) => Promise<VazifaMalumoti>;
  ochir: (id: number) => Promise<void>;
};

export type YuborishNatijasi = {
  readonly yuborildi: number;
  readonly konfliktlar: readonly string[];
};

const kodi = (xato: unknown): unknown =>
  xato !== null && typeof xato === "object" && "kod" in xato
    ? xato.kod
    : undefined;

/**
 * Navbatni tartib bilan yuborish. Har muvaffaqiyatli amaldan keyin u
 * ombordan o'chiriladi (yarmida uzilsa — qayta yuborilmaydi). Tarmoq/server
 * xatosi — to'xtaydi, qolgani navbatda (xato yuqoriga). 404 — konflikt:
 * "yangila" tashlanadi va aytiladi, "ochir" — allaqachon yo'q, jim
 */
export async function navbatniYubor(
  api: NavbatApi,
  ombor: NavbatOmbori = mahalliyOmbor,
): Promise<YuborishNatijasi> {
  const idlar = new Map<number, number>(); // mahalliy → server
  const konfliktlar: string[] = [];
  let yuborildi = 0;
  for (;;) {
    const [amal, ...qolgan] = ombor.oqi();
    if (amal === undefined) {
      break;
    }
    const id = idlar.get(amal.id) ?? amal.id;
    try {
      if (amal.tur === "qosh") {
        const v = await api.qosh(amal.matn);
        idlar.set(amal.id, v.id);
      } else if (amal.tur === "yangila") {
        await api.yangila(id, amal.maydonlar);
      } else {
        await api.ochir(id);
      }
      yuborildi++;
    } catch (xato) {
      if (kodi(xato) !== "TOPILMADI") {
        // Keyingi urinishda xaritalangan id'lar bilan davom etsin
        ombor.yoz(
          [amal, ...qolgan].map((a) => ({
            ...a,
            id: idlar.get(a.id) ?? a.id,
          })),
        );
        throw xato;
      }
      if (amal.tur === "yangila") {
        konfliktlar.push(
          `«${amal.nomi}» boshqa joyda o'chirilgan — o'zgarish qo'llanmadi.`,
        );
      }
    }
    ombor.yoz(
      qolgan.map((a) => ({ ...a, id: idlar.get(a.id) ?? a.id })),
    );
  }
  return { yuborildi, konfliktlar };
}

/** Navbatdagi amallar soni — komponent uchun (useSyncExternalStore) */
export function navbatObunasi(t: () => void): () => void {
  tinglovchilar.add(t);
  const boshqaTab = (event: StorageEvent) => {
    if (event.key === KALIT) {
      t();
    }
  };
  addEventListener("storage", boshqaTab);
  return () => {
    tinglovchilar.delete(t);
    removeEventListener("storage", boshqaTab);
  };
}
