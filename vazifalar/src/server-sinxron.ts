// server-sinxron.ts — «Bahor» mashq serveri bilan sinxron (17/#28).
// 19/#13–#14 dan server holati — TanStack Query keshida: 17–18-qismdagi
// qo'lda yozilgan yuklash kodi (AbortController pulti, "kutilmoqda"
// hisobi, tarmoq holati state'i, har sahifada qayta GET) o'rnida — bitta
// so'rov (queryKey) va uning holati. Kesh sahifalar orasida yashaydi:
// ro'yxat → statistika → ro'yxat — 30 s ichida serverga qayta so'rov yo'q
import {
  onlineManager,
  QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiKlient } from "./api.ts";
import { JONLI_MANBA } from "./jonli-manba.ts";
import { boshlangichVazifalar } from "./holat.ts";
import { eksportMatni } from "./paket.ts";
import { boshlangichHolat, vazifalarReducer } from "./reducer.ts";
import type { VazifaAmali } from "./reducer.ts";
import { kalitniOl, yukla } from "./saqlash.ts";
import { mahalliyOmbor, navbatniYubor } from "./navbat.ts";
import { useIlovaHolati } from "./ilova-holati.ts";
import { OZGARDI, tarqat } from "./sinxron.ts";
import type { TarmoqHolati, VazifaMalumoti } from "./turlar.ts";

type Vazifalar = readonly VazifaMalumoti[];

const sahifaManzili = new URL(location.href);
export const api = apiKlient({
  // .env.production / .env.development — Vite build vaqtida qo'yadi
  asosiyUrl: import.meta.env.VITE_API_URL,
  kalit: kalitniOl(),
  muvaffaqiyatsiz:
    sahifaManzili.searchParams.get("muvaffaqiyatsiz") === "1",
  // 19/#18: dev'da yozuv qaysi tabdan — jonli hodisa o'ziga qaytsa, tab
  // uni taniydi (jonli.ts). Production'da yo'q (VITE_JONLI_URL yo'q)
  ...(import.meta.env.VITE_JONLI_URL === undefined
    ? {}
    : { yozuvSarlavhalari: { "X-Jonli-Manba": JONLI_MANBA } }),
});

// catch'dagi qiymat — unknown: Error bo'lsa xabari, bo'lmasa matni
export function xatoMatni(xato: unknown): string {
  return xato instanceof Error ? xato.message : String(xato);
}

/**
 * Ilovaning yagona QueryClient'i (main.tsx — Provider, loader'lar —
 * to'g'ridan). Kesh qoidalari (19/#14, o'lchandi — natijalar/14-*):
 * - staleTime 30 s: shu vaqt ichida qaytgan sahifa keshdan, so'rovsiz;
 *   undan keyin — keshdan DARHOL ko'rsatiladi va fonda yangilanadi
 * - retry yo'q: v8 dagidek — server javob bermasa, darhol "xato" va
 *   «Qayta urinish» (sukutdagi 3 urinish ~7 s ekranni "yuklanmoqda" da
 *   ushlab turardi)
 * - gcTime — sukut (5 daq): hech kim ishlatmagan kesh shundan keyin o'chadi
 */
export const sorovMijozi = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: false },
    mutations: { retry: false },
  },
});

// Query v5 sahifa ochilganda internetni BOR deb hisoblaydi va faqat
// online/offline hodisalarini tinglaydi. Sahifa internetsiz ochilsa
// (SW keshidan) — so'rov yiqilib "xato" bo'lardi va internet qaytganda
// "online" hodisasi holatni o'zgartirmagani uchun qayta so'ralmasdi
// (e2e topdi: 13/#22 "onlayn: sinxron qaytdi"). Boshlang'ich holat —
// brauzerdan: oflayn bo'lsa so'rov KUTADI va internet qaytishi bilan ketadi
onlineManager.setOnline(navigator.onLine);

/** Kesh kaliti: shu brauzer ro'yxati (server kaliti bilan) */
export const royxatKaliti = ["vazifalar", kalitniOl()] as const;

/** Yangi ro'yxatni boshqa tablarga yuboradi (ro'yxat xabarning o'zida) */
function tablargaYubor(vazifalar: Vazifalar): void {
  tarqat({ tur: OZGARDI, paket: eksportMatni(vazifalar) });
}

/** Keshdagi ro'yxat (yo'q bo'lsa — localStorage, u ham yo'q — namuna) */
function joriyRoyxat(mijoz: QueryClient): Vazifalar {
  return (
    mijoz.getQueryData<Vazifalar>(royxatKaliti) ??
    yukla() ??
    boshlangichVazifalar
  );
}

/**
 * Server ro'yxati. Server kalitni bilmasa (versiya 0) — shu brauzerdagi
 * ro'yxat ketadi (PUT). signal — Query beradi: so'rov kerak bo'lmay
 * qolsa (cancelQueries, komponent yopildi) — bekor qilinadi
 */
