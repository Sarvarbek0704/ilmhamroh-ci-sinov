# Vazifalar

React 19 va TypeScript'da yozilgan vazifalar ro'yxati (v11; v10 — UI kutubxonalar, v9 — routing,
server state va formalar, v8 — React
chuqur, v7 — React asoslari, v6 — o'sha ilova freymvorksiz).
Qo'shish, belgilash, tahrirlash, o'chirish (tasdiq oynasi bilan),
filtr, qidiruv (moslik belgilanadi) va saralash (qo'shilgan
tartibda, yangilari oldin, alifbo bo'yicha); statistika, teglar
(yozayotganda mavjud teglardan taklif), JSON eksport va import —
matn yoki fayl (tanlash yoki sudrab tashlash). Ro'yxat brauzerda
saqlanadi va «Bahor» mashq API bilan sinxronlanadi. Yorug' va
qorong'i tema. Telefonga ilova kabi o'rnatiladi va internetsiz
ochiladi (PWA). Klaviatura va ekran o'quvchi bilan ishlaydi.
v8 (18-qism): batafsil statistika (teglar, ko'p uchragan so'zlar,
CSV/JSON hisobot), 10 000 vazifada ham tez (virtual ro'yxat), mashq
kirishi (ism bilan; chiqish — hamma tablarda).
v9 (19-qism): sahifalar (ro'yxat, vazifa sahifasi va uning tahriri,
statistika, sozlamalar, 404), server holati — TanStack Query keshida,
formalar — React Hook Form + Zod (ko'p qadamli forma, teg combobox),
sozlamalar va e'lon — Zustand store, profil rasmi (IndexedDB).
v10 (20-qism): Tailwind CSS v4 (tokenlar @theme'da), shadcn/ui usulidagi
komponentlar (Radix menyu va tooltip, cva tugma; `@/` alias, components.json),
lucide ikonkalar, Ctrl+K buyruqlar oynasi (cmdk — birinchi ochilishda
yuklanadi), teglar jadvali (TanStack Table, ustun bo'yicha saralash),
«Tartiblash» rejimi — vazifalar tartibini sudrab o'zgartirish (dnd-kit, rejim
yoqilganda yuklanadi; klaviatura bilan ham), bo'sh/yuklanish holatlari, animatsiyalar (CSS va Motion;
prefers-reduced-motion hisobga olinadi).
v11 (21-qism): to'rt til — o'zbekcha (lotin va kirill), ruscha, inglizcha
(react-i18next; til manzilda: /ru/…, /uz-cyrl/…, /en/…), vazifa izohi
Markdown'da (xavfsiz chizish), teglar grafigi (o'z SVG), profil rasmini kesish,
CSV eksport/import (Excel uchun), vazifa havolasi QR kodi, «Joyini tanlab
saqlash» (Chrome/Edge), anonim statistika va xatolar kuzatuvi (o'zimizniki;
production'da manzil yo'q — yuborilmaydi), feature flag'lar, AI yordamchi
(faqat dev — soxta oqim), «Yangi versiya tayyor — Yangilash», internetsiz
yozuvlar navbati (qaytganda yuboriladi, konflikt aytiladi), sahifalar kech
yuklanadi, canonical/hreflang.

Sayt: https://login.github.io/vazifalar/ (GitHub Pages; Vercel'ga
o'tish — pastda, "Deploy").

## Qanday ishlaydi

- Kirish — SOXTA (o'rganish uchun): faqat ism, parol va server yo'q;
  ism shu brauzerda saqlanadi. «Chiqish» — hamma ochiq tablarda
  (`BroadcastChannel`). Bu faqat ko'rinishni yashiradi — haqiqiy
  himoya serverda (28-qism).
- Ochilishda ro'yxat darhol `localStorage` dan (kesh), keyin
  serverdan olinadi. Haqiqat manbai — server.
- O'zgarish avval ekranda ko'rinadi (optimistic update,
  `useOptimistic`), keyin serverga ketadi; xotiraga va boshqa tablarga
  — faqat server tasdiqlagani (yangi vazifa id'si — serverdan). Server
  rad etsa — ekran o'zi oldingi holatiga qaytadi, sababi e'lon qilinadi;
  forma matni maydonda qoladi.
- Sahifalar — React Router 8 (data mode, `src/marshrutlar.tsx`):
  `/`, `/vazifa/:id` (loader, action, errorElement), `/vazifa/:id/tahrir`,
  `/yangi`, `/statistika`, `/sozlamalar`, `/kirish`, `*` (404).
  Himoyalangan sahifalar — `Himoyalangan` (yo'lsiz layout marshrut);
  kirmagan — `/kirish?keyin=...` (faqat ilova ichidagi yo'l).
- Server holati — TanStack Query (`server-sinxron.ts`): bitta kesh hamma
  sahifa uchun (30 s ichida qaytilsa — so'rovsiz), yozuvlar — `useMutation`,
  ekrandagi optimistik qatlam — `useOptimistic`. Server javobi —
  Zod sxemasi bilan tekshiriladi (`api-sxema.ts`, `zod/mini`).
- Mijoz holati (e'lon, sozlamalar) — Zustand (`ilova-holati.ts`,
  sozlamalar `persist` bilan localStorage'da).
- Filtr va saralash URL'da: `?filtr=faol&saralash=alifbo`
  (`useSearchParams`). «Orqaga» tugmasi ishlaydi. Qidiruv URL'ga
  yozilmaydi.
- Real-time (boshqa qurilmadagi o'zgarish) — FAQAT `npm run dev` da:
  dev server Server-Sent Events yuboradi (`skriptlar/jonli.js`);
  production'da yo'q.
- Qidiruv katta-kichik harf, o'zbekcha apostrof (`'` `‘` `’` `ʻ`)
  va ortiqcha bo'shliqlarga qaramaydi: «o'quv» «Oʻquv» ni topadi.
- Alifbo bo'yicha saralash — `Intl.Collator("uz")`. Chrome'da
  o'zbekcha qoidalar yo'q (brauzer tiliga o'tadi) — TEXNIK-QARZ.
- Bir saytning tablari `BroadcastChannel` orqali sinxron.
- Internet yo'q bo'lsa — ro'yxat keshdan, o'zgartirish yopiq.
- Service Worker (`sw.js`) ilova fayllarini keshlaydi
  (network-first): sahifa internetsiz ham ochiladi.
- Yozilayotgan vazifa matni (qoralama) yozish to'xtagach
  saqlanadi (debounce) — sahifa yangilansa ham yo'qolmaydi.
- Tema: tizim, yorug' yoki qorong'i; `prefers-reduced-motion` da
  o'tishlar o'chadi.
- Xavfsizlik: React matnni o'zi ekranlaydi (`{matn}`),
  `dangerouslySetInnerHTML` ESLint bilan taqiqlangan; CSP
  (`<meta>`, Vercel'da — sarlavha ham) va Trusted Types — HTML
  ichidagi skript, begona domen va `innerHTML` ishlamaydi. React
  production build'i inline skript va `eval` ishlatmaydi.
- Tezlik: Core Web Vitals konsolga yoziladi (`web-vitals`). Qidiruvda
  maydon darhol, ro'yxat — kechiktirib (`useDeferredValue`); 200 dan ko'p
  vazifa — faqat ekrandagilari chiziladi (virtualizatsiya); batafsil
  statistika — alohida yuklanadi (`lazy`) va Web Worker'da hisoblanadi.
- Tashqi ma'lumot (fayl, kesh, boshqa tab, server javobi) TS
  turiga ishonilmaydi — ish vaqtida `paket.ts` tekshiradi.

Server kaliti — `localStorage` dagi `vazifalar:kalit`
(`crypto.randomUUID()`). Kalitni bilgan odam ro'yxatni o'qiy va
o'zgartira oladi — uni ulashmang.

## React qismi qanday tuzilgan

- `index.html` → `src/main.tsx` → `<TemaProvider><App/></TemaProvider>`.
  Birinchi chizish — `flushSync` (modul skripti `blocking="render"`:
  sahifa ro'yxat bilan birga paydo bo'ladi, CLS 0).
- `App.tsx` — holat: vazifalar va tahrir — `useReducer`
  (`reducer.ts`, sof funksiya); qidiruv, tarmoq, dialog — `useState`;
  filtr/saralash — URL'dan (`useSyncExternalStore`). Hisob, teglar,
  ko'rinadigan qatorlar — har renderda hisoblanadi (state emas).
- Tashqi tizimlar — effektlar: `localStorage` (saqlash), boshqa tablar
  (`BroadcastChannel`, cleanup bilan), server (`AbortController`),
  oyna hodisalari (`useOynaHodisasi`). Boshqa tablarga yuborish —
  effektda EMAS, hodisa ishlovchisida (aks holda tablar bir-biriga
  cheksiz javob beradi — o'lchangan).
- Fokus — ref'lar: qatorlardagi tugmalar ref Map'da (`tugmaRef`, React
  19 ref cleanup), dialog — `ref` prop (React 19).
- Context: tema (`kontekst/TemaKonteksti.tsx`) va qator hodisalari
  (`kontekst/qator-amallari.ts`) — props zanjirisiz.
- Custom hooklar — `src/hooklar/`: `useOnlayn`, `useMediaQuery`,
  `useOynaHodisasi`, `useElon`, `useUrlTanlovi`.
- Render xatosi — ro'yxat va statistika paneli atrofida error
  boundary (`XatoChegarasi`, «Qayta urinish»); `onCaughtError` /
  `onUncaughtError` — component stack bilan konsolga.
- 18-qism: Actions (`<form action>`, `useActionState`,
  `useFormStatus`, `useOptimistic`), `useTransition`,
  `useDeferredValue`, `Suspense` + `use()`, `lazy`, `<Activity>`,
  portal (e'lon — `<body>` da), `<title>` komponentdan, `<Profiler>`
  (`npm run build:profil`), `memo`/`useMemo` (o'lchanganda),
  compound + headless `Menyu` (`src/ui/`), xususiyat papkalari
  (`src/xususiyatlar/`, ochiq API — `index.ts`), soxta auth (Context).

## Build

`npm run build` — avval `tsc -b` (faqat tekshiradi), keyin
`vite build` (Vite 8 + `@vitejs/plugin-react`: JSX → `jsx()`
chaqiruvlari, Oxc). `dist/` ga hash'li nomlar bilan
(`assets/index-<hash>.js`, `assets/olchov-<hash>.js` — kerak
bo'lganda yuklanadi, `assets/js/tema.js` — nomi o'zgarmaydi).
`sw.js` dagi `QOBIQ` va `VERSIYA` ni build oxirida o'z plaginimiz
yozadi (`skriptlar/qobiq.js`). `dist/` git'ga kirmaydi.

Hajm (brauzer yuklaydigan JS+CSS, gzip -9): v6 — 38.1 KB (14.3 KB),
v7 — 263.1 KB (83.2 KB); farqning deyarli hammasi — `react-dom`.
v8 — ochilishda (index + CSS + tema.js) ~270 KB (gzip ~84.6 KB); statistika
paneli (~6 KB) va uning ishchisi (~1.5 KB) — panel ochilganda.
v9 — ochilishda ~490 KB (gzip ~153.7 KB): React Router (+29 KB gzip),
TanStack Query (+10), React Hook Form va Zod (+15 va +6), Zustand (+1.3)
— o'lchovlar `sinov/19/natijalar/`.
v10 — ochilishda gzip ~202 KB JS + ~4.6 KB CSS: Radix menyu (+27 KB),
Motion (+14; animatsiya yadrosi yana 14.5 KB — keyin yuklanadi), tooltip
(+4), lucide (+2); Tailwind CSS +2 KB. Kerak bo'lganda: buyruqlar oynasi
(cmdk, 6.3 KB — birinchi Ctrl+K), «Tartiblash» rejimi (dnd-kit, 15.4 KB),
teglar jadvali (TanStack Table, +12 KB — statistika paneli bilan).
v11 — ochilishda gzip ~207 KB JS + ~5.1 KB CSS: i18next + react-i18next
(+17), navbat, kuzatuv, flag, SW yangilanishi (~+4); ro'yxatdan boshqa
sahifalar kech yuklanadi (−18.6). Kerak bo'lganda: Markdown (react-markdown,
~46 KB — izohi bor vazifada), QR kod (6 KB), boshqa til fayllari (~1 KB).

- `npm run dev` — dev server: komponent o'zgarsa, state saqlangan
  holda yangilanadi (Fast Refresh). StrictMode dev'da render va
  effektlarni ikki marta sinaydi (birinchi server so'rovi bekor
  qilinadi — kutilgan).
- `npm run preview` — `dist/` ni lokal ko'rish.
- `npm run analiz` — bundle tahlili: `analiz/treemap.html`.
- Sozlamalar: `vite.config.ts`, `vitest.config.ts`; muhit —
  `.env.production`, `.env.development` (`VITE_API_URL`; 21-qismdan dev'da
  `VITE_ANALITIKA_URL`, `VITE_XATO_URL`, `VITE_AI_URL`, `VITE_FLAGLAR`).
- `npm run kirill` — o'zbekcha lotin tarjimalaridan kirill fayllari
  (`src/i18n/uz-Cyrl/`); test eskirgan bo'lsa yiqiladi.
- Brauzerlar: Chrome/Edge 117+, Firefox 119+, Safari 17.4+.

## Deploy

Hozir — GitHub Pages (`.github/workflows/pages.yml`: `npm run check`
→ build → deploy). Sahifalar bor (19-qism): yo'llar ABSOLYUT —
`BASE_PATH` (workflow repo nomidan beradi: `/vazifalar/`); Pages
noma'lum manzilga (`/vazifalar/vazifa/2`) `404.html` ni beradi — u
`index.html` nusxasi (build yozadi), sahifani router tanlaydi (HTTP
status 404 bo'lsa ham). Vercel'da — `vercel.json` rewrites. Vercel uchun `vercel.json` tayyor (build buyrug'i,
`dist`, SPA rewrite, xavfsizlik sarlavhalari: CSP + `frame-ancestors
'none'`, hash'li fayllar — `immutable`, `sw.js` — `no-cache`).
Pages hozircha asosiy. Vercel — o'quvchi o'z hisobi bilan (17/#24):
repo Vercel'da import qilinadi (sozlamalar `vercel.json` dan). Pages
workflow'i qoladi; Vercel asosiy bo'lgach uni o'chirish — keyingi qaror.

## Modullar

React (`.tsx`): `main.tsx`, `App.tsx`, `komponentlar/*.tsx` (bir fayl —
bitta komponent), `kontekst/`, `hooklar/` (jumladan `useOynaVirtual`),
`ui/` (`Tugma`, `Menyu` + `useMenyu`, `useBoshqariladiganHolat`).
Xususiyatlar — `xususiyatlar/statistika/` (panel, hisob, Web Worker) va
`xususiyatlar/auth/` (soxta kirish); tashqaridan faqat `index.ts`.

Sof mantiq (`.ts`, React'siz, `node:test` bilan sinaladi):
`amallar.ts` (o'zgarmas yangilash), `reducer.ts`, `holat.ts`
(tekshiruv, ko'rinadiganlar, qo'shni qator), `royxat.ts`
(`VazifalarRoyxati` — so'rovlar), `vazifa.ts`, `paket.ts`,
`qidiruv.ts`, `saralash.ts`, `prefiks-daraxti.ts`, `teglar.ts`,
`marshrut.ts` (URL), `taymer.ts`, `fayl.ts`, `tema-tanlash.ts`,
`virtual-oraliq.ts` (virtual ro'yxat hisobi).

Tashqi tizimlar: `api.ts` (fetch), `server-sinxron.ts` (sinxron va
optimistik yozuv), `sinxron.ts` (`BroadcastChannel`), `saqlash.ts`
(`localStorage`), `olchov.ts` (Web Vitals), `tema.ts` (`<head>` dagi
oddiy skript), `public/sw.js` (Service Worker), `xavfsiz-manzil.ts`
(Trusted Types siyosati — SW va Worker manzillari).

## Kod qoidalari

- State — o'zgarmas: yangi massiv/obyekt (`amallar.ts`, reducer).
- Hosilaviy qiymat state'da saqlanmaydi — renderda hisoblanadi.
- Effekt — faqat tashqi tizim bilan sinxronlash uchun, har biri
  cleanup bilan. Hodisaga javob — hodisa ishlovchisida.
- `fetch` faqat `api.ts` da, `localStorage` faqat `saqlash.ts` da.
- `any` yo'q, `as` — oxirgi chora; `catch` dagi xato — `unknown`.
- Hooklar qoidalari — `eslint-plugin-react-hooks` (`--max-warnings=0`).
- Ochiq qarzlar — `TEXNIK-QARZ.md`.

## Murakkablik

n — vazifalar soni, L — matn uzunligi (≤ 100), T — turli teglar,
p — yozilgan prefiks, s — shu prefiksli teglar. Sof funksiyalar —
Node 24 (14-qism o'lchovi); chizish — Chrome 154 (17/#24 o'lchovi).

| Amal | Big-O | n = 1 000 | n = 100 000 |
|---|---|---|---|
| Qo'shish (takror tekshiruvi + yangi massiv) | O(n · L) | 0.09 ms | 31 ms |
| Belgilash (`almashtir` — `map`) | O(n) | — | — |
| Filtr (`korinadiganlar`) | O(n log n) | 0.14 ms | 45 ms |
| Qidiruv (`qidir`) | O(n · L) | 2.2 ms | 0.7 s |
| Saralash: alifbo (kalit bir marta) | O(n · L + n log n) | 11 ms | 1.5 s |
| Teg taklifi (Trie so'rovi, `#bo`) | O(p + s log s) | 2 µs | 2 µs |
| Saqlash / sinxron (JSON) | O(n) | 0.6 / 2.6 ms | 0.18 / 0.7 s |

Chizish, 1 000 vazifa (mediana, layout bilan): qidiruvda (1 000 ↔ 112
qator) v6 33–44 ms, v7 36–51 ms; bitta katakni belgilash — v6 47–89 ms
(hamma qator qayta yasaladi), v7 19–39 ms (React faqat o'zgarganini
yangilaydi). 18-qism (Chrome 155, Event Timing — bosishdan kadrgacha):
katak 1 000 vazifada 48 → 24 ms, 10 000 da 264 → 40 ms; qidiruv
(10 000, eng uzun javob) 1 184 → 24 ms; 10 000 vazifa bilan ochilish
~760 → ~175 ms, DOM 50 087 → 154 element (`sinov/18/natijalar`).

## Tekshirish

Avval bir marta: `npm install` (Node 24 — `.nvmrc`; git hook'lar
ham o'rnatiladi). TypeScript ikki nusxada: `tsc` — TS 7
(`@typescript/native`), `typescript` — TS 6 API (typescript-eslint
uchun).

- Hammasi bir buyruqda: `npm run check` (format, lint, tip, test —
  CI'da ham shu).
- Testlar: `npm test` — avval `node --test` (sof mantiq,
  `tekshiruv/*.test.js`, `.ts` ni Node 24 o'zi o'qiydi), keyin
  `vitest run` (komponentlar va hooklar, `tekshiruv/*.test.tsx`,
  jsdom + Testing Library).
- Kod sifati: `npm run lint`, `npm run format:check`,
  `npm run tip` (`tsc -b`: app, node, test tsconfig'lari),
  `npm run knip`.
- Commit: `pre-commit` — lint-staged, `commit-msg` — commitlint.
- Server: `npm run test:tarmoq` (internet kerak).
- Brauzer: `npm run build && npm run preview`, keyin
  `tekshiruv/ssenariy.md`.
- Lighthouse (Mobile): to'rtala toifa ≥ 90 (18-qism o'lchovi —
  `sinov/18/natijalar/lighthouse-yakuniy.txt`; v7 — 98–99 / 100 / 100 /
  100; v6 — 100×4).
- Xatoni sinash: manzilga `?muvaffaqiyatsiz=1` qo'shing — server
  har o'zgarishni rad etadi.

## Litsenziya

MIT — `LICENSE`.
