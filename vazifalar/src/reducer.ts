// reducer.ts — vazifalar holati qanday o'zgaradi: bitta sof funksiya
// (17/#39). Har o'zgarish — "amal" (nima bo'ldi), reducer — (holat, amal)
// → yangi holat. React'siz: Vitest (node muhiti) bilan to'g'ridan-to'g'ri sinaladi.
// O'zgartirishlarning o'zi — amallar.ts (14-darsdagi sof funksiyalar)
import { almashtir, matnniOzgartir, ochir, qosh } from "./amallar.ts";
import { eksportMatni } from "./paket.ts";
import type { VazifaMalumoti } from "./turlar.ts";

export type VazifalarHolati = {
  readonly vazifalar: readonly VazifaMalumoti[];
  // null — hech narsa tahrirlanmayapti
  readonly tahrirId: number | null;
};

// Discriminated union: tur — nima bo'lgani (o'tgan zamon); switch'dagi
// never tekshiruvi yangi amal unutilsa tsc xatosi beradi
export type VazifaAmali =
  | { readonly tur: "qoshildi"; readonly matn: string }
  | { readonly tur: "almashtirildi"; readonly id: number }
  | { readonly tur: "ochirildi"; readonly id: number }
  | {
      readonly tur: "matnOzgardi";
      readonly id: number;
      readonly matn: string;
    }
  // Server tasdiqlagan bitta vazifa (18/#07): shu id bo'lsa — almashadi,
  // bo'lmasa — oxiriga (yangi vazifa server bergan id bilan)
  | { readonly tur: "serverdanKeldi"; readonly vazifa: VazifaMalumoti }
  // Butun ro'yxat keldi: server, boshqa tab, import
  | {
      readonly tur: "royxatKeldi";
      readonly vazifalar: readonly VazifaMalumoti[];
    }
  | { readonly tur: "tahrirBoshlandi"; readonly id: number }
  | { readonly tur: "tahrirYopildi" };

/** useReducer'ning uchinchi argumenti — boshlang'ich holat bir marta */
export function boshlangichHolat(
  vazifalar: readonly VazifaMalumoti[],
): VazifalarHolati {
  return { vazifalar, tahrirId: null };
}

export function vazifalarReducer(
  holat: VazifalarHolati,
  amal: VazifaAmali,
): VazifalarHolati {
  switch (amal.tur) {
    case "qoshildi":
      return { ...holat, vazifalar: qosh(holat.vazifalar, amal.matn) };
    case "almashtirildi":
      return {
        vazifalar: almashtir(holat.vazifalar, amal.id),
        tahrirId: null,
      };
    case "ochirildi":
      return {
        vazifalar: ochir(holat.vazifalar, amal.id),
        tahrirId: null,
      };
    case "matnOzgardi":
      return {
        vazifalar: matnniOzgartir(holat.vazifalar, amal.id, amal.matn),
        tahrirId: null,
      };
    case "serverdanKeldi": {
      const { vazifa } = amal;
      const bor = holat.vazifalar.some((v) => v.id === vazifa.id);
      return {
        ...holat,
        vazifalar: bor
          ? holat.vazifalar.map((v) =>
              v.id === vazifa.id ? vazifa : v,
            )
          : [...holat.vazifalar, vazifa],
      };
    }
    case "royxatKeldi": {
      // Farq bo'lmasa — o'sha holat: React qayta chizmaydi
      const bir =
        eksportMatni(holat.vazifalar) === eksportMatni(amal.vazifalar);
      // Tahrirdagi vazifani server yoki boshqa tab o'chirgan bo'lsa-chi
      const tahrirId =
        holat.tahrirId !== null &&
        amal.vazifalar.some((v) => v.id === holat.tahrirId)
          ? holat.tahrirId
          : null;
      if (bir && tahrirId === holat.tahrirId) {
        return holat;
      }
      return {
        vazifalar: bir ? holat.vazifalar : amal.vazifalar,
        tahrirId,
      };
    }
    case "tahrirBoshlandi":
      return { ...holat, tahrirId: amal.id };
    case "tahrirYopildi":
      return holat.tahrirId === null
        ? holat
        : { ...holat, tahrirId: null };
    default: {
      // Bu yerga faqat tsc ko'rmagan qiymat keladi (masalan, JS'dan)
      const qolmadi: never = amal;
      throw new TypeError(`Noma'lum amal: ${JSON.stringify(qolmadi)}`);
    }
  }
}
