// skriptlar/analiz.js — bundle tahlili (16/#30): npm run analiz.
// Odatdagi build (vite.config.ts) + rollup-plugin-visualizer: qaysi
// modul har chunk'da qancha joy egallaydi. Natija — analiz/ papkasida
// (dist/ ga tushmaydi: saytga ham, Service Worker keshiga ham kerak emas)
import { build } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

await build({
  logLevel: "warn",
  build: { outDir: "analiz/dist", emptyOutDir: true },
  plugins: [
    // treemap — har to'rtburchak bitta modul, maydoni — hajmi
    visualizer({
      filename: "analiz/treemap.html",
      template: "treemap",
      gzipSize: true,
    }),
    // Matn ko'rinishi — terminalda va PR'da o'qish uchun
    visualizer({
      filename: "analiz/royxat.md",
      template: "markdown",
      gzipSize: true,
    }),
  ],
});
console.log("analiz/treemap.html, analiz/royxat.md");
