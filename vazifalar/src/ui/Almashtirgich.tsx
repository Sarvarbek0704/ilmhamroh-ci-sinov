// Almashtirgich.tsx — yoqish/o'chirish tugmasi (19/#32): role="switch"
// (ARIA), aria-checked — holat. Native <input> emas: React Hook Form uni
// register bilan ULAY OLMAYDI (ref'da value/checked yo'q) — Controller
// orqali boshqariladi (value + onChange + onBlur)
import type { ReactNode, Ref } from "react";

type Props = {
  id: string;
  yoqilgan: boolean;
  onOzgar: (yoqilgan: boolean) => void;
  onBlur?: () => void;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode; // nomi (ekran o'quvchi shuni o'qiydi)
};

export function Almashtirgich({
  id,
  yoqilgan,
  onOzgar,
  onBlur,
  ref,
  children,
}: Props) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      id={id}
      className="almashtirgich"
      aria-checked={yoqilgan}
      onClick={() => onOzgar(!yoqilgan)}
      onBlur={onBlur}
    >
      {children}
    </button>
  );
}
