// cn.ts — sinflarni birlashtirish (20/#02): clsx — shartli sinflar
// ("a", ochiq && "b", { c: bool }) bitta satrga.
// shadcn/ui'da cn = clsx + tailwind-merge (CSS qismidagi C-99): merge
// to'qnashgan sinflardan oxirgisini qoldiradi — cn("px-3", "px-4") → "px-4".
// Bizda tailwind-merge YO'Q — o'lchandi (natijalar/02-cn-hajm.txt):
// birinchi yuklash gzip +8.8 KB (clsx'ning o'zi +0.5 KB, shadcn'ning yangi
// "cn" paketi +11.4 KB). Narxiga qoida: komponentga className faqat
// QO'SHIMCHA uchun (joylashuv: margin, flex), rang/o'lcham — variant
// orqali; to'qnashadigan sinf berilmaydi (TEXNIK-QARZ 53)
import { clsx } from "clsx";
import type { ClassValue } from "clsx";

export function cn(...sinflar: ClassValue[]): string {
  return clsx(sinflar);
}
