// useOynaVirtual.ts — virtualizatsiya (windowing), o'zimizniki (18/#23).
// Butun sahifa aylanadi (ro'yxat o'z "oynasi"da emas): ko'rinadigan
// qatorlar — oyna (window) scroll'i va ro'yxatning sahifadagi o'rnidan.
// Qator balandligi har xil (uzun matn ikki qatorga o'tadi): chizilgan
// qator o'lchanadi (ref callback), o'lchanmaganiga — taxmin. O'rinlar —
// prefiks yig'indi (10 000 qatorda ~0.1 ms), ko'rinadigan boshi — ikkilik
// qidiruv (virtual-oraliq.ts). TanStack Virtual 3.14.13 bilan taqqoslandi:
// tezlik bir xil, kutubxona +7.4 KB gzip (natijalar/23-*)
import { useCallback, useLayoutEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  joylarniHisobla,
  korinadiganOraliq,
} from "../virtual-oraliq.ts";

type Natija = {
  boshi: number; // birinchi chiziladigan indeks
  oxiri: number; // oxirgisi (kirmaydi)
  yuqori: number; // ustidagi bo'sh joy (px)
  pastki: number; // ostidagi bo'sh joy (px)
  // <li> ga: o'lchaydi (key bo'yicha)
  olchov: (kalit: number) => (element: HTMLElement | null) => void;
  // ro'yxat boshidagi element (bo'sh joy <li>) — sahifadagi o'rni shundan
  boshniBelgila: (element: HTMLElement | null) => void;
};

// Scroll — tashqi manba (useSyncExternalStore, 17/#38). Snapshot — 50 px
// lik qadam: har piksel emas, faqat qadam o'zgarganda qayta chiziladi
const QADAM = 50;
function scrollgaObuna(tinglovchi: () => void) {
  addEventListener("scroll", tinglovchi, { passive: true });
  addEventListener("resize", tinglovchi);
  return () => {
    removeEventListener("scroll", tinglovchi);
    removeEventListener("resize", tinglovchi);
  };
}
const scrollQadami = () =>
  `${Math.floor(scrollY / QADAM)}:${Math.ceil(innerHeight / QADAM)}`;

function ortachasi(
  balandliklar: ReadonlyMap<number, number>,
  taxmin: number,
): number {
  if (balandliklar.size === 0) {
    return taxmin;
  }
  let jami = 0;
  for (const b of balandliklar.values()) {
    jami += b;
  }
  return jami / balandliklar.size;
}

export function useOynaVirtual(
  kalitlar: readonly number[], // har qator kaliti (vazifa id), tartibda
  taxmin: number, // o'lchanmagan qator balandligi
  zaxira: number, // ekrandan tashqarida ham chiziladigan qatorlar
): Natija {
  const [yQadam = 0, hQadam = 0] = useSyncExternalStore(
    scrollgaObuna,
    scrollQadami,
    () => "0:0",
  )
    .split(":")
    .map(Number);
  // O'lchangan balandliklar — state (render ularni o'qiydi: ref bo'lsa,
  // React Compiler lint'i "refs during render" deb to'xtatadi — o'lchandi).
  // O'zgarmas: yangi o'lcham — yangi Map (faqat o'zgarganda)
  const [balandliklar, setBalandliklar] = useState<
    ReadonlyMap<number, number>
  >(() => new Map());
  const [ustida, setUstida] = useState(0); // ro'yxat boshi (sahifada)
  const [bosh, setBosh] = useState<HTMLElement | null>(null);

  // Ro'yxat ustidagi bloklar o'zgarsa — boshi qayta o'lchanadi
  // (ResizeObserver darhol ham bir marta chaqiradi)
  useLayoutEffect(() => {
    if (bosh === null) {
      return undefined;
    }
    const kuzatuvchi = new ResizeObserver(() => {
      setUstida(bosh.getBoundingClientRect().top + scrollY);
    });
    kuzatuvchi.observe(document.body);
    return () => kuzatuvchi.disconnect();
  }, [bosh]);

  // Ref callback: chizilgan qator balandligi; o'zgargan bo'lsa — qayta
  // hisob (commit paytida setState — ruxsat, render emas). Bir commit'dagi
  // o'lchovlar bitta qayta chizishga birlashadi (batching)
  const olchov = useCallback(
    (kalit: number) => (element: HTMLElement | null) => {
      if (element === null) {
        return;
      }
      const b = element.offsetHeight;
      setBalandliklar((eski) =>
        eski.get(kalit) === b ? eski : new Map(eski).set(kalit, b),
      );
    },
    [],
  );

  // Ko'rinadigan oraliq (ro'yxat ichidagi koordinatada): scroll va oyna
  // balandligi snapshot'dan (QADAM aniqligida — zaxira qatorlar yopadi).
  // Hisob — sof funksiyalar (virtual-oraliq.ts, Vitest (node muhiti))
  const dan = yQadam * QADAM - ustida;
  // O'lchanmagan qatorga — o'lchanganlarning o'rtachasi (bo'lmasa —
  // taxmin). Aks holda har yangi o'lchov ro'yxatdan keyingi bloklarni
  // siljitadi: taxmin 49 px, haqiqiy qator 61 px — aylantirilganda
  // «Batafsil statistika» tugmasi qochib ketdi va bosish tegmadi (e2e topdi)
  const { boshi, oxiri, yuqori, pastki } = korinadiganOraliq(
    joylarniHisobla(
      kalitlar,
      balandliklar,
      ortachasi(balandliklar, taxmin),
    ),
    dan,
    dan + (hQadam + 1) * QADAM,
    zaxira,
  );
  return {
    boshi,
    oxiri,
    yuqori,
    pastki,
    olchov,
    boshniBelgila: setBosh,
  };
}
