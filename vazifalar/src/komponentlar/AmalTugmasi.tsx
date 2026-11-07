// AmalTugmasi.tsx — qatordagi tugma (17/#06: props, #11: hodisa).
// Ekran o'quvchi "Tahrirlash" emas, "Tahrirlash: Non olish" eshitadi —
// qaysi vazifa ekani aria-label'da
type Amal = "almashtir" | "ochir" | "tahrirla" | "saqla" | "bekor";

import type { Ref } from "react";
// 20/#08: lucide-react — har ikonka alohida komponent, nomi bilan import
// qilinadi: build faqat shu to'rttasini oladi (tree-shaking, o'lchandi —
// natijalar/08-ikonka-hajm.txt). Ikonka — bezak: matn ko'rinib turadi,
// lucide o'zi aria-hidden="true" qo'yadi (ekran o'quvchi o'qimaydi)
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tugma } from "../ui/Tugma.tsx";

type Props = {
  // React 19: ref — oddiy prop (forwardRef shart emas, 17/#34)
  ref?: Ref<HTMLButtonElement>;
  amal: Amal;
  matn: string; // tugmada ko'rinadigan so'z
  nomi: string; // vazifa matni
  onClick: () => void;
};

// Record<Amal, ...> emas: "almashtir" — katak (checkbox), tugma emas
const IKONKALAR: Partial<Record<Amal, LucideIcon>> = {
  tahrirla: Pencil,
  ochir: Trash2,
  saqla: Check,
  bekor: X,
};

export function AmalTugmasi({ ref, amal, matn, nomi, onClick }: Props) {
  const Ikonka = IKONKALAR[amal];
  return (
    // onClick={onClick} — funksiyaning O'ZI uzatiladi; onClick={onClick()}
    // bo'lsa, u render paytida chaqirilardi (17/#11).
    // data-amal — e2e ssenariy va fokus shunga qaraydi (render.tsx)
    <Tugma
      ref={ref}
      data-amal={amal}
      aria-label={`${matn}: ${nomi}`}
      onClick={onClick}
    >
      {Ikonka !== undefined && <Ikonka size={16} />}
      {matn}
    </Tugma>
  );
}
