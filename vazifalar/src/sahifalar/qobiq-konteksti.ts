// qobiq-konteksti.ts — Qobiq (layout) sahifalarga beradigan narsa
// (19/#02, <Outlet context>). Sahifa uni useQobiq() bilan oladi
import type { RefObject } from "react";
import { useOutletContext } from "react-router";

export type QobiqKonteksti = {
  /** sahifaning asosiy sarlavhasi (skip link fokusni shunga qo'yadi) */
  sarlavhaRef: RefObject<HTMLHeadingElement | null>;
};

/** Outlet konteksti — turi bilan (useOutletContext o'zi unknown beradi) */
export function useQobiq(): QobiqKonteksti {
  return useOutletContext<QobiqKonteksti>();
}
