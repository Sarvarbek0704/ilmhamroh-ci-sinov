// qator-amallari.ts — ro'yxat qatorlari hodisalari Context orqali
// (17/#41). #11–#39 da QatorAmallari obyekti props bilan uch qavat
// pastga tushardi: App → VazifaRoyxati → VazifaQatori → OddiyQator.
// O'rtadagi ikkitasiga u kerak emas edi (props drilling) — endi qator
// o'zi oladi
import { createContext, use } from "react";
import type { QatorAmallari } from "../turlar.ts";

export const QatorAmallariKonteksti =
  createContext<QatorAmallari | null>(null);

export function useQatorAmallari(): QatorAmallari {
  const amallar = use(QatorAmallariKonteksti);
  if (amallar === null) {
    throw new Error(
      "useQatorAmallari() — <QatorAmallariKonteksti value> ichida",
    );
  }
  return amallar;
}
