// OddiyQator.tsx — katak, matn va ikki tugma (17/#06: props, #11: hodisalar)
import { Link } from "react-router";
import { AmalTugmasi } from "./AmalTugmasi.tsx";
import { BelgilanganMatn } from "./BelgilanganMatn.tsx";
import { use } from "react";
import { Qator } from "./Qator.tsx";
import { SudrashKonteksti } from "../kontekst/sudrash.ts";
import { useQatorAmallari } from "../kontekst/qator-amallari.ts";
import { ChevronRight } from "lucide-react";
import type { QatorJoyi, VazifaMalumoti } from "../turlar.ts";

type Props = {
  vazifa: VazifaMalumoti;
  joy?: QatorJoyi | undefined; // 18/#23: virtual ro'yxatda
  sorov: string;
  yangi?: boolean; // 20/#25
};

export function OddiyQator({
  vazifa,
  sorov,
  joy,
  yangi = false,
}: Props) {
  // Hodisalar — kontekstdan (17/#41), props zanjirisiz
  const { onAlmashtir, onOchir, onTahrirla, tugmaRef } =
    useQatorAmallari();
  const katakId = `vazifa-${vazifa.id}`;
  // 20/#17: «Tartiblash» rejimida — tutqichli qator (lazy chunk'dan)
  const tutqichliQator = use(SudrashKonteksti);
  const tarkib = (
    <>
      {/* checked — holatdan (controlled): bosilganda React avval katakni
          joyiga qaytaradi, holat o'zgargach yangisini chizadi. Server
          rad etsa yoki internet yo'q bo'lsa — katak o'z-o'zidan eski
          holatida qoladi. Argument kerak — arrow funksiya bilan */}
      <input
        ref={tugmaRef(vazifa.id, "almashtir")}
        type="checkbox"
        id={katakId}
        data-amal="almashtir"
        checked={vazifa.bajarildi}
        onChange={() => onAlmashtir(vazifa.id)}
      />
      <label htmlFor={katakId}>
        <BelgilanganMatn matn={vazifa.matn} sorov={sorov} />
      </label>
      <AmalTugmasi
        ref={tugmaRef(vazifa.id, "tahrirla")}
        amal="tahrirla"
        matn="Tahrirlash"
        nomi={vazifa.matn}
        onClick={() => onTahrirla(vazifa.id)}
      />
      <AmalTugmasi
        ref={tugmaRef(vazifa.id, "ochir")}
        amal="ochir"
        matn="O'chirish"
        nomi={vazifa.matn}
        onClick={() => onOchir(vazifa.id)}
      />
      {/* 19/#03: vazifa sahifasi. Link — sahifani qayta yuklamaydi
          (router manzilni o'zgartiradi); qatorning oxirida — Tab tartibi
          (katak, tahrir, o'chirish) o'zgarmaydi */}
      <Link
        to={`/vazifa/${vazifa.id}`}
        className="batafsil"
        aria-label={`Batafsil: ${vazifa.matn}`}
      >
        Batafsil
        <ChevronRight size={16} className="inline align-[-0.15em]" />
      </Link>
    </>
  );
  return (
    // 20/#17: sudrash yoqilgan va qator virtual emas — tutqichli qator
    tutqichliQator !== null && joy === undefined ? (
      tutqichliQator({ vazifa, yangi, children: tarkib })
    ) : (
      <Qator
        id={vazifa.id}
        bajarildi={vazifa.bajarildi}
        joy={joy}
        yangi={yangi}
      >
        {tarkib}
      </Qator>
    )
  );
}
