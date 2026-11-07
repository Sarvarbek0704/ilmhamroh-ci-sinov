// kuzatuv/xatolar.ts — foydalanuvchida yuz bergan xatolarni yig'ish
// (21/#19): Sentry SDK'siz. @sentry/react 11.6.0 o'lchandi — +29.6 KB gzip,
// CSP 0 (natijalar/tajriba/kutubxonalar-21.txt), lekin DSN (hisob) kerak;
// bizga kerak bo'lgani — 4 manba va bitta POST:
//  - window "error" (sinxron xato), "unhandledrejection" (await'siz Promise)
//  - React: onUncaughtError / onCaughtError (main.tsx, error boundary)
// Yuboriladi: xabar, stack (8 qator), qayerdan, umumlashtirilgan yo'l,
// til, reliz (qaysi build — source map bilan solishtirish uchun) va oxirgi
// 10 sahifa o'tishi ("iz" — Sentry'dagi breadcrumbs). Email/telefon/so'rov
// qatori — yashiriladi (maxfiylik.ts). Bir sessiyada ko'pi bilan 10 xato,
// bir xili — bir marta. Manzil — VITE_XATO_URL (dev: skriptlar/kuzatuv.js;
// production'da yo'q — yuborilmaydi, faqat konsol)
import { yolniUmumlashtir } from "./maxfiylik.ts";
import { xatoYozuvi } from "./xato-yozuvi.ts";
import type { XatoManbai } from "./xato-yozuvi.ts";

const MANZIL = import.meta.env.VITE_XATO_URL;
const MAKS = 10;
const IZ_UZUNLIGI = 10;

const iz: string[] = [];
const korilgan = new Set<string>();

/** Sahifa o'tishi — izga (main.tsx router.subscribe) */
export function izQoldir(yol: string): void {
  iz.push(yolniUmumlashtir(yol));
  if (iz.length > IZ_UZUNLIGI) {
    iz.shift();
  }
}

/** Xatoni yuborish (manzil bo'lsa). Takror va ortiqchasi — tashlanadi */
export function xatoniYubor(xato: unknown, manba: XatoManbai): void {
  if (MANZIL === undefined || korilgan.size >= MAKS) {
    return;
  }
  const yozuv = xatoYozuvi(xato, manba, {
    yol: location.pathname,
    til: document.documentElement.lang,
    reliz: __RELIZ__,
    iz,
  });
  const kalit = `${yozuv.nom}:${yozuv.xabar}:${yozuv.stack.split("\n")[1] ?? ""}`;
  if (korilgan.has(kalit)) {
    return;
  }
  korilgan.add(kalit);
  const tana = new Blob([JSON.stringify(yozuv)], {
    type: "application/json",
  });
  // sendBeacon — sahifa yiqilib yopilayotgan bo'lsa ham ketadi
  if (!navigator.sendBeacon(MANZIL, tana)) {
    void fetch(MANZIL, {
      method: "POST",
      body: tana,
      keepalive: true,
    }).catch(() => {});
  }
}

if (MANZIL !== undefined) {
  addEventListener("error", (event) => {
    xatoniYubor(event.error ?? event.message, "window");
  });
  addEventListener("unhandledrejection", (event) => {
    xatoniYubor(event.reason, "promise");
  });
}

// Faqat dev: sinov uchun xato chiqaruvchi (dev-21.mjs). Brauzer begona
// skriptdagi xatoni "Script error." deb yashiradi (o'lchandi: puppeteer
// evaluate'dan otilgan xato shunday keldi) — shuning uchun xato ilovaning
// o'z modulidan otiladi. Production build'da bu blok yo'q (import.meta.env.DEV)
if (import.meta.env.DEV) {
  Object.assign(window, {
    __xatoSinovi(matn: string) {
      setTimeout(() => {
        throw new Error(matn);
      }, 0);
    },
    __vadaSinovi(matn: string) {
      void Promise.reject(new Error(matn));
    },
  });
}
