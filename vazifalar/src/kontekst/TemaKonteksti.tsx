// TemaKonteksti.tsx — tema tanlovi butun ilovaga (17/#41–#42). Tanlov
// va uni o'zgartiruvchi funksiya — Context orqali: TemaTanlov (va
// kelajakda tema kerak bo'lgan har qanday komponent) props zanjirisiz
// oladi. <html data-tema> va panel rangi — React'dan tashqaridagi DOM,
// effekt bilan sinxronlanadi
import { createContext, use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMediaQuery } from "../hooklar/useMediaQuery.ts";
import { temaniSaqla } from "../saqlash.ts";
import {
  saqlanganTanlov,
  TIZIM_QORONGI,
  temaniQolla,
} from "../tema-tanlash.ts";
import type { Tema } from "../tema-tanlash.ts";

type TemaQiymati = {
  tanlov: Tema;
  tanla: (yangi: Tema) => void;
};

// null — Provider yo'q (dasturchi xatosi): useTema() aniq xato beradi
const TemaKonteksti = createContext<TemaQiymati | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  // Funksiya — localStorage faqat birinchi renderda o'qiladi
  const [tanlov, setTanlov] = useState(saqlanganTanlov);
  // Tizim qorong'imi — brauzer biladi (matchMedia): tashqi manba
  const tizimQorongi = useMediaQuery(TIZIM_QORONGI); // custom hook (#44)

  // Tanlov yoki tizim o'zgarsa — <html> va panel rangi ergashadi. v6 da
  // matchMedia tinglovchisi modulda qo'lda ulanardi (temaniUla)
  useEffect(() => {
    temaniQolla(tanlov, tizimQorongi);
  }, [tanlov, tizimQorongi]);

  function tanla(yangi: Tema) {
    setTanlov(yangi);
    temaniSaqla(yangi); // xotira — hodisada (keyingi ochilishga)
  }

  // React 19: <Context value> — .Provider yozish shart emas. Qiymat har
  // renderda yangi obyekt — iste'molchilar ham qayta chiziladi; bizda
  // bitta kichik iste'molchi, o'lchash va memo — 18-qism
  return (
    <TemaKonteksti value={{ tanlov, tanla }}>{children}</TemaKonteksti>
  );
}

/** Tema konteksti. Provider ichida bo'lmasa — aniq xato (null emas) */
export function useTema(): TemaQiymati {
  // use() — useContext kabi, lekin shart ichida ham chaqirsa bo'ladi
  const qiymat = use(TemaKonteksti);
  if (qiymat === null) {
    throw new Error("useTema() — <TemaProvider> ichida chaqirilsin");
  }
  return qiymat;
}
