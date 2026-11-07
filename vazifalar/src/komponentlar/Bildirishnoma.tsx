// Bildirishnoma.tsx — e'lon (toast) ekranning pastida (18/#10). Portal:
// element React daraxtida App ichida (state, context, hodisalar — App
// orqali), DOM'da esa <body> ning oxirida — #ilova va <main> dan
// tashqarida: max-width, overflow va ota-elementlarning stacking
// context'i (z-index, transform) unga ta'sir qilmaydi.
// position: fixed — oqimdan chiqadi: matn paydo bo'lib, o'chganda
// sahifa siljimaydi (o'lchandi: oqim ichida CLS 0.0088 — natijalar/10-*)
import { createPortal } from "react-dom";

type Props = {
  matn: string;
};

export function Bildirishnoma({ matn }: Props) {
  // role="status" — jonli hudud doim DOM'da (bo'sh bo'lsa ham): ekran
  // o'quvchi faqat oldindan bor hududdagi o'zgarishni o'qiydi
  return createPortal(
    <p id="elon" role="status" className="bildirishnoma">
      {matn}
    </p>,
    document.body,
  );
}
