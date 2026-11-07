// SudraladiganQator.tsx — tartibni sudrab o'zgartiriladigan qator (20/#17,
// dnd-kit). Qator (Qator.tsx) bilan bir xil <li>, qo'shimchasi: useSortable
// (joylashuv — transform, CSSOM orqali, CSP'ga mos) va oxirida TUTQICH
// tugmasi. Sudrash faqat tutqichdan boshlanadi (setActivatorNodeRef):
// katak, matn va tugmalarni bosish — avvalgidek ishlaydi, telefonda
// ro'yxatni barmoq bilan aylantirish ham (touch-action: none faqat
// tutqichda). Klaviatura: tutqichda Space/Enter — olish, ↑/↓ — siljitish,
// Space/Enter — qo'yish, Esc — bekor qilish (KeyboardSensor)
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { useQatorHarakati } from "../ui/qator-harakati.ts";
import { useQatorAmallari } from "../kontekst/qator-amallari.ts";
import type { VazifaMalumoti } from "../turlar.ts";
import { cn } from "../ui/cn.ts";

type Props = {
  vazifa: VazifaMalumoti;
  children: ReactNode;
  yangi?: boolean; // 20/#25
};

export function SudraladiganQator({
  vazifa,
  children,
  yangi = false,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: vazifa.id });
  const { tugmaRef } = useQatorAmallari();
  const fokusRef = tugmaRef(vazifa.id, "sudra");
  const harakat = useQatorHarakati(yangi);
  // 20/#25: paydo bo'lish — Qator.tsx dagidek. Motion faqat
  // opacity va x/y ni animatsiya qiladi; dnd-kit'ning transform'i (style)
  // sudrash paytida — ikkalasi bir vaqtda ishlamaydi
  return (
    <m.li
      {...harakat}
      ref={setNodeRef}
      data-id={vazifa.id}
      // Faqat tik o'q: x = 0 (qator chapga-o'ngga surilmasin)
      style={{
        transform: CSS.Translate.toString(
          transform === null ? null : { ...transform, x: 0 },
        ),
        transition,
      }}
      className={cn(
        vazifa.bajarildi && "bajarildi",
        // Olingan qator ustida — soya; boshqalari uning tagidan o'tadi
        isDragging && "relative z-10 bg-yuza shadow-soya",
      )}
    >
      {children}
      <button
        type="button"
        // Ikki ref: dnd-kit (faollashtiruvchi) va fokus Map'i (17/#34)
        ref={(element) => {
          setActivatorNodeRef(element);
          const tozala = fokusRef(element);
          // React 19: ref callback qaytargan funksiya — element olib
          // tashlanganda (null bilan chaqirilmaydi) — ikkalasini tozalaymiz
          return () => {
            setActivatorNodeRef(null);
            tozala?.();
          };
        }}
        data-amal="sudra"
        {...attributes}
        {...listeners}
        aria-label={`Tartibni o'zgartirish: ${vazifa.matn}`}
        className="ml-auto inline-flex min-h-bosish min-w-bosish cursor-grab touch-none items-center justify-center border-0 bg-transparent text-ikkinchi"
      >
        <GripVertical size={20} />
      </button>
    </m.li>
  );
}
