// tooltip.tsx — shadcn/ui'dan KO'CHIRILGAN (20/#10; `npx shadcn@4.21.4 add
// tooltip`, radix-nova) va moslangan: alohida paket @radix-ui/react-tooltip
// (dropdown-menu.tsx (0) bandi), bizning tokenlar, portal — <main> da,
// o'q (Arrow) olib tashlandi. Tooltip — faqat QO'SHIMCHA ma'lumot
// (klaviatura yorlig'i): u sichqoncha ustiga kelganda va klaviatura
// fokusida chiqadi, telefonda (bosish) — yo'q. Shuning uchun muhim matn
// tugmaning o'zida yoziladi, tooltip'da emas
import type { ComponentProps } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/ui/cn.ts";
import { portalJoyi } from "@/ui/portal-joyi.ts";

// Provider — kechikish hamma tooltip uchun bitta (Qobiq'da): bir tooltip
// ochiq bo'lsa, qo'shnisi kechikishsiz ochiladi (skipDelayDuration)
export function TooltipProvider({
  delayDuration = 300,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      {...props}
    />
  );
}

export function Tooltip(
  props: ComponentProps<typeof TooltipPrimitive.Root>,
) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

export function TooltipTrigger(
  props: ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
  );
}

// Matn trigger'ga aria-describedby bilan bog'lanadi (Radix): ekran
// o'quvchi tugma nomidan keyin tooltip matnini ham o'qiydi
export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal container={portalJoyi()}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 origin-(--radix-tooltip-content-transform-origin) rounded-burchak bg-matn px-3 py-1.5 text-sm text-fon shadow-soya data-[state=delayed-open]:motion-safe:animate-kirish data-[state=instant-open]:motion-safe:animate-kirish",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
