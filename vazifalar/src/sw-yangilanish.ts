// sw-yangilanish.ts — "Yangi versiya tayyor" (21/#28). sw.js endi o'zi
// faollashmaydi: yangi versiya o'rnatilib KUTADI, sahifa buni ko'radi va
// foydalanuvchiga «Yangilash» ni taklif qiladi. Bosilsa — kutayotgan SW'ga
// "yangila" xabari → u faollashadi (clients.claim) → controllerchange →
// sahifa qayta yuklanadi (endi hamma narsa yangi versiyadan). Bosilmasa —
// ochiq sahifa eski kod va eski kesh bilan oxirigacha ishlaydi; keyingi
// ochilishda (hamma tab yopilgach) brauzer yangisini o'zi faollashtiradi.
// Yangilanish tekshiruvi: brauzer navigatsiyada o'zi tekshiradi; tab
// qaytib ko'ringanda (visibilitychange) ham — uzoq ochiq turgan tablar uchun
import { useSyncExternalStore } from "react";

let kutayotgan: ServiceWorker | null = null;
let soralgan = false;
const tinglovchilar = new Set<() => void>();

function belgila(sw: ServiceWorker | null) {
  kutayotgan = sw;
  for (const t of tinglovchilar) {
    t();
  }
}

/** main.tsx: ro'yxatdan o'tgach — kuzatishni boshlash */
export function swniKuzat(reg: ServiceWorkerRegistration): void {
  // controller bor — demak bu birinchi o'rnatish emas, haqiqiy yangilanish
  if (
    reg.waiting !== null &&
    navigator.serviceWorker.controller !== null
  ) {
    belgila(reg.waiting);
  }
  reg.addEventListener("updatefound", () => {
    const yangi = reg.installing;
    yangi?.addEventListener("statechange", () => {
      if (
        yangi.state === "installed" &&
        navigator.serviceWorker.controller !== null
      ) {
        belgila(yangi);
      }
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      reg.update().catch(() => {}); // oflayn — keyingi safar
    }
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Faqat foydalanuvchi so'ragan bo'lsa: boshqa tab bosgan bo'lishi
    // ham mumkin — bu tab ham yangi SW ostida, lekin sahifa eski; uni
    // ogohlantirmasdan qayta yuklamaymiz (yozilayotgan matn yo'qolmasin)
    if (soralgan) {
      location.reload();
    } else {
      belgila(null);
    }
  });
}

/** «Yangilash» bosildi */
export function yangila(): void {
  soralgan = true;
  kutayotgan?.postMessage("yangila");
}

/** Yangi versiya kutyaptimi (komponent uchun) */
export function useYangiVersiya(): boolean {
  return useSyncExternalStore(
    (t) => {
      tinglovchilar.add(t);
      return () => tinglovchilar.delete(t);
    },
    () => kutayotgan !== null,
  );
}
