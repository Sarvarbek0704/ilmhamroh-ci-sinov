// useMediaQuery.ts — CSS media so'rovi mos keladimi (17/#44: tayyor
// retsept — usehooks-ts, @uidotdev/usehooks'dagi kabi; kutubxona o'rniga
// bir necha qator). Masalan: useMediaQuery("(prefers-color-scheme: dark)")
import { useSyncExternalStore } from "react";

type Obuna = (tinglovchi: () => void) => () => void;

// subscribe funksiyasi har renderda YANGI bo'lsa, React har safar qayta
// obuna bo'ladi — har so'rovga bitta funksiya, modul darajasida
const obunalar = new Map<string, Obuna>();

function obunaniOl(sorov: string): Obuna {
  let obuna = obunalar.get(sorov);
  if (obuna === undefined) {
    obuna = (tinglovchi) => {
      const royxat = matchMedia(sorov);
      royxat.addEventListener("change", tinglovchi);
      return () => royxat.removeEventListener("change", tinglovchi);
    };
    obunalar.set(sorov, obuna);
  }
  return obuna;
}

export function useMediaQuery(sorov: string): boolean {
  return useSyncExternalStore(
    obunaniOl(sorov),
    () => matchMedia(sorov).matches,
    () => false,
  );
}
