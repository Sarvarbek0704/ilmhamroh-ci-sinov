// api.ts — server bilan gaplashadigan yagona joy. 19/#12: tiplangan
// kontrakt — har metod javobni sxema bilan tekshirib, aniq turni
// qaytaradi (unknown emas): chaqiruvchi tekshirishni unuta olmaydi
import type { z } from "zod/mini";
import {
  serverRoyxatiSxemasi,
  sxemaXatosi,
  vazifaSxemasi,
} from "./api-sxema.ts";
import type { ServerRoyxati } from "./api-sxema.ts";
import type { ApiXatosiKodi, VazifaMalumoti } from "./turlar.ts";

const KUTISH_MS = 8000;

/** Har metodning ixtiyoriy oxirgi argumenti */
export type SorovSozlamasi = {
  /** so'rovni bekor qilish uchun */
  signal?: AbortSignal;
  /** necha ms kutiladi (standart 8000) */
  kutish?: number;
};

type IchkiSozlama = SorovSozlamasi & {
  metod?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  tana?: unknown;
  // 19/#18: yozuvlarga qo'shimcha sarlavhalar (dev: X-Jonli-Manba)
  sarlavhalar?: Readonly<Record<string, string>>;
};

// Utility types: so'rov tanalari VazifaMalumoti'dan yasaladi — maydon
// nomi yoki turi o'zgarsa, bu yerlar ham tsc xatosi bilan eslatadi.
/** POST: yangi vazifa — faqat matn (id va holatni server beradi) */
type YangiVazifa = Pick<VazifaMalumoti, "matn">;
/** PATCH: matn va/yoki bajarildi; id o'zgarmaydi */
export type VazifaOzgarishi = Partial<Omit<VazifaMalumoti, "id">>;

export class ApiXatosi extends Error {
  /** HTTP status; tarmoq xatosida 0 */
  readonly holat: number;
  readonly kod: ApiXatosiKodi;

  constructor(
    xabar: string,
    sozlama?: ErrorOptions & { holat?: number; kod?: ApiXatosiKodi },
  ) {
    super(xabar, sozlama);
    this.name = "ApiXatosi";
    this.holat = sozlama?.holat ?? 0;
    this.kod = sozlama?.kod ?? "NOMALUM";
  }
}

function holatKodi(holat: number): ApiXatosiKodi {
  if (holat === 404) return "TOPILMADI";
  if (holat === 400 || holat === 422) return "NOTOGRI";
  if (holat >= 500) return "SERVER";
  return "HTTP";
}

/** @param xato fetch yoki javob tanasi tashlagan qiymat */
function tarmoqXatosi(xato: unknown): ApiXatosi {
  // fetch faqat Error (TypeError, DOMException) tashlaydi
  const name = xato instanceof Error ? xato.name : "";
  if (name === "TimeoutError") {
    return new ApiXatosi("Server javob bermadi.", {
      kod: "VAQT",
      cause: xato,
    });
  }
  if (name === "AbortError") {
    return new ApiXatosi("So'rov bekor qilindi.", {
      kod: "BEKOR",
      cause: xato,
    });
  }
  return new ApiXatosi("Internet aloqasini tekshiring.", {
    kod: "TARMOQ",
    cause: xato,
  });
}

function sorovniTayyorla({
  metod = "GET",
  tana,
  signal,
  kutish = KUTISH_MS,
  sarlavhalar,
}: IchkiSozlama): RequestInit & { headers: Record<string, string> } {
  const vaqtSignali = AbortSignal.timeout(kutish);
  const sorov: RequestInit & { headers: Record<string, string> } = {
    method: metod,
    headers: { Accept: "application/json", ...sarlavhalar },
    signal: signal
      ? AbortSignal.any([signal, vaqtSignali])
      : vaqtSignali,
  };
  if (tana !== undefined) {
    sorov.headers["Content-Type"] = "application/json";
    sorov.body = JSON.stringify(tana);
  }
  return sorov;
}

// 25-qism: vazifalar-api xatoni Problem Details (RFC 9457) bilan yuboradi —
// odam o'qiydigan matn "detail" da; eski mashq API'si — { xato: "..." }
function serverXabari(malumot: unknown): string | undefined {
  if (typeof malumot !== "object" || malumot === null) {
    return undefined;
  }
  if ("detail" in malumot && typeof malumot.detail === "string") {
    return malumot.detail;
  }
  if ("xato" in malumot && typeof malumot.xato === "string") {
    return malumot.xato;
  }
  return undefined;
}

/**
 * Bo'sh javob (DELETE) — null; JSON emas yoki status xato — ApiXatosi.
 * Natija — unknown: tur yozish server javobini tekshirmaydi, shaklini
 * chaqiruvchi tekshiradi (paketniOqi)
 * @param matn javob tanasi
 */
function javobniOqi(javob: Response, matn: string): unknown {
  let malumot: unknown = null;
  if (matn !== "") {
    try {
      malumot = JSON.parse(matn);
    } catch (xato) {
      throw new ApiXatosi("Server JSON qaytarmadi.", {
        holat: javob.status,
        kod: "JAVOB",
        cause: xato,
      });
    }
  }
  if (!javob.ok) {
    const xabar =
      serverXabari(malumot) ?? `Server xatosi: ${javob.status}`;
    throw new ApiXatosi(xabar, {
      holat: javob.status,
      kod: holatKodi(javob.status),
    });
  }
  return malumot;
}

