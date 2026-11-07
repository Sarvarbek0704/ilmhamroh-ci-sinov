// VazifaQatori.tsx — qaysi ko'rinish: tahrir yoki oddiy (17/#08)
import { memo } from "react";
import { OddiyQator } from "./OddiyQator.tsx";
import { TahrirQatori } from "./TahrirQatori.tsx";
import type { QatorJoyi, VazifaMalumoti } from "../turlar.ts";

type Props = {
  vazifa: VazifaMalumoti;
  sorov: string;
  tahrirda: boolean;
  // 18/#23: virtual ro'yxatda — tartib raqami, jami va o'lchagich
  joy?: number | undefined;
  jami?: number | undefined;
  olchov?: QatorJoyi["olchov"] | undefined;
  yangi?: boolean; // 20/#25: ochilgandan keyin qo'shilgan — kirish animatsiyasi
};

// memo (18/#20): props — vazifa (ro'yxatdagi o'sha obyekt, #20), sorov
// (satr), tahrirda (boolean) — o'zgarmagan qator qayta chizilmaydi.
// Hodisalar context'dan — u barqaror (18/#02), memo'ni buzmaydi.
// joy/jami/olchov — primitiv va barqaror funksiya (obyekt emas: har
// renderda yangi obyekt memo'ni buzardi)
export const VazifaQatori = memo(function VazifaQatori({
  vazifa,
  sorov,
  tahrirda,
  joy,
  jami,
  olchov,
  yangi = false,
}: Props) {
  const qatorJoyi =
    joy !== undefined && jami !== undefined && olchov !== undefined
      ? { indeks: joy, jami, olchov }
      : undefined;
  // Hodisalar (onAlmashtir...) — props'da emas: qatorning o'zi
  // kontekstdan oladi (17/#41)
  if (tahrirda) {
    return <TahrirQatori vazifa={vazifa} joy={qatorJoyi} />;
  }
  return (
    <OddiyQator
      vazifa={vazifa}
      sorov={sorov}
      joy={qatorJoyi}
      yangi={yangi}
    />
  );
});
