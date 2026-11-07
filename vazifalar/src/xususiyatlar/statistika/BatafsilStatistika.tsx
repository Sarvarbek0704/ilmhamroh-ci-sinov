// BatafsilStatistika.tsx — teglar jadvali va ko'p uchragan so'zlar
// (18/#03–#04). Ma'lumot — use(Promise): hisob tayyor bo'lmaguncha
// komponent "to'xtaydi" (suspend), eng yaqin <Suspense> esa kutish
// holatini ko'rsatadi. Komponentda isLoading/useEffect/useState yo'q —
// u faqat TAYYOR natijani chizadi
import { use } from "react";
import { statistikaCsv } from "./batafsil-statistika.ts";
import { faylniYuklabBer } from "../../fayl.ts";
import { statistikaVadasi } from "./statistika-vadasi.ts";
import { TeglarJadvali } from "./TeglarJadvali.tsx";
import { TeglarGrafigi } from "./TeglarGrafigi.tsx";
import { useFlag } from "../../flaglar.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu.tsx";
import { Tugma } from "../../ui/Tugma.tsx";
import { Download } from "lucide-react";
import type { VazifaMalumoti } from "../../turlar.ts";

type Props = {
  vazifalar: readonly VazifaMalumoti[];
};

export function BatafsilStatistika({ vazifalar }: Props) {
  // Promise keshdan (statistika-vadasi.ts): renderda yangisi yaratilmaydi
  const s = use(statistikaVadasi(vazifalar));
  // 21/#20: grafik — flag ortida (o'chirish — deploysiz, Sozlamalar'da)
  const grafik = useFlag("teglar-grafigi");
  // Komponentning o'z state'i: panel yopilib-ochilganda saqlanadimi —
  // 18/#11 (<Activity>) shuni ko'rsatadi
  return (
    <>
      <p id="batafsil-umumiy">
        {`${s.jami} ta vazifa, ${s.bajarildi} tasi bajarilgan (${s.foiz}%). O'rtacha uzunlik — ${s.ortachaUzunlik} belgi.`}
      </p>
      {/* 20/#03: shadcn/ui DropdownMenu (Radix) — 18/#26 dagi o'z
          Menyu'miz o'rniga. Klaviatura (strelkalar, Home/End, Esc, harf
          bilan qidirish), fokus qaytishi, aria-* — Radix'da; onSelect —
          band tanlanganda (Enter, Space yoki bosish), menyu o'zi yopiladi */}
      <DropdownMenu>
        {/* 20/#04: asChild — Radix o'z <button> ini chizmaydi, xossalarini
            (onKeyDown, aria-expanded, data-state, ref...) BOLAGA — bizning
            Tugma'ga — qo'shadi. data-state="open" — ochiq holat uslubi */}
        <DropdownMenuTrigger asChild>
          <Tugma className="hisobot-tugma data-[state=open]:border-asosiy">
            <Download size={16} />
            Hisobotni yuklab olish
          </Tugma>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() =>
              faylniYuklabBer(
                statistikaCsv(s),
                "statistika.csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            CSV (Excel uchun)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              faylniYuklabBer(
                JSON.stringify(s, null, 2),
                "statistika.json",
              )
            }
          >
            JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* 20/#14: teglar jadvali — TanStack Table (TeglarJadvali.tsx) */}
      {s.teglar.length > 0 && <TeglarJadvali teglar={s.teglar} />}
      {/* 21/#04: o'sha raqamlar grafikda (o'z SVG — TeglarGrafigi.tsx) */}
      {grafik && s.teglar.length > 0 && (
        <TeglarGrafigi teglar={s.teglar} />
      )}
      {s.sozlar.length > 0 && (
        <>
          <h3>Ko'p uchragan so'zlar</h3>
          <ol id="sozlar">
            {s.sozlar.map((soz) => (
              <li key={soz.soz}>{`${soz.soz} — ${soz.soni}`}</li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