async function sorovYubor(
  fetchFn: typeof fetch,
  url: string,
  sozlama: IchkiSozlama = {},
): Promise<unknown> {
  const sorov = sorovniTayyorla(sozlama);
  let javob;
  let matn;
  try {
    // Oddiy chaqiruv: obyekt.fetch(...) bo'lsa, brauzer this'ni
    // tekshiradi va "Illegal invocation" beradi
    javob = await fetchFn(url, sorov);
    // Tana ham try ichida: aloqa javob o'qilayotganda uzilishi mumkin
    matn = await javob.text();
  } catch (xato) {
    throw tarmoqXatosi(xato);
  }
  return javobniOqi(javob, matn);
}

/**
 * Javob shartnomaga mos kelmasa — ApiXatosi (kod JAVOB): ekranga
 * "Saqlanmadi: ..." bo'lib chiqadi, Zod xatosi cause'da
 */
function shartnoma<T>(sxema: z.ZodMiniType<T>, malumot: unknown): T {
  const natija = sxema.safeParse(malumot);
  if (!natija.success) {
    throw new ApiXatosi(
      `Server javobi kutilgan shaklda emas (${sxemaXatosi(natija.error)}).`,
      { kod: "JAVOB", cause: natija.error },
    );
  }
  return natija.data;
}

export type ApiSozlamalari = {
  /** masalan https://ilmhamroh.uz/api/mashq */
  asosiyUrl: string;
  /** shu brauzer ro'yxatining kaliti */
  kalit: string;
  /** yozuvlar ataylab 500 */
  muvaffaqiyatsiz?: boolean;
  /**
   * Yozuvlarga qo'shimcha sarlavhalar (19/#18 — faqat dev, o'z
   * origin'imizga: begona serverga nostandart sarlavha CORS preflight
   * talab qiladi)
   */
  yozuvSarlavhalari?: Readonly<Record<string, string>>;
  fetch?: typeof fetch;
};

/**
 * fetch — tikuv (seam): testda soxta funksiya beriladi,
 * brauzerda berilmaydi va haqiqiysi ishlaydi
 */
export function apiKlient({
  asosiyUrl,
  kalit,
  muvaffaqiyatsiz = false,
  yozuvSarlavhalari,
  fetch: fetchFn = globalThis.fetch,
}: ApiSozlamalari) {
  const yubor = (url: string, sozlama?: IchkiSozlama) =>
    sorovYubor(fetchFn, url, sozlama);
  // 25-qism: o'z API'miz (/v1) — ro'yxat kalitsiz (foydalanuvchi — 28-qismda auth bilan)
  void kalit;
  const manzil = `${asosiyUrl}/vazifalar`;
  // Sinov rejimi: server har yozuvga ataylab 500 qaytaradi
  const sinovParametri = muvaffaqiyatsiz ? "?muvaffaqiyatsiz=1" : "";

  // Yozuv so'rovlari (o'qishdan farqli) sinov rejimini oladi
  function yoz(
    yol: string,
    metod: NonNullable<IchkiSozlama["metod"]>,
    tana: unknown,
    sozlama?: SorovSozlamasi,
  ) {
    return yubor(manzil + yol + sinovParametri, {
      ...sozlama,
      metod,
      tana,
      ...(yozuvSarlavhalari === undefined
        ? {}
        : { sarlavhalar: yozuvSarlavhalari }),
    });
  }

  // Har metod — so'rov, keyin javob shartnoma bo'yicha
  return {
    royxat: async (sozlama?: SorovSozlamasi): Promise<ServerRoyxati> =>
      // API sahifalaydi (sukut 20) — butun ro'yxat uchun maksimal sahifa
      shartnoma(serverRoyxatiSxemasi, await yubor(`${manzil}?limit=100`, sozlama)),
    qosh: async (
      matn: string,
      sozlama?: SorovSozlamasi,
    ): Promise<VazifaMalumoti> => {
      const tana: YangiVazifa = { matn };
      return shartnoma(
        vazifaSxemasi,
        await yoz("", "POST", tana, sozlama),
      );
    },
    yangila: async (
      id: number,
      ozgarish: VazifaOzgarishi,
      sozlama?: SorovSozlamasi,
    ): Promise<VazifaMalumoti> =>
      shartnoma(
        vazifaSxemasi,
        await yoz(`/${id}`, "PATCH", ozgarish, sozlama),
      ),
    // DELETE javobi bo'sh (204) — tekshiradigan narsa yo'q
    ochir: async (
      id: number,
      sozlama?: SorovSozlamasi,
    ): Promise<void> => {
      await yoz(`/${id}`, "DELETE", undefined, sozlama);
    },
    almashtir: async (
      vazifalar: readonly VazifaMalumoti[],
      sozlama?: SorovSozlamasi,
    ): Promise<ServerRoyxati> =>
      shartnoma(
        serverRoyxatiSxemasi,
        await yoz("", "PUT", { vazifalar }, sozlama),
      ),
  };
}