async function royxatniYukla(
  mijoz: QueryClient,
  signal: AbortSignal,
): Promise<Vazifalar> {
  let javob;
  try {
    // 21/#29: oflayn navbat — GET'dan OLDIN (aks holda eski server ro'yxati
    // navbatdagi o'zgarishlarni ekrandan "o'chirib" qo'yardi)
    if (mahalliyOmbor.oqi().length > 0) {
      const n = await navbatniYubor(api);
      useIlovaHolati
        .getState()
        .elonQil(
          n.konfliktlar.length > 0
            ? n.konfliktlar.join(" ")
            : `Oflayn o'zgarishlar yuborildi: ${n.yuborildi} ta.`,
        );
    }
    javob = await api.royxat({ signal });
    if (javob.versiya === 0) {
      javob = await api.almashtir(joriyRoyxat(mijoz), { signal });
    }
  } catch (xato) {
    // Ekranda — "xato" (so'rov holati); sababi — konsolda (bekor
    // qilingani — xato emas: o'rniga yangisi ketdi yoki sahifa yopildi)
    if (!signal.aborted) {
      console.warn(`Sinxron bo'lmadi: ${xatoMatni(xato)}`);
    }
    throw xato;
  }
  // Farq bo'lsa — boshqa tablarga ham (ular serverga so'ramaydi)
  if (
    eksportMatni(javob.vazifalar) !== eksportMatni(joriyRoyxat(mijoz))
  ) {
    tablargaYubor(javob.vazifalar);
  }
  return javob.vazifalar;
}

/**
 * Ro'yxat so'rovi — bitta joyda (hook, loader, prefetch shuni oladi).
 * initialData — localStorage'dagi nusxa: sahifa birinchi kadrdayoq
 * ro'yxat bilan (CLS 0, 13/#30), initialDataUpdatedAt 0 — u "eski":
 * Query darhol serverdan yangisini so'raydi
 */
export function royxatSorovi(mijoz: QueryClient = sorovMijozi) {
  return queryOptions({
    queryKey: royxatKaliti,
    queryFn: ({ signal }) => royxatniYukla(mijoz, signal),
    initialData: () => yukla() ?? boshlangichVazifalar,
    initialDataUpdatedAt: 0,
    // Internet qaytdi — eskirgan-eskirmaganidan qat'i nazar solishtirish
    // (v8 dagi "online" hodisasi)
    refetchOnReconnect: "always",
  });
}

/** Ekrandagi aloqa holati — so'rov holatidan (alohida state yo'q) */
function tarmoqHolati(sorov: {
  isError: boolean;
  fetchStatus: "fetching" | "paused" | "idle";
  dataUpdatedAt: number;
}): TarmoqHolati {
  if (sorov.fetchStatus === "fetching" && sorov.dataUpdatedAt === 0) {
    return "yuklanmoqda"; // hali bir marta ham serverdan kelmagan
  }
  if (sorov.isError) {
    return sorov.fetchStatus === "fetching" ? "yuklanmoqda" : "xato";
  }
  return sorov.dataUpdatedAt === 0 ? "yuklanmoqda" : "tayyor";
}

/**
 * Ro'yxat (server tasdiqlagan), aloqa holati va «Qayta urinish».
 * boshlangich — kesh bo'sh bo'lsa (birinchi ochilish, testlar) shu ro'yxat
 */
export function useVazifalar(boshlangich?: Vazifalar) {
  const mijoz = useQueryClient();
  const sorov = useQuery({
    ...royxatSorovi(mijoz),
    ...(boshlangich === undefined ? {} : { initialData: boshlangich }),
  });
  return {
    vazifalar: sorov.data,
    tarmoq: tarmoqHolati(sorov),
    qaytaUrin: () => void sorov.refetch(),
  };
}

/**
 * Server tasdiqlagan amal — keshga (va boshqa tablarga). Updater ENG
 * SO'NGGI keshni oladi (bir vaqtdagi yozuvlar bir-birini yo'qotmaydi)
 */
export function tasdiqniQoy(
  mijoz: QueryClient,
  tasdiq: VazifaAmali,
): void {
  const yangi = mijoz.setQueryData<Vazifalar>(royxatKaliti, (eski) =>
    eski === undefined
      ? eski
      : vazifalarReducer(boshlangichHolat(eski), tasdiq).vazifalar,
  );
  if (yangi !== undefined) {
    tablargaYubor(yangi);
  }
}

/** yozuv natijasi: rad etilsa — e'lon matni */
export type YozuvNatijasi =
  | { readonly ok: true }
  | { readonly ok: false; readonly xabar: string };

const YOZUV_KALITI = ["yozuv"] as const;

/**
 * Yozuv (useMutation, 19/#15): ekrandagi optimistik qatlam — App'ning
 * useOptimistic'i (18/#07); bu yerda — server qismi. Boshlanishida yo'ldagi
 * GET bekor qilinadi (eski ro'yxat tasdiqni bosib ketmasin); tasdiq —
 * keshga; OXIRGI yozuv tugagach — serverdan qayta (invalidateQueries)
 */
export function useYozuv() {
  const mijoz = useQueryClient();
  const mutatsiya = useMutation({
    mutationKey: YOZUV_KALITI,
    mutationFn: async (serverda: () => Promise<VazifaAmali>) => {
      await mijoz.cancelQueries({ queryKey: royxatKaliti });
      return serverda();
    },
    onSuccess: (tasdiq) => tasdiqniQoy(mijoz, tasdiq),
    onSettled: () => {
      // isMutating shu yozuvni ham sanaydi (u hali tugamagan)
      if (mijoz.isMutating({ mutationKey: YOZUV_KALITI }) === 1) {
        void mijoz.invalidateQueries({ queryKey: royxatKaliti });
      }
    },
  });
  return async (
    serverda: () => Promise<VazifaAmali>,
  ): Promise<YozuvNatijasi> => {
    try {
      await mutatsiya.mutateAsync(serverda);
      return { ok: true };
    } catch (xato) {
      return { ok: false, xabar: `Saqlanmadi: ${xatoMatni(xato)}` };
    }
  };
}
