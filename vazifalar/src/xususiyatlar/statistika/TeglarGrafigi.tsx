// TeglarGrafigi.tsx — teglar bo'yicha bajarilgan/qolgan (21/#04): o'z SVG
// grafigimiz. Recharts 3.10.1 o'lchandi va kanonga KIRMADI
// (natijalar/tajriba/04-recharts/): shu bitta grafik uchun +103.4 KB gzip
// (kech chunk) va @reduxjs/toolkit turlari bizning tsconfig'da
// (exactOptionalPropertyTypes) 12 ta tsc xatosi — skipLibCheck'siz yo'q.
// Bu yerda: gorizontal ustunlar, har qator — bitta teg; uzunlik — jami.
// Matn muqobili — TeglarJadvali (o'sha raqamlar): grafik ko'z uchun, ekran
// o'quvchi jadvalni o'qiydi (svg aria-hidden)
import type { TegHisobi } from "./batafsil-statistika.ts";

type Props = {
  teglar: readonly TegHisobi[];
};

/** Grafikda eng ko'p 8 ta teg (jadvaldagi tartibda) */
const ENG_KOPI = 8;
const QATOR = 28; // bitta ustun balandligi + oraliq (px, viewBox birligi)
const YORLIQ = 96; // chapdagi teg nomi uchun joy
const ENI = 360;

export function TeglarGrafigi({ teglar }: Props) {
  const qatorlar = teglar.slice(0, ENG_KOPI);
  const engKatta = Math.max(1, ...qatorlar.map((t) => t.jami));
  const masshtab = (ENI - YORLIQ - 32) / engKatta;
  const balandlik = qatorlar.length * QATOR;
  return (
    <figure id="teglar-grafigi">
      <svg
        viewBox={`0 0 ${ENI} ${balandlik}`}
        aria-hidden="true"
        focusable="false"
      >
        {qatorlar.map((t, i) => {
          const y = i * QATOR;
          const bajarildi = t.bajarildi * masshtab;
          const qolgan = (t.jami - t.bajarildi) * masshtab;
          return (
            <g key={t.teg} transform={`translate(0 ${y})`}>
              <text
                x={YORLIQ - 6}
                y={QATOR / 2}
                className="grafik-yorliq"
              >
                {t.teg}
              </text>
              <rect
                x={YORLIQ}
                y={4}
                width={bajarildi}
                height={QATOR - 8}
                className="grafik-bajarildi"
              />
              <rect
                x={YORLIQ + bajarildi}
                y={4}
                width={qolgan}
                height={QATOR - 8}
                className="grafik-qolgan"
              />
              <text
                x={YORLIQ + bajarildi + qolgan + 4}
                y={QATOR / 2}
                className="grafik-son"
              >
                {`${t.bajarildi}/${t.jami}`}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <span className="belgi-bajarildi" /> bajarildi,{" "}
        <span className="belgi-qolgan" /> qolgan (son — bajarildi/jami)
      </figcaption>
    </figure>
  );
}
