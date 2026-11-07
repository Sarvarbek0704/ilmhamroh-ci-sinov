// useOnlayn.ts — internet bormi (17/#43). App ichidagi
// useSyncExternalStore (#38) alohida funksiyaga chiqdi: endi har qanday
// komponent bir qator bilan oladi. Hook — "use" bilan boshlanadigan
// oddiy funksiya, ichida boshqa hooklar; STATE emas, MANTIQ ulashiladi
import { useSyncExternalStore } from "react";

function obuna(tinglovchi: () => void): () => void {
  addEventListener("online", tinglovchi);
  addEventListener("offline", tinglovchi);
  return () => {
    removeEventListener("online", tinglovchi);
    removeEventListener("offline", tinglovchi);
  };
}

export function useOnlayn(): boolean {
  return useSyncExternalStore(
    obuna,
    () => navigator.onLine,
    () => true, // serverda (SSR) — taxmin; bizda SSR yo'q
  );
}
