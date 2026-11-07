// .storybook/main.ts — 22/#11: Storybook 10 (React + Vite). Komponent
// alohida, ilovasiz: holatlarini (variant, bo'sh, xato) bitta-bitta ko'rish.
// Vite sozlamasi — loyihaniki (vite.config.ts: React, Tailwind, @/), lekin
// ilovaga xos plaginlar olib tashlanadi: SW qobig'i (vazifalar-qobiq —
// aks holda storybook-static ga ilovaning sw.js i yoziladi, o'lchandi),
// 404.html nusxasi, dev serverlari (jonli, kuzatuv, AI soxta)
import type { StorybookConfig } from "@storybook/react-vite";

const ILOVA_PLAGINLARI = /^(vazifalar-|spa-zaxira$|blocking-render$)/;

function ilovaPlaginimi(plagin: unknown): boolean {
  return (
    typeof plagin === "object" &&
    plagin !== null &&
    "name" in plagin &&
    typeof plagin.name === "string" &&
    ILOVA_PLAGINLARI.test(plagin.name)
  );
}

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  // 22/#12: a11y paneli (axe) va story'larni Vitest testiga aylantirish
  addons: ["@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  viteFinal: (sozlama) => ({
    ...sozlama,
    plugins: (sozlama.plugins ?? [])
      .flat()
      .filter((p) => !ilovaPlaginimi(p)),
  }),
};
export default config;
