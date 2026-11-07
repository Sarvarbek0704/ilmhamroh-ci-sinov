// izoh-holati.ts — vazifa izohlari (21/#08): Zustand store, persist bilan
// localStorage'da ("vazifalar:izohlar"). Server (mashq API) faqat matn,
// bajarildi, teglar maydonlarini qabul qiladi — izoh SHU BRAUZERDA qoladi
// (TEXNIK-QARZ; o'z backend — 25-qism). Kalit — vazifa id'si
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Izoh uzunligi chegarasi: localStorage ~5 MB, ro'yxat ham shu yerda */
export const IZOH_MAKS = 2000;
const IZOHLAR_KALITI = "vazifalar:izohlar";

type IzohHolati = {
  readonly izohlar: Readonly<Record<string, string>>;
  /** bo'sh matn — izoh o'chadi */
  izohniYoz: (id: number, matn: string) => void;
};

export const useIzohlar = create<IzohHolati>()(
  persist(
    (set) => ({
      izohlar: {},
      izohniYoz: (id, matn) =>
        set((h) => {
          const qolgan = Object.fromEntries(
            Object.entries(h.izohlar).filter(([k]) => k !== String(id)),
          );
          const toza = matn.trim().slice(0, IZOH_MAKS);
          return {
            izohlar: toza === "" ? qolgan : { ...qolgan, [id]: toza },
          };
        }),
    }),
    {
      name: IZOHLAR_KALITI,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (h) => ({ izohlar: h.izohlar }),
    },
  ),
);

// Boshqa tabda izoh o'zgardi — qayta o'qiymiz (sozlamalar kabi, 19/#22)
addEventListener("storage", (event) => {
  if (event.key === IZOHLAR_KALITI) {
    void useIzohlar.persist.rehydrate();
  }
});
