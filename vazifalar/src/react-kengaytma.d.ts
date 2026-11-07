// react-kengaytma.d.ts — kutubxona turini kengaytirish (module
// augmentation, 18/#38). React'ning style prop'i (CSSProperties) faqat
// ma'lum CSS xossalarini biladi: style={{ "--ulush": "40%" }} — tsc
// xatosi (o'lchandi, natijalar/38-*). CSS o'zgaruvchilari (custom
// properties) — "--" bilan boshlanadigan har qanday nom; React ularni
// style.setProperty bilan yozadi (CSSOM — CSP style-src'ga tegmaydi).
// "declare module" — @types/react dagi interfeysga yangi a'zo qo'shadi
// (declaration merging), faylning o'zi kod emas
import "react";

declare module "react" {
  interface CSSProperties {
    [ozgaruvchi: `--${string}`]: string | number | undefined;
  }
}
