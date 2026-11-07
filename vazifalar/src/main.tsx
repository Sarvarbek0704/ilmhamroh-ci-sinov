// main.tsx — kirish nuqtasi (17/#02 da React "oroli" edi, 17/#28 dan —
// butun ilova, 19/#02 dan — sahifalar): index.html → main.tsx → router →
// marshrutlar.tsx dagi sahifa. React'dan tashqaridagi
// bir martalik ishlar ham shu yerda: Service Worker,
// Web Vitals, oynaga sudrab tashlangan fayl
import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { RootOptions } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import { TemaProvider } from "./kontekst/TemaKonteksti.tsx";
import { marshrutlar } from "./marshrutlar.tsx";
import { AuthProvider } from "./xususiyatlar/auth/index.ts";
import { sorovMijozi, xatoMatni } from "./server-sinxron.ts";
import { SW_MANZILI, skriptManzili } from "./xavfsiz-manzil.ts";
import { tilniTayyorla, tilYoli } from "./i18n/index.ts";
import { sahifaKorildi } from "./kuzatuv/analitika.ts";
import { izQoldir, xatoniYubor } from "./kuzatuv/xatolar.ts";
import { manzildagiFlaglar } from "./flaglar.ts";
import { swniKuzat } from "./sw-yangilanish.ts";

const ildiz = document.getElementById("ilova");
if (ildiz === null) {
  throw new TypeError("#ilova topilmadi");
}

// Birinchi chizish — sinxron (flushSync): modul skripti
// blocking="render" bilan bajariladi va sahifa ro'yxat bilan birga
// paydo bo'ladi (CLS 0). root.render() o'zi navbatga qo'yardi.
// StrictMode — faqat dev'da: render va effektni ikki marta sinaydi
// Render xatosi (17/#45): React ildizni bo'shatadi (oq ekran) va
// xatoni shu yerga beradi. componentStack — xato QAYSI komponentlar
// ichida bo'lgani (App > Statistika...); dev'da asl nomlar, build'da
// qisqartirilgan — source map (dist/*.map) DevTools'da asl faylga qaytaradi.
// 18/#08: error boundary USHLAGAN xato ham shu yerga keladi
// (onCaughtError) — ilova ishlayveradi, lekin xato yashirinib qolmasin
const ildizSozlamasi: RootOptions = {
  onCaughtError(xato, malumot) {
    xatoniYubor(xato, "chegara"); // 21/#19
    console.error(
      `Xato ushlandi (chegara): ${xatoMatni(xato)}`,
      malumot.componentStack ?? "",
    );
  },
  onUncaughtError(xato, malumot) {
    xatoniYubor(xato, "react"); // 21/#19
    console.error(
      `Ilova yiqildi: ${xatoMatni(xato)}`,
      malumot.componentStack ?? "",
    );
  },
};

// Router (19/#02): History API bilan (manzil — oddiy yo'l, # siz).
// basename — ilova papkasi (Pages'da "/vazifalar", vite.config.ts base):
// marshrutlarda "/statistika" yoziladi, manzilda /vazifalar/statistika.
// Marshrutlarda loader yo'q — birinchi chizish sinxron qoladi (CLS 0)
// 21/#20: ?flag=... — router manzilni o'qishidan oldin (manzildan olinadi)
manzildagiFlaglar();

const router = createBrowserRouter(marshrutlar, {
  // 21/#03: til ham manzilda — "/ru/statistika" da basename "/ru" (Pages'da
  // "/vazifalar/ru"): marshrutlar va havolalar tildan bexabar qoladi
  basename: tilYoli.asos,
});

// 21/#18: sahifa ko'rishlari — router holatidan (navigatsiya tugaganda,
// yo'l o'zgargan bo'lsa). Basename'siz yo'l: til alohida maydonda
let oxirgiYol = router.state.location.pathname;
sahifaKorildi(oxirgiYol);
izQoldir(oxirgiYol);
router.subscribe((holat) => {
  if (
    holat.navigation.state === "idle" &&
    holat.location.pathname !== oxirgiYol
  ) {
    oxirgiYol = holat.location.pathname;
    sahifaKorildi(oxirgiYol);
    izQoldir(oxirgiYol); // 21/#19: xato yozuvidagi "iz"
  }
});

// 21/#02: tarjima — i18n/index.ts (import paytida sozlanadi). Asosiy til
// (o'zbekcha) build'da: ilova SINXRON chiziladi. Boshqa til tanlangan
// bo'lsa — avval uning fayli (bitta kichik chunk), keyin chizish
function chiz(element: HTMLElement) {
  flushSync(() => {
    createRoot(element, ildizSozlamasi).render(
      <StrictMode>
        <TemaProvider>
          {/* Soxta auth (18/#42): chiqish hamma tablarda (BroadcastChannel).
            19/#07 dan himoya — marshrutlarda (Himoyalangan, /kirish) */}
          <AuthProvider>
            {/* 19/#13: server holati keshi — hamma sahifa uchun bitta
              (loader'lar ham shu sorovMijozi'ni ishlatadi) */}
            <QueryClientProvider client={sorovMijozi}>
              <RouterProvider router={router} />
            </QueryClientProvider>
          </AuthProvider>
        </TemaProvider>
      </StrictMode>,
    );
  });
}
const tilTayyor = tilniTayyorla();
if (tilTayyor === null) {
  chiz(ildiz);
} else {
  // Til fayli kelmasa (oflayn, birinchi tashrif) — o'zbekcha bilan
  tilTayyor.finally(() => chiz(ildiz)).catch(() => {});
}

// Zonadan tashqariga tashlangan faylni brauzer ochib yuboradi va
// ilova yopiladi — fayllar uchun buni to'xtatamiz (matnga tegmaymiz)
const faylmi = (event: DragEvent): boolean =>
  event.dataTransfer?.types.includes("Files") ?? false;
for (const tur of ["dragover", "drop"] as const) {
  addEventListener(tur, (event) => {
    if (faylmi(event)) {
      event.preventDefault();
    }
  });
}

// O'lchov kutubxonasi alohida yuklanadi: birinchi chizishni kutdirmasin.
// Yuklanmasa (oflayn, keshda yo'q) — ilova ishlayveradi, faqat ogohlantirish
import("./olchov.ts")
  .then(({ olchashniBoshla }) => olchashniBoshla())
  .catch((xato: unknown) => {
    console.warn(`Web Vitals yuklanmadi: ${xatoMatni(xato)}`);
  });

// Service Worker: faqat xavfsiz kontekstda (https yoki localhost).
// "load" dan keyin — qobiqni keshlash birinchi ochilish bilan
// tarmoq uchun bellashmasin
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    // Trusted Types siyosati — xavfsiz-manzil.ts (18/#24 dan: SW va
    // statistika ishchisi — ikki manzil, bitta siyosat)
    const manzil = skriptManzili(SW_MANZILI);
    navigator.serviceWorker
      .register(manzil)
      // 21/#28: yangi versiya kutsa — «Yangilash» taklifi
      .then(swniKuzat)
      .catch((xato: unknown) => {
        console.warn(`Service Worker o'rnatilmadi: ${xatoMatni(xato)}`);
      });
  });
}
