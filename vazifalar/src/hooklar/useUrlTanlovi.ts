// useUrlTanlovi.ts — filtr va saralash URL'dan (17/#43). 19/#09: manba —
// React Router (useSearchParams), 17/#38 dagi useSyncExternalStore va
// o'z pushState'imiz o'rniga. Filtr bosilganda — router navigatsiyasi:
// tarixda yozuv (Orqaga ishlaydi), ro'yxat yuqoriga sakramaydi
import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { filtrniOl, parametrniQoy, saralashniOl } from "../marshrut.ts";
import type { Filtr, Saralash } from "../turlar.ts";

export function useUrlTanlovi() {
  const [parametrlar, setParametrlar] = useSearchParams();
  // Yozuv await'dan keyin ham bo'lishi mumkin (vazifa qo'shildi —
  // filtr "hammasi" ga): render paytidagi parametrlar eskirgan bo'ladi.
  // Eng so'nggisi — ref'da (commit'dan keyin yoziladi)
  const songgi = useRef(parametrlar);
  useLayoutEffect(() => {
    songgi.current = parametrlar;
  });

  // URL o'zgarmasa — navigatsiya (va tarix yozuvi) yo'q
  function yoz(nomi: string, qiymat: string, standart: string) {
    const eski = songgi.current;
    const yangi = parametrniQoy(eski, nomi, qiymat, standart);
    if (yangi.toString() !== eski.toString()) {
      songgi.current = yangi;
      // preventScrollReset: filtr — o'sha sahifa, aylantirilgan joy qolsin
      void setParametrlar(yangi, { preventScrollReset: true });
    }
  }

  return {
    filtr: filtrniOl(parametrlar),
    saralash: saralashniOl(parametrlar),
    filtrniYoz: (filtr: Filtr) => yoz("filtr", filtr, "hammasi"),
    saralashniYoz: (saralash: Saralash) =>
      yoz("saralash", saralash, "standart"),
  };
}
