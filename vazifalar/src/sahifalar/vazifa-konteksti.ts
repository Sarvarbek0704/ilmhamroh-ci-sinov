// vazifa-konteksti.ts — VazifaSahifasi o'z bo'limlariga beradigan narsa
// (19/#03): Qobiq kontekstiga qo'shimcha — shu sahifadagi vazifa.
// Ichma-ich Outlet konteksti ota kontekstni almashtiradi (birlashtirmaydi)
// — shuning uchun sarlavhaRef ham shu yerda
import { useOutletContext } from "react-router";
import type { VazifaMalumoti } from "../turlar.ts";
import type { QobiqKonteksti } from "./qobiq-konteksti.ts";

export type VazifaKonteksti = QobiqKonteksti & {
  vazifa: VazifaMalumoti;
};

export function useVazifa(): VazifaKonteksti {
  return useOutletContext<VazifaKonteksti>();
}
