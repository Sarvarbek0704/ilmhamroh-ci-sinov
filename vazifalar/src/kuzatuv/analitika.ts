// kuzatuv/analitika.ts — o'z yengil analitikamiz (21/#18): sahifa
// ko'rishlari va bir nechta hodisa. Tashqi skript yo'q (GA4/Metrika/
// PostHog — o'lchandi: posthog-js +98.3 KB va Trusted Types ostida
// ochilmadi, natijalar/tajriba/kutubxonalar-21.txt), cookie yo'q,
// foydalanuvchi identifikatori yo'q. Yuboriladi: umumlashtirilgan yo'l,
// til, hodisa nomi, vaqt. Manzil — VITE_ANALITIKA_URL (dev: skriptlar/
// kuzatuv.js; production'da yo'q — funksiyalar hech narsa qilmaydi).
// Navbat: hodisalar yig'iladi va sahifa yashirilganda (visibilitychange)
// yoki 10 tadan keyin bitta sendBeacon bilan ketadi (sahifa yopilsa ham)
import { kuzatmaslikSoralgan, yolniUmumlashtir } from "./maxfiylik.ts";

const MANZIL = import.meta.env.VITE_ANALITIKA_URL;
const RUXSAT_KALITI = "vazifalar:analitika";
const NAVBAT_CHEGARASI = 10;

type Hodisa = {
  readonly tur: "sahifa" | "hodisa";
  readonly nom: string;
  readonly yol: string;
  readonly til: string;
  readonly vaqt: number;
};

let navbat: Hodisa[] = [];

/** Sozlamada o'chirilmagan va brauzer "kuzatma" demagan */
export function analitikaYoqilganmi(): boolean {
  try {
    if (localStorage.getItem(RUXSAT_KALITI) === "yoq") {
      return false;
    }
  } catch {
    return false;
  }
  return !kuzatmaslikSoralgan(navigator);
}

/** Sozlamalar sahifasidagi «Anonim statistika» */
export function analitikaniSozla(yoqilgan: boolean): void {
  try {
    if (yoqilgan) {
      localStorage.removeItem(RUXSAT_KALITI);
    } else {
      localStorage.setItem(RUXSAT_KALITI, "yoq");
      navbat = [];
    }
  } catch {
    // saqlanmasa — shu sahifada ham yuborilmaydi (navbat bo'shatildi)
  }
}

function yubor(): void {
  if (MANZIL === undefined || navbat.length === 0) {
    return;
  }
  const tana = new Blob([JSON.stringify(navbat)], {
    type: "application/json",
  });
  navbat = [];
  // sendBeacon — sahifa yopilayotganda ham ketadi; CSP connect-src 'self'
  navigator.sendBeacon(MANZIL, tana);
}

function qosh(
  hodisa: Omit<Hodisa, "vaqt" | "til" | "yol"> & { yol?: string },
): void {
  if (MANZIL === undefined || !analitikaYoqilganmi()) {
    return;
  }
  navbat.push({
    ...hodisa,
    yol: yolniUmumlashtir(hodisa.yol ?? location.pathname),
    til: document.documentElement.lang,
    vaqt: Date.now(),
  });
  if (navbat.length >= NAVBAT_CHEGARASI) {
    yubor();
  }
}

/** Sahifa ko'rildi (router yo'li, basename'siz) */
export function sahifaKorildi(yol: string): void {
  qosh({ tur: "sahifa", nom: "sahifa", yol });
}

/** Mahsulot hodisasi: "vazifa_qoshildi", "eksport_csv" … (matnsiz!) */
export function hodisa(nom: string): void {
  qosh({ tur: "hodisa", nom });
}

if (MANZIL !== undefined) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      yubor();
    }
  });
}
