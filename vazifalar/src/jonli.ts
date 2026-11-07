// jonli.ts — real-time yangilanish (19/#18, Server-Sent Events). FAQAT
// dev'da: VITE_JONLI_URL — .env.development da, production'da yo'q
// (Vite uni undefined bilan almashtiradi va bu kod build'ga tushmaydi).
// Boshqa qurilmada o'zgarish bo'ldi → ro'yxat so'rovi eskirgan deb
// belgilanadi → Query serverdan qayta so'raydi (ma'lumot hodisada emas)
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { JONLI_MANBA } from "./jonli-manba.ts";
import { kalitniOl } from "./saqlash.ts";
import { royxatKaliti } from "./server-sinxron.ts";

export function useJonliYangilanish(): void {
  const mijoz = useQueryClient();
  useEffect(() => {
    const manzil = import.meta.env.VITE_JONLI_URL;
    if (manzil === undefined) {
      return undefined;
    }
    // EventSource o'zi qayta ulanadi (server "retry: 2000" aytgan)
    const manba = new EventSource(`${manzil}/${kalitniOl()}`);
    const ozgardi = (event: MessageEvent<string>) => {
      const malumot: unknown = JSON.parse(event.data);
      const ozimizmi =
        typeof malumot === "object" &&
        malumot !== null &&
        "manba" in malumot &&
        malumot.manba === JONLI_MANBA;
      if (!ozimizmi) {
        void mijoz.invalidateQueries({ queryKey: royxatKaliti });
      }
    };
    manba.addEventListener("ozgardi", ozgardi);
    return () => manba.close();
  }, [mijoz]);
}
