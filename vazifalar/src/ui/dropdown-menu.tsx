// dropdown-menu.tsx — shadcn/ui'dan KO'CHIRILGAN (20/#03): `npx shadcn@4.21.4
// add dropdown-menu` (radix-nova uslubi, components.json va @/ alias —
// 20/#02; CLI chiqishi: natijalar/02-shadcn-cli.txt) va moslangan. Kod
// endi bizniki:
// (0) import — alohida paket @radix-ui/react-dropdown-menu (shadcn'dagi
//     umumiy "radix-ui" emas): umumiy paketning turlari hamma primitivni
//     (react-select ham) tortadi va tsc -b xato beradi (TS2320,
//     natijalar/tekshiruv-03.txt); hajm bir xil — tree-shaking ishlaydi;
// (1) faqat ishlatiladigan 4 qism qoldi (asl faylda 15 ta — knip
//     ishlatilmagan eksportni xato deydi);
// (2) sinflar — bizning tokenlar (bg-yuza, text-matn, bg-asosiy...)
//     shadcn'nikilar (bg-popover, bg-accent...) o'rniga; dark: variantlari
//     kerak emas — tokenlar light-dark() bilan o'zi almashadi;
// (3) modal={false} — standart. Modal menyu sahifa aylantirishini
//     react-remove-scroll bilan to'xtatadi, u esa <head> ga <style>
//     qo'shadi — CSP style-src 'self' uni to'sadi (o'lchandi:
//     natijalar/03-radix-csp.txt). Menyuga modal kerak emas: tashqariga
//     bosish va Esc baribir yopadi;
// (4) loop — ↓ oxirgi banddan birinchisiga (18/#26 dagi Menyu shunday edi);
// (5) band balandligi — 44 px (min-h-bosish): asl h-7 (28 px) tegish
//     nishoni talabiga (WCAG 2.5.5) kam.
// Nomlar inglizcha qoldi — shadcn hujjati va yangi versiya bilan
// solishtirish oson (kutubxona API'si kabi)
import type { ComponentProps } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/ui/cn.ts";
import { portalJoyi } from "@/ui/portal-joyi.ts";

export function DropdownMenu({
  modal = false,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return (
    <DropdownMenuPrimitive.Root
      data-slot="dropdown-menu"
      modal={modal}
      {...props}
    />
  );
}

export function DropdownMenuTrigger(
  props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

// Portal: ro'yxat <main> oxirida (portal-joyi.ts) — ota-elementning
// overflow va z-index'i uni kesmaydi (18/#10 dagi toast kabi). Joylashuvni (pastda/tepada,
// ekran chetida) Floating UI hisoblaydi — style prop orqali (CSSOM, CSP'ga mos)
export function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  loop = true,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal container={portalJoyi()}>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        loop={loop}
        className={cn(
          // 20/#22: origin — trigger tomondan o'sadi; motion-safe — harakatni
          // kamaytirish so'ralmagan bo'lsa. Faqat data-state=open da: yopilganda
          // animatsiya nomi "none" bo'ladi va Radix kutmasdan olib tashlaydi —
          // aks holda kirish animatsiyasi paytidagi Esc animationend'ni kutardi
          // (e2e-18 topdi: menyu yopildi, fokus bandda qoldi)
          "z-50 flex min-w-(--radix-dropdown-menu-trigger-width) origin-(--radix-dropdown-menu-content-transform-origin) flex-col rounded-burchak border border-chegara bg-yuza p-1 text-matn shadow-soya data-[state=open]:motion-safe:animate-kirish",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

// Band — div role="menuitem" (Radix): fokus strelkalar bilan ko'chadi,
// sichqoncha ustiga kelganda ham fokus shu bandga o'tadi — shuning uchun
// faqat focus: holati bezaladi (hover alohida kerak emas)
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex min-h-bosish cursor-default items-center gap-2 rounded-burchak px-3 py-2 whitespace-nowrap outline-none select-none focus:bg-asosiy focus:text-asosiy-ustida data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
