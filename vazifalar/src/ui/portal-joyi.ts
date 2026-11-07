// portal-joyi.ts — Radix portallari qayerga chiziladi (20/#03). Sukut
// bo'yicha <body> oxiriga — <main> dan tashqarida. axe (best-practice
// "region") buni "landmark'dan tashqaridagi kontent" deydi (o'lchandi:
// natijalar/03-axe.txt). <main> ichida ham joylashuv buzilmaydi:
// Floating UI position: fixed bilan ekran koordinatasida joylaydi
export function portalJoyi(): HTMLElement | null {
  return document.querySelector("main");
}
