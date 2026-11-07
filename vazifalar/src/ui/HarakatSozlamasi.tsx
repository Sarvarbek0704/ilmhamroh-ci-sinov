// HarakatSozlamasi.tsx — Motion sozlamasi (20/#23–#26): LazyMotion (yadro kerak
// bo'lganda) + MotionConfig. reducedMotion="user" — tizimda "harakatni
// kamaytirish" yoqilgan bo'lsa transform animatsiyalari o'chadi; opacity
// esa qoladi, shuning uchun qatorlar o'zi ham useReducedMotion'ga qaraydi
import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const yadro = () =>
  import("./harakat-imkoniyatlari.ts").then((m) => m.default);

export function HarakatSozlamasi({
  children,
}: {
  children: ReactNode;
}) {
  return (
    // strict — to'liq motion.* ni LazyMotion ichida taqiqlaydi (u butun
    // yadroni birinchi yuklashga qaytaradi: +26 KB gzip). Lekin tekshiruv
    // faqat Node'da ishlaydi (Motion `typeof process` ga qaraydi):
    // brauzerda — dev'da ham, build'da ham — JIM. Vitest'da ham ushlamaydi:
    // testlar App'ni bu provider'siz chizadi. Haqiqiy himoya — lint
    // (eslint.config.js: motion/react dan `motion` importi taqiqlangan)
    <LazyMotion features={yadro} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
