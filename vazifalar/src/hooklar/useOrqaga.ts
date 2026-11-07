// useOrqaga.ts — «Orqaga» (19/#04, #32 da hook'ga chiqarildi): ilova
// ichidan kelingan bo'lsa — tarixda bir qadam, havola bilan
// to'g'ridan ochilgan bo'lsa — zaxira manzilga (replace). Qadam —
// ilova ichidagi tarix chuqurligi (tarix-chuqurligi.ts): 0 — orqada
// ilovaning yozuvi yo'q
import { useLocation, useNavigate } from "react-router";
import { joriyQadam } from "../tarix-chuqurligi.ts";

export function useOrqaga(zaxira: string): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();
  return () => {
    if (joriyQadam(key) === 0) {
      void navigate(zaxira, { replace: true });
    } else {
      void navigate(-1);
    }
  };
}
