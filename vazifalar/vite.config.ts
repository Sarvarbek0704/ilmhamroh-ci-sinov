// vite.config.ts — build sozlamasi (16/#20). Vite index.html dan
// boshlab import grafini quradi: main.tsx → App.tsx → ... va
// hammasini bir nechta faylga (chunk) yig'adi
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { jonliPlagini } from "./skriptlar/jonli.js";
import { kuzatuvPlagini } from "./skriptlar/kuzatuv.js";
import { aiSoxtaPlagini } from "./skriptlar/ai-soxta.js";
import { qobiqPlagini } from "./skriptlar/qobiq.js";

// Funksiya ko'rinishi (16/#28): rejim (mode) — "development" (npm run
// dev) yoki "production" (npm run build) — bo'yicha .env.<mode> o'qiladi
export default defineConfig(({ mode }) => {
  // "" — VITE_ siz qiymatlar ham (API_PROXY): ular faqat shu faylda,
  // brauzer kodiga faqat VITE_ bilan boshlanganlari tushadi
  const env = loadEnv(mode, process.cwd(), "");
  // .env.<mode> yo'q yoki qiymat unutilgan bo'lsa, Vite jim
  // "undefined" yozib yuboradi (o'lchandi) — build'ni to'xtatamiz
  if (!env.VITE_API_URL) {
    throw new Error(
      `VITE_API_URL yo'q: .env.${mode} faylini tekshiring`,
    );
  }
  return {
    plugins: [
      // React (17/#02): .tsx dagi JSX → jsx() chaqiruvlari (Oxc) va
      // dev'da Fast Refresh — komponent state'i saqlangan holda yangilanadi
      react(),
      // 20/#02: Tailwind CSS v4 — vazifalar.css dagi @import/@theme ni
      // qayta ishlaydi, src/ dagi sinflardan faqat ishlatilganlarini yozadi
      tailwindcss(),
      // Service Worker qobig'i: hash'li fayl nomlari dist/sw.js ga
      qobiqPlagini(),
      // 19/#18: Server-Sent Events — faqat npm run dev (apply: "serve")
      jonliPlagini(),
      // 21/#18–#19: analitika va xatolarni qabul qiluvchi — faqat dev
      kuzatuvPlagini(),
      // 21/#26: soxta AI oqimi — faqat dev
      aiSoxtaPlagini(),
      {
        // SPA zaxirasi (19/#02): GitHub Pages /vazifalar/vazifa/2 ni
        // topolmaydi (bunday fayl yo'q) va 404.html ni beradi — u
        // index.html ning nusxasi bo'lsa, ilova ochiladi va sahifani
        // router tanlaydi (HTTP status — 404). Vercel'da kerak emas:
        // vercel.json "rewrites" index.html ni 200 bilan beradi
        name: "spa-zaxira",
        apply: "build",
        writeBundle(chiqish) {
          const papka = chiqish.dir ?? "dist";
          copyFileSync(
            resolve(papka, "index.html"),
            resolve(papka, "404.html"),
          );
        },
      },
      {
        // Vite <script type="module"> ni o'zi qayta yozadi (hash'li nom
        // bilan) va blocking="render" tushib qoladi. U kerak (13/#30):
        // ro'yxat birinchi kadrda chiziladi, CLS 0
        name: "blocking-render",
        transformIndexHtml: {
          order: "post",
          handler: (html) =>
            html.replace(
              '<script type="module" crossorigin',
              '<script type="module" blocking="render" crossorigin',
            ),
        },
      },
    ],
    // 19/#02: yo'llar ABSOLYUT ("/vazifalar/assets/..."). 18-qismgacha
    // nisbiy edi ("./") — bitta sahifada ishlardi; /vazifalar/vazifa/2
    // dan esa "./assets/" → /vazifalar/vazifa/assets/ (404, o'lchandi:
    // natijalar/01-chuqur-havola-v8.txt). Papka nomi — BASE_PATH dan
    // (pages.yml: repo nomi), bo'lmasa "/" (Vercel, lokal sinov)
    base: env.BASE_PATH || "/",
    // 21/#19: reliz nomi xato yozuvlariga (kuzatuv/xatolar.ts): Actions'da
    // commit SHA, lokal build'da "lokal"
    define: {
      __RELIZ__: JSON.stringify(
        process.env.GITHUB_SHA?.slice(0, 7) ?? "lokal",
      ),
    },
    server: {
      // Dev proxy (16/#32): /api/... → API_PROXY (.env.development).
      // changeOrigin — Host sarlavhasi API_PROXY nomiga almashadi
      proxy: env.API_PROXY
        ? {
            "/api": { target: env.API_PROXY, changeOrigin: true },
            // 25-qism: o'z backend'imiz /v1 da (vazifalar-api).
            // 28-qism: changeOrigin YO'Q — Host brauzerdagidek qoladi (prod'da
            // nginx ham "proxy_set_header Host $host"). changeOrigin: true da
            // API CSRF tekshiruvi (Origin === o'z origin'i) Origin 4382 ≠ Host
            // 4381 ni ko'rib, cookie'li POST/PATCH/DELETE ni 403 qildi
            // (o'lchandi: natijalar/tajriba/t-frontend-oldin.txt)
            "/v1": { target: env.API_PROXY },
          }
        : undefined,
    },
    resolve: {
      alias: {
        // 20/#02: import "@/ui/cn.ts" → src/ui/cn.ts (tsconfig.app.json
        // "paths" bilan bir xil; Vite tsconfig'ni o'zi o'qimaydi)
        "@": resolve(import.meta.dirname, "src"),
        // npm run build:profil (18/#22): react-dom'ning profiling build'i —
        // <Profiler onRender> va Performance panelidagi React treklari
        // production'da ham. Oddiy build'ga ta'sir qilmaydi
        ...(mode === "profil"
          ? { "react-dom/client": "react-dom/profiling" }
          : {}),
        // npm run dev: index.html dagi <script src="assets/js/tema.js">
        // ni src/tema.ts ga yo'naltiramiz (Vite uni JS qilib beradi).
        // Build'da kerak emas — u yerda tema.js shu nom bilan yoziladi
        "/assets/js/tema.js": "/src/tema.ts",
      },
    },
    build: {
      // profil build alohida papkaga — dist/ (deploy) bilan aralashmasin
      outDir: mode === "profil" ? "dist-profil" : "dist",
      // Qaysi brauzerlar uchun (16/#22). Vite sintaksisni shu
      // versiyalarga moslaydi, lekin API'ni (Object.groupBy...) QO'SHMAYDI
      // — polyfill yo'q. Vite'ning "baseline-widely-available" i — 2026-01-01
      // ro'yxati (chrome111, firefox114, safari16.4), bizning kodda
      // esa Object.groupBy (royxat.ts) — Chrome 117, Firefox 119, Safari
      // 17.4 dan (web-features 3.40: Baseline widely available 2026-09)
      target: ["chrome117", "edge117", "firefox119", "safari17.4"],
      // <link rel="modulepreload"> shu brauzerlarning hammasida bor —
      // Vite qo'shadigan polyfill kerak emas
      modulePreload: { polyfill: false },
      // Source map (16/#24): DevTools minifikatsiya qilingan koddagi xatoni
      // asl .ts fayl va qatorga qaytaradi. Repo ochiq (Pages) — xaritada
      // sir yo'q; .map faqat DevTools ochilganda yuklanadi
      sourcemap: true,
      rolldownOptions: {
        input: {
          index: "index.html",
          // tema.ts — <head> dagi ODDIY skript (modul emas): sahifa
          // chizilishidan oldin ishlaydi. Vite type="module" siz
          // <script> ni yig'maydi — alohida kirish nuqtasi qilamiz
          tema: "src/tema.ts",
        },
        output: {
          // profil build: funksiya nomlari saqlanadi — Performance
          // panelidagi "Components ⚛" trekida "It, Nt" emas, "App,
          // VazifaQatori" (18/#22; o'lchandi). Oddiy build'da — yo'q
          keepNames: mode === "profil",
          // tema.js nomi o'zgarmaydi: index.html shu nom bilan so'raydi
          entryFileNames: (chunk) =>
            chunk.name === "tema"
              ? "assets/js/tema.js"
              : "assets/[name]-[hash].js",
        },
      },
    },
  };
});
