// StatistikaPaneli.tsx — «Batafsil statistika» (ochiladigan panel,
// 18/#01, #03–#04). Uch g'oya bir joyda:
//  - useTransition (#01): ochish — transition. Hisob tayyor bo'lmaguncha
//    React ESKI ekranni (yopiq panel) qoldiradi, tugma yonida
//    "Hisoblanmoqda…" (isPending); keyin panel birdan to'liq ochiladi
//  - Suspense (#03): chegara panel ochilmasdan OLDIN bor (allaqachon
//    ko'rsatilgan) — transition paytida fallback'ga almashmaydi.
//    Fallback faqat transition'siz to'xtashda (masalan, birinchi
//    ochilish transition'siz bo'lsa) ko'rinadi
//  - use() (#04): BatafsilStatistika — keshlangan Promise'ni o'qiydi
// useDeferredValue: ro'yxat o'zgarsa (katak bosildi), eski statistika
// ko'rinib turadi, yangisi fonda hisoblanadi — fallback miltillamaydi.
//  - lazy() (#09): panel kodi (jadval + hisob) — alohida chunk, birinchi
//    ochilishda yuklanadi; tugma ustiga kelinsa yoki fokuslansa — oldindan
//  - <Activity> (#11): yopilganda panel O'CHIRILMAYDI, yashiriladi —
//    ichidagi state (tartib tanlovi) va DOM saqlanadi, qayta ochish darhol
import {
  Activity,
  lazy,
  Suspense,
  useDeferredValue,
  useId,
  useState,
  useTransition,
} from "react";
import { XatoChegarasi } from "../../komponentlar/XatoChegarasi.tsx";
import { Tugma } from "../../ui/Tugma.tsx";
import type { VazifaMalumoti } from "../../turlar.ts";

let yuklandi = false; // modul bir marta kelsa — keyin doim bor

// Modul Promise'i bitta: oldindan yuklash (hover, fokus) va lazy() —
// ikkalasi shuni kutadi. Sahifa ichida qayta urinish FOYDASIZ: brauzer
// muvaffaqiyatsiz import'ni ham eslab qoladi (o'lchandi, Chrome 155: uch
// urinish — tarmoqqa bitta so'rov). Chunk kelmasa — sahifani yangilash
let modul: Promise<typeof import("./BatafsilStatistika.tsx")> | null =
  null;
function modulniOl() {
  modul ??= import("./BatafsilStatistika.tsx").then((m) => {
    yuklandi = true;
    return m;
  });
  return modul;
}

// lazy() — modul darajasida (renderda yaratilsa, har renderda yangi
// komponent: holati yo'qoladi; React Compiler lint'i ham to'xtatadi —
// "static-components", o'lchandi). Faqat default export bilan ishlaydi:
// nomli eksportni { default } ga o'raymiz. Rad etilgan yuklashni lazy
// ESLAB QOLADI — chunk baribir kelmasa, chiqish yo'li sahifani yangilash
const BatafsilStatistika = lazy(() =>
  modulniOl().then((m) => ({ default: m.BatafsilStatistika })),
);

// Oldindan yuklash: xato bu yerda jim — ochilganda chegara ko'rsatadi
function oldindanYukla() {
  modulniOl().catch(() => {});
}

type Props = {
  vazifalar: readonly VazifaMalumoti[];
};

export function StatistikaPaneli({ vazifalar }: Props) {
  const [ochiq, setOchiq] = useState(false);
  // Activity birinchi ochilishdan KEYIN quriladi: yashirin (hidden) holatda
  // boshlansa, React uni fonda baribir chizadi (oldindan render) — lazy
  // chunk va hisob sahifa ochilishida ishlab ketardi
  const [ochilgan, setOchilgan] = useState(false);
  const [kutilmoqda, boshla] = useTransition();
  const kechikkan = useDeferredValue(vazifalar);
  const panelId = useId();
  const sarlavhaId = useId();
  const eskirgan = ochiq && kechikkan !== vazifalar;

  return (
    <section id="batafsil" aria-labelledby={sarlavhaId}>
      {/* Disclosure naqshi (WAI-ARIA APG): sarlavha ichida tugma,
          holat — aria-expanded */}
      <h2 id={sarlavhaId}>
        <button
          type="button"
          id="statistika-tugma"
          aria-expanded={ochiq}
          aria-controls={panelId}
          onClick={() =>
            boshla(() => {
              setOchiq((o) => !o);
              setOchilgan(true);
            })
          }
          onPointerEnter={oldindanYukla}
          onFocus={oldindanYukla}
        >
          Batafsil statistika
        </button>
      </h2>
      <p id="batafsil-holat" role="status">
        {kutilmoqda || eskirgan ? "Hisoblanmoqda…" : ""}
      </p>
      {/* Hisob xatosi (rad etilgan Promise ham use() da throw bo'ladi)
          yoki chunk yuklanmadi (#09) — faqat panel ichida (18/#08) */}
      <XatoChegarasi
        tiklashKaliti={kechikkan}
        fallback={(_xato, qaytaUrin) => (
          <p id="batafsil-xato" role="alert">
            Statistikani yuklab yoki hisoblab bo'lmadi.{" "}
            <Tugma
              onClick={() => {
                // Kod (chunk) kelmagan — lazy xatoni eslab qolgan:
                // sahifani yangilash (qoralama pagehide'da saqlanadi).
                // Kod bor — xato hisobda: chegarani tiklash kifoya
                if (yuklandi) {
                  qaytaUrin();
                } else {
                  location.reload();
                }
              }}
            >
              Qayta urinish
            </Tugma>
          </p>
        )}
      >
        <Suspense
          fallback={
            // 20/#12: skeleton — kelajakdagi jadval shaklida kulrang
            // bloklar (sahifa siljimaydi). animate-kechikib: 300 ms
            // ko'rinmaydi — tez yuklansa miltillamaydi (kechiktirilgan
            // yuklanish ko'rsatkichi); motion-safe: — harakatni kamaytirish
            // so'ralgan bo'lsa, pulsatsiya yo'q
            <div className="animate-kechikib">
              <p id="batafsil-kutish">Statistika tayyorlanmoqda…</p>
              <div aria-hidden="true" className="grid gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-6 rounded-burchak bg-chegara motion-safe:animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <div id={panelId} aria-busy={eskirgan || undefined}>
            {ochilgan && (
              // hidden: ichi display: none, effektlari to'xtaydi,
              // yangilanishlar — eng past ustuvorlikda; state joyida
              <Activity mode={ochiq ? "visible" : "hidden"}>
                <BatafsilStatistika vazifalar={kechikkan} />
              </Activity>
            )}
          </div>
        </Suspense>
      </XatoChegarasi>
    </section>
  );
}
