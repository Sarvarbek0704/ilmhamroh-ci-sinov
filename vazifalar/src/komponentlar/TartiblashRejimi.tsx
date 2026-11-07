// TartiblashRejimi.tsx — «Tartiblash» rejimi (20/#17, dnd-kit): DndContext
// (sudrash holati, sensorlar, ekran o'quvchi e'lonlari) va SortableContext
// (qaysi qatorlar tartiblanadi — ekrandagi tartibda). Alohida chunk:
// App uni faqat rejim yoqilganda lazy() bilan yuklaydi. Oddiy rejimda
// dnd-kit kodi ham, sensorlari ham yo'q — har qator oddiy <li>, bosish
// (INP) v9 dagidek (qaror 1; natijalar/21-inp.txt)
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Announcements } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SudraladiganQator } from "@/komponentlar/SudraladiganQator.tsx";
import { SudrashKonteksti } from "@/kontekst/sudrash.ts";
import type { TutqichliQator } from "@/kontekst/sudrash.ts";
import type { VazifaMalumoti } from "@/turlar.ts";
import { portalJoyi } from "@/ui/portal-joyi.ts";

// Modul darajasida — barqaror (har renderda yangi funksiya bo'lmasin)
const tutqichliQator: TutqichliQator = (props) => (
  <SudraladiganQator {...props} />
);

type Props = {
  vazifalar: readonly VazifaMalumoti[]; // ekrandagi tartibda
  onKochir: (aId: number, bId: number) => void; // A — B ning joyiga
  children: ReactNode;
};

// default eksport — lazy() shuni kutadi
export default function TartiblashRejimi({
  vazifalar,
  onKochir,
  children,
}: Props) {
  // Sichqoncha/barmoq: 4 px siljigandan keyin (oddiy bosish — sudrash
  // emas); klaviatura: Space/Enter — olish, ↑/↓ — qo'shni joyga
  const sensorlar = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const qatorIdlari = useMemo(
    () => vazifalar.map((v) => v.id),
    [vazifalar],
  );
  // Ekran o'quvchiga e'lonlar (dnd-kit'ning jonli hududi) — o'zbekcha
  const nomi = (id: number | string) =>
    vazifalar.find((v) => v.id === Number(id))?.matn ?? "";
  const orni = (id: number | string) =>
    vazifalar.findIndex((v) => v.id === Number(id)) + 1;
  const sudrashElonlari: Announcements = {
    onDragStart: ({ active }) =>
      `«${nomi(active.id)}» olindi: ${orni(active.id)}-o'rin, jami ${vazifalar.length}.`,
    // Olingan zahoti "over" — qatorning o'zi: e'lon qilinsa, "olindi"
    // matnini darhol bosib ketardi (e2e-20 topdi: jonli hududda faqat
    // "1-o'rin" qolgan edi) — o'z joyi e'lon qilinmaydi
    onDragOver: ({ active, over }) =>
      over === null
        ? `«${nomi(active.id)}» ro'yxatdan tashqarida.`
        : over.id === active.id
          ? undefined
          : `«${nomi(active.id)}» — ${orni(over.id)}-o'rin.`,
    onDragEnd: ({ active, over }) =>
      over === null
        ? `«${nomi(active.id)}» joyida qoldi.`
        : `«${nomi(active.id)}» ${orni(over.id)}-o'ringa qo'yildi.`,
    onDragCancel: ({ active }) =>
      `Bekor qilindi: «${nomi(active.id)}» joyida qoldi.`,
  };
  // E'lonlar va ko'rsatma (aria-describedby) — <main> ichida (portal)
  const portal = portalJoyi();

  return (
    <DndContext
      sensors={sensorlar}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over !== null) {
          onKochir(Number(active.id), Number(over.id));
        }
      }}
      accessibility={{
        announcements: sudrashElonlari,
        screenReaderInstructions: {
          draggable:
            "Olish uchun Space yoki Enter bosing. Strelkalar (↑, ↓) bilan siljiting, Space yoki Enter — qo'yish, Esc — bekor qilish.",
        },
        ...(portal === null ? {} : { container: portal }),
      }}
    >
      <SortableContext
        items={qatorIdlari}
        strategy={verticalListSortingStrategy}
      >
        {/* Qatorlar tutqichli qatorni kontekstdan oladi — OddiyQator
            dnd-kit'ni import qilmaydi (bo'lmasa u asosiy chunk'ka tushardi) */}
        <SudrashKonteksti value={tutqichliQator}>
          {children}
        </SudrashKonteksti>
      </SortableContext>
    </DndContext>
  );
}
