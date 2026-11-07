// vitest-sozlash.ts — har test faylidan oldin. Testing Library har
// testdan keyin chizilganni o'zi tozalaydi, lekin faqat global afterEach
// bo'lsa (globals: true). Bizda importlar aniq — tozalashni o'zimiz ulaymiz
import { afterAll, afterEach } from "vitest";
import { server } from "./msw/node.ts";
import { serverRoyxati } from "./msw/soxta-api.ts";
import { fabrikaniTikla } from "./yordamchi/fabrika.ts";
import { cleanup, configure } from "@testing-library/react";
// 22/#04: jest-dom matcherlari (izoh va tur — jest-dom.ts da)
import "./jest-dom.ts";

afterEach(cleanup);

// 22/#05: React'ga "bu test muhiti" deyiladi — act() dan tashqaridagi
// state yangilanishi "not wrapped in act(...)" ogohlantirishini beradi.
// Testing Library buni o'zi faqat global beforeAll bo'lsa (globals: true)
// yoqadi; bizda globals yo'q — aks holda ogohlantirishlar jim qoladi.
// Tur: lib.dom va @types/react'da bu global e'lon qilinmagan
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// 22/#15: findBy*/waitFor kutishi 1 s (sukut) → 3 s. O'lchandi: parallel
// yuk ostida (ikkinchi vitest fonda) faylning BIRINCHI testi — sovuq
// import, birinchi MSW so'rovi, router — 1.6–1.7 s oldi va 3 urinishdan
// birida 2 test yiqildi (VazifaSahifasi, VazifaTahriri). Xato rost bo'lsa
// test baribir yiqiladi — faqat 3 s kechroq
configure({ asyncUtilTimeout: 3000 });

// Tarmoq — MSW (22/#07): fetch HAQIQIY so'rov yuboradi, MSW uni tarmoq
// darajasida ushlaydi (tekshiruv/msw/soxta-api.ts). 17/#28 dagi qo'lda
// vi.fn() fetch o'rniga: URL, metod va tana ham tekshiriladi.
// listen() — MODUL darajasida, beforeAll da EMAS: server-sinxron.ts api
// klientini import paytida yaratib globalThis.fetch ni o'shanda oladi;
// beforeAll test faylining importlaridan KEYIN ishlaydi — MSW kech qoladi
// (o'lchandi). Handler yo'q so'rov — xato (tarmoqqa chiqmaydi)
server.listen({ onUnhandledFrame: "error" });
afterEach(() => {
  server.resetHandlers();
  serverRoyxati();
  fabrikaniTikla();
});
afterAll(() => server.close());

// jsdom'da matchMedia yo'q (17/#42: TemaProvider tizim temasini
// useSyncExternalStore bilan o'qiydi) — doim "yorug'" tizim
globalThis.matchMedia ??= (sorov: string) =>
  ({
    matches: false,
    media: sorov,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

// 21/#02: komponentlar matnni t() dan oladi — i18next sozlangan bo'lishi
// kerak (aks holda t() kalitning o'zini qaytaradi: "hisob.matn").
// O'zbekcha build'da — sozlash sinxron, testlar o'zbekcha matnni ko'radi
import "../src/i18n/index.ts";
