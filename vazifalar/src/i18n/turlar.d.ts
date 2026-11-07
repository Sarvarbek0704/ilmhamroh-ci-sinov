// i18n/turlar.d.ts — tarjima kalitlarining turi (21/#03). i18next'ga
// asosiy til fayllarining SHAKLI aytiladi: t("bolimlar.royxatt") — tsc
// xatosi (ish vaqtida jim kalitni chiqarardi), {{o'rin}} lar ham tekshiriladi.
// Faqat tur: build'da yo'qoladi
import "i18next";
import type umumiy from "./uz/umumiy.json";
import type sozlamalar from "./uz/sozlamalar.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "umumiy";
    resources: {
      umumiy: typeof umumiy;
      sozlamalar: typeof sozlamalar;
    };
  }
}
