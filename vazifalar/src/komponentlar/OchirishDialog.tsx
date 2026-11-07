// OchirishDialog.tsx — o'chirishni tasdiqlash oynasi (13/#09). Ochish —
// ota ref orqali showModal() (17/#34); javob — close hodisasi (onClose,
// 17/#28): ota
// uni ENG SO'NGGI holat bilan oladi (v6 da Promise kutardi — kutish
// davomida ro'yxat eskirib qolishi mumkin edi)
import { useId } from "react";
import type { Ref } from "react";
import { Tugma } from "../ui/Tugma.tsx";

type Props = {
  ref: Ref<HTMLDialogElement>; // React 19: ref — oddiy prop
  matn: string | null; // o'chirilayotgan vazifa matni
  onJavob: (tasdiq: boolean) => void;
};

export function OchirishDialog({ ref, matn, onJavob }: Props) {
  // Dialog nomi — sarlavhasi (aria-labelledby); id — useId (17/#37).
  // "ochirish-matn" qoladi: e2e ssenariy uni shu nom bilan o'qiydi
  const sarlavhaId = useId();
  return (
    <dialog
      ref={ref}
      id="ochirish-dialog"
      aria-labelledby={sarlavhaId}
      aria-describedby="ochirish-matn"
      onClose={(event) =>
        onJavob(event.currentTarget.returnValue === "ochir")
      }
    >
      {/* method="dialog": tugma bosilsa oyna yopiladi, returnValue —
          tugma qiymati. Ochilganda fokus birinchi tugmaga — «Bekor
          qilish» (xavfsizi). React'ning autoFocus prop'i HTML atribut
          emas (React o'zi focus() qiladi) — shu sabab tartib bilan */}
      <form method="dialog">
        <h2 id={sarlavhaId}>Vazifa o'chirilsinmi?</h2>
        <p id="ochirish-matn">
          {matn === null ? "" : `«${matn}» ro'yxatdan o'chiriladi.`}
        </p>
        <div className="qator">
          {/* type="submit": method="dialog" formasi shu bilan yopiladi
              (Tugma standarti — "button", 18/#31) */}
          <Tugma type="submit" value="bekor">
            Bekor qilish
          </Tugma>
          <Tugma type="submit" value="ochir" variant="xavfli">
            O'chirish
          </Tugma>
        </div>
      </form>
    </dialog>
  );
}
