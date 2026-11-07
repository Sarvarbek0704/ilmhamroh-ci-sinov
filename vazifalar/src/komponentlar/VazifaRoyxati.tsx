// VazifaRoyxati.tsx — ro'yxat qatorlari (17/#09). <ul id="royxat"> — App'da.
// 18/#23: `VIRTUAL_CHEGARA` dan ko'p qator bo'lsa — virtualizatsiya (windowing):
// DOM'da faqat ekrandagi qatorlar (+ zaxira), qolgani — bo'sh joy. Kam
// bo'lsa — hammasi (Ctrl+F, ekran o'quvchining ro'yxat bo'ylab yurishi,
// chop etish — hammasi to'liq ishlaydi; e2e ham shu holatda)
import { memo, useMemo, useState } from "react";
import { VazifaQatori } from "./VazifaQatori.tsx";
import { useOynaVirtual } from "../hooklar/useOynaVirtual.ts";
import type { VazifaMalumoti } from "../turlar.ts";

/** Shundan ko'p bo'lsa — faqat ko'rinadigan qatorlar chiziladi */
const VIRTUAL_CHEGARA = 200;
// Qator balandligi taxmini (px): haqiqiysi chizilgach o'lchanadi — uzun
// matn ikki qatorga o'tsa ham to'g'ri. Zaxira — ekrandan tashqaridagi
// qatorlar (tez aylantirganda bo'sh joy ko'rinmasin)
const TAXMINIY_BALANDLIK = 61; // 2.75rem tugma + 2 × 0.5rem + 1px chegara
const ZAXIRA = 8;

type Props = {
  vazifalar: readonly VazifaMalumoti[];
  sorov: string;
  tahrirId: number | null;
};

// memo (18/#02): props o'sha bo'lsa (Object.is), qayta chizilmaydi.
// useDeferredValue shusiz ishlamaydi: qidiruvning shoshilinch renderida
// App qayta chiziladi, lekin vazifalar (useMemo) va sorov (kechiktirilgan)
// — eski, demak 10 000 qator tegilmaydi. Batafsil o'lchov — 18/#18–#20
export const VazifaRoyxati = memo(function VazifaRoyxati(props: Props) {
  // Ikki xil komponent: hooklar shart ichida chaqirilmaydi (17/#25)
  return props.vazifalar.length > VIRTUAL_CHEGARA ? (
    <VirtualRoyxat {...props} />
  ) : (
    <ToliqRoyxat {...props} />
  );
});

function ToliqRoyxat({ vazifalar, sorov, tahrirId }: Props) {
  // key — vazifa id: barqaror va takrorlanmaydi. Tartib o'zgarsa
  // (saralash, bajarilgan pastga tushdi) React <li> ni yangidan
  // yasamaydi, joyini almashtiradi — fokus va yozilgan matn saqlanadi
  // 20/#25: ochilishdagi qatorlar animatsiyasiz — faqat keyin
  // qo'shilganlari "yangi" (kirish animatsiyasi). useState initializer —
  // bir marta, birinchi chizishda (effekt va ref'siz)
  const [boshlangich] = useState(
    () => new Set(vazifalar.map((v) => v.id)),
  );
  return vazifalar.map((vazifa) => (
    <VazifaQatori
      key={vazifa.id}
      vazifa={vazifa}
      sorov={sorov}
      tahrirda={vazifa.id === tahrirId}
      yangi={!boshlangich.has(vazifa.id)}
    />
  ));
}

// Virtual ro'yxat (useOynaVirtual — o'zimizniki; TanStack Virtual bilan
// taqqoslandi: tezlik bir xil, kutubxona +7.4 KB gzip — natijalar/23-*).
// Ko'rinmaydigan qismlar o'rnida — bo'sh <li> (aria-hidden)
function VirtualRoyxat({ vazifalar, sorov, tahrirId }: Props) {
  const kalitlar = useMemo(
    () => vazifalar.map((v) => v.id),
    [vazifalar],
  );
  // Destrukturizatsiya shart: boshniBelgila ref prop'ga beriladi va
  // React Compiler lint'i butun obyektni "ref" deb biladi — yuqori
  // ni render'da o'qish "Cannot access refs during render" (o'lchandi)
  const { boshi, oxiri, yuqori, pastki, olchov, boshniBelgila } =
    useOynaVirtual(kalitlar, TAXMINIY_BALANDLIK, ZAXIRA);
  return (
    <>
      <li
        ref={boshniBelgila}
        className="joy"
        aria-hidden="true"
        style={{ height: yuqori }}
      />
      {vazifalar.slice(boshi, oxiri).map((vazifa, i) => (
        <VazifaQatori
          key={vazifa.id}
          vazifa={vazifa}
          sorov={sorov}
          tahrirda={vazifa.id === tahrirId}
          joy={boshi + i}
          jami={vazifalar.length}
          olchov={olchov}
        />
      ))}
      <li
        className="joy"
        aria-hidden="true"
        style={{ height: pastki }}
      />
    </>
  );
}
