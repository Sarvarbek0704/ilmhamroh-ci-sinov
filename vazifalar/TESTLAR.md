# Testlar — vazifalar v12 (22-qism)

22/#01 dagi xarita (v11: unit + komponent, e2e/vizual/a11y — 0) endi
to'ldirilgan. Bu fayl — qaysi qavatda nima bor, qanday ishga tushadi va
beqaror (flaky) test bilan nima qilinadi.

## Qavatlar

| Qavat | Vosita | Qayerda | Buyruq | Soni |
|---|---|---|---|---|
| Statik | tsc, ESLint, Prettier, knip, commitlint | butun loyiha | `npm run check` | 5 vosita |
| Unit (sof mantiq) | Vitest, `node` muhiti | `tekshiruv/*.test.js` | `npm test` | 255 |
| Komponent / integratsiya | Vitest + jsdom + Testing Library + MSW | `tekshiruv/*.test.tsx` | `npm test` | 94 |
| Komponent, haqiqiy brauzer | Vitest Browser Mode (Chrome) + MSW worker | `tekshiruv/*.brauzer.tsx` | `npm run test:brauzer` | 6 |
| Story'lar (render, play, a11y) | Storybook + addon-vitest + addon-a11y | `stories/*.stories.tsx` | `npm run test:storybook` | 12 |
| E2E | Playwright (production build, `page.route`) | `e2e/asosiy`, `tarmoq` | `npm run test:e2e` | 9 + kirish |
| A11y | `@axe-core/playwright` + klaviatura oqimi | `e2e/a11y.spec.ts` | `npm run test:e2e` | 11 |
| Vizual | Playwright `toHaveScreenshot` | `e2e/vizual.spec.ts` | `npm run test:vizual` | 6 |
| Coverage | `@vitest/coverage-v8`, chegara | `src/**` | `npm run test:qamrov` | satr ≥ 60 % |
| Tarmoq (haqiqiy API) | Vitest | `tekshiruv/*.tarmoq.js` | `npm run test:tarmoq` | 2 (qo'lda) |

CI — `.github/workflows/test.yml` (unit, brauzer + storybook, e2e). Vizual — CI'da
yo'q: oltin rasmlar Windows'da (`*-win32.png`), Linux uchun alohida yaratiladi.

## Test ma'lumotlari

- Vitest: `tekshiruv/yordamchi/fabrika.ts` — `vazifa({ matn: "Non" })`,
  `vazifalar(250, (i) => ({ bajarildi: i % 3 === 0 }))`. Faqat test uchun
  muhim maydon yoziladi; id — hisoblagich (har testdan keyin tiklanadi).
- Server: MSW (`tekshiruv/msw/soxta-api.ts`) — `serverRoyxati(...)`,
  bitta test uchun `server.use(tarmoqYoq | server500 | yozuvXatosi)`.
- E2E: `e2e/soxta-api.ts` (`page.route`), kirish — `storageState`.
- Tasodifiy ma'lumot (faker) ishlatilmaydi: yiqilgan testni aynan takrorlash kerak.

## Beqaror (flaky) testlar

1. **Topish.** Vitest: `npx vitest run --project komponent` ni fonda yana bitta
   ishga tushirib (yuk ostida) 5 marta; Playwright: `npx playwright test
   --project=chrome --repeat-each=10`. CI'da `retries: 2` — 2-urinishda o'tgan
   test hisobotda **flaky** bo'lib chiqadi (yashil, lekin ogohlantirish).
2. **Sababni tuzatish, kutishni oshirmaslik.** Odatiy sabab — vaqtga tayanish:
   sinxron `expect` o'rniga `findBy*` / `waitFor` / `expect.poll`, `sleep`
   yo'q. Kutish chegarasini oshirish — faqat o'lchangan sabab bilan
   (`asyncUtilTimeout: 3000` — vitest-sozlash.ts dagi izoh).
3. **Karantin** (tuzatish darhol bo'lmasa): testga teg —
   `test("...", { tag: "@karantin" }, ...)` va izohda issue havolasi + sana.
   `npm run test:e2e` uni o'tkazib yuboradi (`--grep-invert @karantin`),
   `npm run test:karantin` alohida, 3 urinish bilan ishga tushiradi.
   Qoida: karantinda **14 kundan ortiq** test qolmaydi — tuzatiladi yoki
   o'chiriladi (test kodni himoya qilmasa, u faqat shovqin). Vitest'da —
   `test.skip` + o'sha izoh; `test.fixme` (Playwright) — "ma'lum xato".

## Ma'lum cheklovlar

- jsdom'da `HTMLDialogElement.showModal` yo'q — dialog va buyruqlar oynasi
  testlari `*.brauzer.tsx` da.
- Coverage faqat `npm test` testlaridan (Browser Mode va story'lar kirmaydi).
- `tsconfig.storybook.json` da `skipLibCheck` — Storybook turlari TypeScript 7 bilan mos emas.
