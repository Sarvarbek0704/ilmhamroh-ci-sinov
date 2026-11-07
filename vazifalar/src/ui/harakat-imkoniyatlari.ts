// harakat-imkoniyatlari.ts — Motion'ning animatsiya "yadrosi" (20/#26).
// LazyMotion buni ALOHIDA chunk sifatida, birinchi chizishdan keyin
// yuklaydi: birinchi yuklashda faqat kichik m.* komponentlari
// (o'lchandi: yadro chunk'i 14.5 KB gzip — natijalar/tekshiruv-25.txt;
// to'liq motion.* bilan birinchi yuklash +26 KB — natijalar/
// 25-motion-strict.txt). domAnimation — animate,
// exit, hover/tap; layout animatsiya (domMax) kerak emas
import { domAnimation } from "motion/react";

export default domAnimation;
