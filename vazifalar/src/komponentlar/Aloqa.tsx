// Aloqa.tsx — server bilan aloqa holati va «Qayta urinish»
import type { TarmoqHolati } from "../turlar.ts";
import { useSyncExternalStore } from "react";
import { Tugma } from "../ui/Tugma.tsx";
import { mahalliyOmbor, navbatObunasi } from "../navbat.ts";

// satisfies: har holatga matn bormi — tekshiradi, lekin tur
// kengaytirilmaydi (aloqaMatnlari.tayyor turi — "" literal)
const aloqaMatnlari = Object.freeze({
  yuklanmoqda: "Server bilan solishtirilmoqda…",
  tayyor: "",
  xato: "Serverga ulanib bo'lmadi. Ro'yxat — shu brauzerdagi nusxa.",
  oflayn: "Internet yo'q. Ro'yxat — shu brauzerdagi nusxa.",
} satisfies Record<TarmoqHolati, string>);

type Props = {
  tarmoq: TarmoqHolati;
  onQaytaUrin: () => void;
};

export function Aloqa({ tarmoq, onQaytaUrin }: Props) {
  // 21/#29: navbatdagi (hali serverga ketmagan) o'zgarishlar soni
  const navbatda = useSyncExternalStore(
    navbatObunasi,
    () => mahalliyOmbor.oqi().length,
  );
  return (
    <>
      {/* role="status": matn o'zgarsa, ekran o'quvchi o'qib beradi.
          React matnni faqat O'ZGARGANDA yozadi — v6 dagi matnniYoz()
          tekshiruvi (bir xil matn qayta o'qilmasin) endi kerak emas */}
      <p id="aloqa" role="status">
        {aloqaMatnlari[tarmoq]}
      </p>
      <Tugma
        id="qayta-tugma"
        hidden={tarmoq !== "xato"}
        onClick={onQaytaUrin}
      >
        Qayta urinish
      </Tugma>
      <p id="navbat" className="izoh" hidden={navbatda === 0}>
        {`Navbatda: ${navbatda} ta o'zgarish — internet qaytganda yuboriladi.`}
      </p>
    </>
  );
}
