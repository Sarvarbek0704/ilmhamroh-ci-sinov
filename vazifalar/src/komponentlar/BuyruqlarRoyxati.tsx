// BuyruqlarRoyxati.tsx — buyruqlar oynasining ichi (20/#11): cmdk (qidiruv,
// tanlangan band, aria-activedescendant — combobox + listbox). Alohida
// chunk: BuyruqlarOynasi uni birinchi Ctrl+K (yoki tugma) da lazy()
// bilan yuklaydi — cmdk birinchi yuklashga kirmaydi (18/#09 code
// splitting qoidasi o'z ilovamizda)
import { useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { normalla } from "@/qidiruv.ts";
import { useVazifalar } from "@/server-sinxron.ts";

const SAHIFALAR = [
  { yol: "/", nomi: "Ro'yxat" },
  { yol: "/statistika", nomi: "Statistika" },
  { yol: "/sozlamalar", nomi: "Sozlamalar" },
  { yol: "/yangi", nomi: "Katta ishni qadamlarga bo'lish" },
] as const;

const BAND =
  "flex min-h-bosish cursor-default items-center rounded-burchak px-3 py-2 data-[selected=true]:bg-asosiy data-[selected=true]:text-asosiy-ustida";
const GURUH =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:text-ikkinchi";

// Qidiruv — o'zimizniki (14/#11 normalla: kichik harf, apostroflar
// ' ‘ ’ ʻ ʼ bir xil): cmdk'ning standart "fuzzy" bahosi o'zbekcha
// apostrofni bilmaydi va "nl" ni "Non olish" ga mos deydi
function mosmi(_qiymat: string, sorov: string, kalitlar?: string[]) {
  return normalla((kalitlar ?? []).join(" ")).includes(normalla(sorov))
    ? 1
    : 0;
}

type Props = {
  bor: (yol: string) => void;
};

// default eksport — lazy() shuni kutadi
export default function BuyruqlarRoyxati({ bor }: Props) {
  // Oyna har ochilganda bu komponent qaytadan quriladi (yopiqda — yo'q):
  // so'rov bo'sh boshlanadi
  const [sorov, setSorov] = useState("");
  const maydon = useRef<HTMLInputElement>(null);
  const { vazifalar } = useVazifalar();

  // Fokus — qidiruv maydoniga. Birinchi ochilishda chunk showModal'dan
  // KEYIN keladi (oyna allaqachon ochiq, fokus <dialog> da) — maydon
  // paydo bo'lganda fokusni o'zi oladi
  useEffect(() => {
    maydon.current?.focus();
  }, []);

  return (
    <Command label="Buyruqlar" filter={mosmi} loop>
      <Command.Input
        ref={maydon}
        value={sorov}
        onValueChange={setSorov}
        placeholder="Sahifa yoki vazifa nomi…"
        className="mb-2 min-h-bosish w-full rounded-burchak border-2 border-ikkinchi bg-yuza px-2"
      />
      <Command.List className="max-h-80 overflow-y-auto">
        <Command.Empty className="px-3 py-2 text-ikkinchi">
          Hech narsa topilmadi.
        </Command.Empty>
        <Command.Group heading="Sahifalar" className={GURUH}>
          {SAHIFALAR.map((s) => (
            <Command.Item
              key={s.yol}
              value={`sahifa:${s.yol}`}
              keywords={[s.nomi]}
              onSelect={() => bor(s.yol)}
              className={BAND}
            >
              {s.nomi}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Vazifalar" className={GURUH}>
          {vazifalar.map((v) => (
            <Command.Item
              key={v.id}
              value={`vazifa:${v.id}`}
              keywords={[v.matn]}
              onSelect={() => bor(`/vazifa/${v.id}`)}
              className={BAND}
            >
              {v.matn}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
}
