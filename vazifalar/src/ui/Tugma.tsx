// Tugma.tsx — ilovaning tugmasi (18/#31: komponent API'si).
// Qoidalar: (1) kam va aniq props — ko'rinish bitta "variant" bilan,
// "asosiymi", "xavflimi" kabi boolean'lar to'plami emas (ikkalasi true
// bo'lsa-chi?); (2) qolgan hamma narsa — oddiy <button> atributlari
// (ComponentPropsWithoutRef<"button">, ...qolgan): id, aria-*, value,
// onClick — o'rganish shart emas, native'dagidek; (3) xavfsiz standart:
// type="button" (formada tasodifan submit bo'lmasin — submit kerak bo'lsa,
// aniq yoziladi); (4) className qo'shiladi, almashtirmaydi; ref — prop
// (React 19).
// 20/#02: ko'rinish — CSS'dagi [data-variant] qoidalari o'rniga cva
// (class-variance-authority) va Tailwind sinflari — shadcn/ui'ning
// Button'i shu naqshda. API o'zgarmadi: chaqiruvchilar tegilmadi
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { cn } from "@/ui/cn.ts";

// Variantlar jadvali: asos (har tugmada) + variant bo'yicha qo'shimcha.
// Qiymatlar — 18/#33 tokenlari (@theme): ko'rinish 19-qismdagidek
const tugmaSinflari = cva(
  // 20/#08: inline-flex + gap — ikonka (svg) matn bilan bir qatorda
  "tugma inline-flex min-h-bosish items-center justify-center gap-2 rounded-burchak border px-3 py-2 disabled:opacity-60 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        oddiy: "border-chegara bg-yuza text-matn",
        asosiy: "border-asosiy bg-asosiy text-asosiy-ustida",
        xavfli: "border-xato bg-yuza text-xato",
      },
    },
    defaultVariants: { variant: "oddiy" },
  },
);

// 18/#37: discriminated union — tugmaning NOMI bo'lishi shart (ekran
// o'quvchi uchun): yo matn (children), yo aria-label. Matnsiz va
// aria-label'siz <Tugma /> — tsc xatosi (o'lchandi, natijalar/38-*)
type Nomi =
  | { children: ReactNode; "aria-label"?: string }
  | { children?: never; "aria-label": string };

// variant turi — cva jadvalidan (VariantProps): jadvalga yangi variant
// qo'shilsa, tur o'zi kengayadi
type Props = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "aria-label"
> &
  Nomi &
  VariantProps<typeof tugmaSinflari> & {
    ref?: Ref<HTMLButtonElement> | undefined;
  };

export function Tugma({
  variant,
  type = "button",
  className,
  ref,
  ...qolgan
}: Props) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(tugmaSinflari({ variant }), className)}
      {...qolgan}
    />
  );
}
