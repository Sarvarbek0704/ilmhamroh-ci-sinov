// ilova-holati.ts — mijoz (client) holati: Zustand store (19/#21–#22).
// Server holati — Query'da (server-sinxron.ts); bu yerda — serverga
// tegishli bo'lmagan, lekin BIR NECHTA sahifa (va loader/action) ko'radigan
// narsalar: e'lon (toast) va foydalanuvchi sozlamalari.
// Nega Context emas (o'lchandi/sinaldi, QADAMLAR #20–#22):
//  1. Store React'dan TASHQARIDA ham bor: marshrut action'i (vazifa
//     o'chirildi → ro'yxat sahifasida e'lon) getState() bilan yozadi —
//     Context'ga hook'siz yetib bo'lmaydi
//  2. Selektor: komponent faqat o'zi o'qigan qism o'zgarsa chiziladi
//     (e'lon o'zgarsa — faqat Bildirishnoma, App emas)
//  3. useSyncExternalStore ustida: action (transition) ichida yozilsa ham
//     darhol chiziladi — 18/#05 dagi "optimistik e'lon" endi kerak emas
import { create } from "zustand";
import type { StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Zichlik = "oddiy" | "ixcham";

type ElonQismi = {
  /** ekran o'quvchi va toast uchun matn ("" — yo'q) */
  readonly elon: string;
  /** 3 s dan keyin o'chadi; yangisi taymerni boshidan boshlaydi */
  elonQil: (matn: string) => void;
};

type SozlamaQismi = {
  /** o'chirishdan oldin dialog (13/#09) — o'chirib qo'ysa bo'ladi */
  readonly ochirishdaSora: boolean;
  readonly zichlik: Zichlik;
  setOchirishdaSora: (qiymat: boolean) => void;
  setZichlik: (qiymat: Zichlik) => void;
};

export type IlovaHolati = ElonQismi & SozlamaQismi;

// Slice (19/#22): har qism — o'z funksiyasi, store — ularning yig'indisi.
// Tur parametrlari — persist middleware ichida ishlashi uchun
type Qism<T> = StateCreator<
  IlovaHolati,
  [["zustand/persist", unknown]],
  [],
  T
>;

const ELON_MUDDATI = 3000;
let elonTaymeri: ReturnType<typeof setTimeout> | undefined;

const elonQismi: Qism<ElonQismi> = (set) => ({
  elon: "",
  elonQil(matn) {
    clearTimeout(elonTaymeri);
    set({ elon: matn });
    if (matn !== "") {
      elonTaymeri = setTimeout(() => set({ elon: "" }), ELON_MUDDATI);
    }
  },
});

const sozlamaQismi: Qism<SozlamaQismi> = (set) => ({
  ochirishdaSora: true,
  zichlik: "oddiy",
  setOchirishdaSora: (qiymat) => set({ ochirishdaSora: qiymat }),
  setZichlik: (qiymat) => set({ zichlik: qiymat }),
});

export const SOZLAMALAR_KALITI = "vazifalar:sozlamalar";

/**
 * persist (19/#22): sozlamalar localStorage'da — faqat ular (partialize),
 * e'lon emas. version — shakl o'zgarsa, eski yozuvni ko'chirish (migrate)
 * uchun. Saqlangan qiymat store yaratilganda SINXRON o'qiladi —
 * birinchi kadrdayoq to'g'ri sozlama (SSR'da bunday emas — #22 tuzog'i)
 */
export const useIlovaHolati = create<IlovaHolati>()(
  persist((...a) => ({ ...elonQismi(...a), ...sozlamaQismi(...a) }), {
    name: SOZLAMALAR_KALITI,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: (h) => ({
      ochirishdaSora: h.ochirishdaSora,
      zichlik: h.zichlik,
    }),
  }),
);

// Boshqa tabda sozlama o'zgardi — persist buni o'zi bilmaydi: storage
// hodisasi (faqat BOSHQA tablarda keladi) bilan qayta o'qiymiz
addEventListener("storage", (event) => {
  if (event.key === SOZLAMALAR_KALITI) {
    void useIlovaHolati.persist.rehydrate();
  }
});
