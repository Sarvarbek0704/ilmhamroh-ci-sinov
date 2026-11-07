// profil.ts — <Profiler onRender> (18/#22). onRender faqat dev'da va
// profil build'da (npm run build:profil — react-dom/profiling) chaqiriladi;
// oddiy production build'da React uni umuman chaqirmaydi (xarajat yo'q).
// Natija — User Timing: performance.measure. Chrome Performance panelida
// "Timings" yo'lagida ko'rinadi, skript esa
// performance.getEntriesByType("measure") bilan o'qiydi (olchov/profil.mjs)
import type { ProfilerOnRenderCallback } from "react";

export const chizildi: ProfilerOnRenderCallback = (
  id,
  faza, // "mount" | "update" | "nested-update"
  haqiqiy, // actualDuration: shu commit'da daraxtni chizish (ms)
  asosiy, // baseDuration: memo'siz hammasini chizish taxmini (ms)
  boshlandi, // startTime
) => {
  performance.measure(`⚛ ${id} ${faza}`, {
    start: boshlandi,
    duration: haqiqiy,
    detail: { haqiqiy, asosiy },
  });
};
