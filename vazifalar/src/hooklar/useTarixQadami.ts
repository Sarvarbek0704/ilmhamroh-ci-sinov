// useTarixQadami.ts — ildiz layout'da (Qobiq, 19/#04): har
// navigatsiyada yozuvning qadamini yozadi (tarix-chuqurligi.ts).
// Faqat hujjatlangan API: navigatsiya turi (PUSH/REPLACE/POP) va
// location.key. Effekt — chizilgandan keyin; «Orqaga» qadamni
// bosilganda o'qiydi, u paytda yozib bo'lingan
import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";
import { qadamniYoz } from "../tarix-chuqurligi.ts";

export function useTarixQadami(): void {
  const tur = useNavigationType();
  const { key } = useLocation();
  const oldingi = useRef<string | null>(null);
  useEffect(() => {
    // StrictMode effektni ikki marta ishlatadi — bir marta sanalsin
    if (oldingi.current === key) return;
    qadamniYoz(tur, oldingi.current, key);
    oldingi.current = key;
  }, [tur, key]);
}
