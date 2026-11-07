# AGENTS.md — vazifalar

Vazifalar ro'yxati ilovasi (v11): React 19.3 + TypeScript, Vite 8
(`@vitejs/plugin-react`). Sahifalar — React Router 8 data mode
(`src/marshrutlar.tsx`, `src/sahifalar/`), server holati — TanStack
Query (`server-sinxron.ts`, bitta `sorovMijozi`), API shartnomasi —
Zod (`api-sxema.ts`, `zod/mini`), mijoz holati — Zustand
(`ilova-holati.ts`), formalar — React Hook Form + zodResolver
(`src/sxemalar/`). UI — `src/App.tsx`, `src/komponentlar/*.tsx`;
qayta ishlatiladigan UI — `src/ui/` (Tugma, Menyu — compound/headless);
xususiyatlar — `src/xususiyatlar/<nomi>/` (statistika, auth), tashqaridan
faqat `index.ts` orqali; sof mantiq — `src/*.ts` (React'siz);
`src/kontekst/`, `src/hooklar/`. PWA (`public/sw.js` — JavaScript,
QOBIQ/VERSIYA ni build yozadi). Ma'lumot «Bahor» mashq API'sida,
localStorage — kesh. Kirish — SOXTA (faqat ism, parol yo'q; 28-qismda —
haqiqiysi). CSP va Trusted Types yoqilgan.
Deploy — GitHub Pages; `vercel.json` tayyor, ulanmagan.

## Buyruqlar
- npm install         (Node 24 — .nvmrc; git hook'lar ham o'rnatiladi)
- npm run check       (format:check + lint + tip + test — CI'da ham)
- npm run dev         (Vite dev server, Fast Refresh, StrictMode)
- npm run build       (tsc -b, keyin vite build -> dist/)
- npm run build:profil (react-dom/profiling -> dist-profil/: <Profiler>
                       va Performance panelidagi React treklari)
- npm run preview     (dist/ ni lokal ko'rish)
- npm test            (node --test — sof mantiq, 190 test; keyin
                       vitest run — komponent/hook, 67 test, jsdom)
- npm run test:tarmoq (haqiqiy API — faqat so'ralganda)
- npm run lint        (ESLint 10 + typescript-eslint typed +
                       eslint-plugin-react-hooks; --max-warnings=0)
- npm run format:check, npm run format (Prettier)
- npm run tip         (tsc -b: app, node, test tsconfig'lari)
- npm run knip        (ishlatilmagan fayl/eksport/paket — toza bo'lsin)
- npm run analiz      (bundle tahlili -> analiz/)

## Kod qoidalari
- Domen nomlari o'zbekcha; komponent — PascalCase (VazifaQatori),
  hook — useX, funksiya — fe'l bilan. Brauzer/React API nomlari
  o'zgarmaydi. Bir fayl — bitta komponent (compound qismlari — bitta
  faylda: Menyu.Tugma, Menyu.Royxat, Menyu.Band).
- Fayl nomlari katta-kichik harfdan boshqa narsasi bilan ham farq
  qilsin: Qidiruv.tsx va qidiruv.ts — Windows'da ESLint project
  service'ni chalkashtirdi (QidiruvMaydoni.tsx qilib hal qilindi).
- State o'zgarmas: yangi massiv/obyekt (amallar.ts, reducer.ts).
  Hosilaviy qiymat (hisob, teglar, ko'rinadiganlar) state'da emas.
- Serverga yozuv — action: optimistik (useOptimistic), tasdiqdan keyin
  asosiy holatga server javobi (server id); rad etilsa qaytarish —
  React'ning o'zi. Yangi yozuv turi — server-sinxron.ts yozuvniYubor.
- Effekt — faqat tashqi tizim bilan sinxronlash, har biri cleanup
  bilan. Hodisaga javob (saqlash tugmasi, boshqa tabga yuborish) —
  hodisa ishlovchisida, effektda EMAS.
- DOM — ref orqali (getElementById emas; istisno: main.tsx ildizi).
  Fokus yozuvdan keyin — fokusniRejala (commit'dan keyin), flushSync
  emas.
- Memo — faqat o'lchanganda (olchov/renderlar.mjs): ro'yxat qatori
  memo — props'da ro'yxatdagi O'SHA obyekt bo'lsin (yangi obyekt yasamang).
- Xususiyat ichiga tashqaridan import — faqat index.ts orqali (ESLint
  no-restricted-imports to'xtatadi).
- Tugma — src/ui/Tugma.tsx (variant: oddiy/asosiy/xavfli; standart
  type="button"; nomi — matn yoki aria-label, tsc talab qiladi).
- Ranglar, oraliqlar, burchaklar — vazifalar.css dagi tokenlar
  (--rang-*, --joy-*, --burchak, --bosish), qiymat yozilmaydi.
- Sof mantiq .ts da, React importisiz — node:test bilan sinaladi.
  Komponent testi — tekshiruv/*.test.tsx (Vitest + Testing Library).
- Import yo'li — fayl nomi aynan ("./holat.ts", "./App.tsx").
  Tur importi — "import type". erasableSyntaxOnly: enum yo'q.
- Umumiy turlar — turlar.ts da, type bilan.
- any yo'q. as — oxirgi chora (izoh bilan); catch'dagi xato unknown.
- Tashqi ma'lumot (fayl, localStorage, BroadcastChannel, server) —
  unknown; paket.ts / foydalanuvchi.ts tekshiruvidan o'tmaguncha
  ishlatilmaydi.
- Kutilgan xato — Natija; dasturchi xatosi — throw. Kutilmaydigan
  Promise — void bilan. Union'dagi har holat — switch + never.
- data-id, data-amal, data-teg, data-filtr atributlari — e2e ssenariy
  va fokus uchun; olib tashlamang (TEXNIK-QARZ 32).

## Taqiqlar
- tsconfig strict bayroqlarini o'chirmang; @ts-ignore,
  @ts-expect-error, eslint-disable — faqat izoh bilan va so'rab.
- fetch faqat api.ts da, localStorage faqat saqlash.ts da
  (istisno: tema.ts — TEXNIK-QARZ 11).
- dangerouslySetInnerHTML, innerHTML, insertAdjacentHTML,
  document.write, eval yo'q (ESLint to'xtatadi).
- CSP'ni yumshatmang (index.html <meta> va vercel.json sarlavhasi bir
  xil bo'lsin): 'unsafe-inline', 'unsafe-eval' yo'q. Yangi tashqi
  domen — avval so'rang. Skript manzili (Worker, SW) — faqat
  xavfsiz-manzil.ts dagi skriptManzili() orqali (Trusted Types).
- Parol, token, haqiqiy shaxsiy ma'lumot localStorage'ga yozilmaydi
  (soxta kirish — faqat ism).
- React Compiler (o'lchandi, kiritilmadi — TEXNIK-QARZ 43), holat
  kutubxonalari (Zustand...), UI kutubxonalari — faqat so'rab.
- Yangi npm paket — faqat so'rab, aniq versiya bilan; yaqinda (bir
  necha kun ichida) chiqqan versiya emas (TEXNIK-QARZ 30).
- dist/, dist-profil/ qo'lda o'zgartirilmaydi va git'ga qo'shilmaydi.
- public/sw.js dagi const VERSIYA / const QOBIQ qatorlari shaklini
  o'zgartirmang.
- CSS — index.html dagi <link> bilan (JS'dan import qilinmaydi).
- import.meta.env — faqat VITE_ bilan; sir .env ga ham yozilmaydi.
- "vazifalar:v3" kaliti va PAKET_VERSIYASI o'zgarmaydi.
- .env, tokenlar, kalit qiymatlari kodga va chatga yozilmaydi.
- git push, force push, deploy (Vercel ham) — faqat so'rab.

## "Tayyor" degani
npm run check va npm run build — toza; npm run knip — toza.
Xulq o'zgargan bo'lsa — avval test, keyin kod.
Commit: Conventional Commits, sarlavha ≤ 72 belgi — commitlint.
Hook'larni --no-verify bilan chetlab o'tmang.

## 19-qism qoidalari (v9)
- Server ma'lumoti — faqat Query keshidan (useVazifalar, royxatSorovi);
  loader — fetchQuery (bitta kesh), komponent — keshdan o'qiydi (loader
  ma'lumoti — zaxira: ota marshrut loader'i Orqaga'da qayta chaqirilmaydi).
- Ro'yxat sahifasida loader YO'Q — birinchi chizish sinxron (CLS 0).
  Router middleware ham yo'q (o'lchandi: birinchi kadrni kechiktiradi).
- Yangi yo'l — marshrutlar.tsx + handle.nonYoli; himoyalangan bo'lsa —
  Himoyalangan ichida; loader o'zi ham kirganini tekshiradi.
- Zod — `zod/mini` (`.check(...)`), `z.config({ jitless: true })` —
  CSP/Trusted Types (eval sinovi buzilish beradi).
- Real-time (SSE) — faqat dev (VITE_JONLI_URL), production build'ga
  tushmasin.

## 20-qism qoidalari (v10)
- Uslub — Tailwind v4 sinflari; ranglar/oraliqlar — faqat @theme tokenlari
  (bg-asosiy, text-ikkinchi, rounded-burchak, min-h-bosish); standart palitra
  o'chirilgan. Preflight YO'Q, eski qoidalar asos.css da (@layer base).
- `cn()` — faqat clsx (tailwind-merge yo'q): className — qo'shimcha joylashuv
  uchun, rang/o'lcham — cva variant orqali.
- shadcn komponentlari `src/ui/` da: `npx shadcn@<aniq versiya> add <nom>`
  (components.json, `@/` alias — tsconfig "paths" + vite/vitest alias), keyin
  qo'lda moslanadi: `cn` — `@/ui/cn.ts` (CLI "cn" paketini qo'yadi), alohida
  `@radix-ui/react-*` paketi (CLI umumiy "radix-ui" ni eng yangi versiyada
  qo'shadi — 7 kunlik versiyaga qotiriladi). `@/` — faqat .tsx va Vite
  ko'radigan fayllarda: node:test tekshiradigan sof .ts — nisbiy yo'l.
- Birinchi sahifaga kerak bo'lmagan og'ir kutubxona — lazy() (18/#09): cmdk
  (BuyruqlarRoyxati), dnd-kit («Tartiblash» rejimi, TartiblashRejimi). Oddiy
  rejimda dnd-kit sensorlari yo'q — INP shunga bog'liq (TEXNIK-QARZ 59).
  Radix modal rejimi (DropdownMenu modal, Dialog) — YO'Q: <style> qo'shadi,
  CSP style-src 'self' to'sadi. Tasdiq oynasi — native <dialog>.
- Portal — `portalJoyi()` (<main>); toast — o'zimizniki (sonner CSP'ni buzadi).
- Animatsiya — faqat opacity/transform, motion-safe: yoki useReducedMotion;
  Motion — LazyMotion + m.* (strict), motion.* import qilinmaydi.
- Yangi paket: `npm view <pkg> time`, 7 kundan eski versiya, --save-exact;
  tranzitiv yangi reliz bo'lsa — overrides (cmdk → @radix-ui/react-dialog 1.2.0).

## 21-qism qoidalari (v11)
- Matn — komponentda emas: `t("kalit")` (react-i18next), fayllar
  `src/i18n/<til>/<ns>.json`. Yangi kalit — avval `uz` ga, keyin ru/en,
  so'ng `npm run kirill` (uz-Cyrl qo'lda yozilmaydi). Kalitlar turi —
  `src/i18n/turlar.d.ts` (noto'g'ri kalit — tsc xatosi). Til — manzilda
  (`i18n/yol.ts`, router basename), localStorage'da emas. Sana — `{{x, sana}}`
  (Chrome'da o'zbek lotin Intl sanasi yo'q — `i18n/sana.ts`).
- Kutubxona qo'shishdan oldin: hajm (gzip, `olchov/hajm.mjs`) va CSP + Trusted
  Types ostida sinov. innerHTML yoki o'z <style> ini qo'shadigan, CDN'dan
  yuklaydigan kutubxona — kanonga kirmaydi (sinov/21/natijalar/tajriba).
- Markdown — faqat `MarkdownMatn` (react-markdown, skipHtml, rasm yo'q).
- Tashqi xizmat (analitika, Sentry, AI, push) — hisob/kalit/DSN YO'Q; manzil
  env'da, production'da bo'sh; dev qabul qiluvchilar — `skriptlar/kuzatuv.js`,
  `skriptlar/ai-soxta.js`. Shaxsiy ma'lumot yuborilmaydi (`kuzatuv/maxfiylik.ts`).
- Yozuv oflayn bo'lsa — navbat (`navbat.ts`), rad etilmaydi; import va
  tartiblash — onlayn talab qiladi.
- sw.js: install'da skipWaiting YO'Q — yangi versiya «Yangilash» bilan
  (`sw-yangilanish.ts`); fayl 404/HTML bo'lsa — eski kesh.
- Ro'yxatdan boshqa sahifa — router `lazy` (marshrutlar.tsx, `sahifa()`).
