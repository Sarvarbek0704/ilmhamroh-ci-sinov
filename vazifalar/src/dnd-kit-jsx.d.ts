// dnd-kit-jsx.d.ts — 20/#17: @dnd-kit/core 6.3.1 (2024-12) turlari global
// `JSX` nomlar fazosiga tayanadi; @types/react 19 uni olib tashlagan
// (faqat React.JSX). tsc -b (skipLibCheck yo'q) node_modules ichida
// "Cannot find namespace 'JSX'" (TS2503) beradi — o'lchandi,
// natijalar/17-dnd-kit-jsx.txt. skipLibCheck butun kutubxonalar
// tekshiruvini o'chirardi; o'rniga — global JSX'ni React.JSX ga bog'laymiz
// (TEXNIK-QARZ 54: dnd-kit yangi turlari yoki @dnd-kit/react chiqqanda olib tashlanadi)
import type { JSX as ReactJSX } from "react";

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
  }
}
