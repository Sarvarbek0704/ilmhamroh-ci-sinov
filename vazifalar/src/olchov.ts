// olchov.ts — Core Web Vitals: foydalanuvchi his qiladigan tezlik.
// Hozircha faqat konsolga yoziladi (serverga yuborilmaydi)
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
// Turlar ham paketning o'zidan (web-vitals/dist/*.d.ts)
import type { Metric } from "web-vitals";

const BAHOLAR: Readonly<Record<Metric["rating"], string>> =
  Object.freeze({
    good: "yaxshi",
    "needs-improvement": "yaxshilash kerak",
    poor: "yomon",
  });

// Pick: funksiyaga butun Metric emas, uch maydon yetadi (testda ham)
type Olchov = Pick<Metric, "name" | "value" | "rating">;

// CLS — o'lchovsiz son (siljish ulushi), qolganlari — millisekund
export function olchovMatni({ name, value, rating }: Olchov): string {
  const qiymat =
    name === "CLS" ? value.toFixed(3) : `${Math.round(value)} ms`;
  return `${name}: ${qiymat} (${BAHOLAR[rating] ?? rating})`;
}

// LCP birinchi bosish yoki tab yashirilganda, CLS va INP — tab
// yashirilganda yakunlanadi: shunda konsolga chiqadi
export function olchashniBoshla(
  yoz: (matn: string) => void = console.info,
): void {
  const xabar = (metrika: Metric) =>
    yoz(`[Web Vitals] ${olchovMatni(metrika)}`);
  for (const kuzat of [onTTFB, onFCP, onLCP, onCLS, onINP]) {
    kuzat(xabar);
  }
}
