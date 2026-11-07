// import.meta.env turlari (16/#28): vite/client — MODE, DEV, PROD,
// BASE_URL; o'zimizniki — pastda (.env.production, .env.development)
/// <reference types="vite/client" />

// interface — Vite'ning ImportMetaEnv'i bilan birlashishi uchun
// (declaration merging, 15/T-16; type bilan bo'lmaydi)
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // 19/#18: faqat .env.development (production'da undefined)
  readonly VITE_JONLI_URL?: string;
  // 21/#18–#19: faqat .env.development (production'da yuborilmaydi)
  readonly VITE_ANALITIKA_URL?: string;
  readonly VITE_XATO_URL?: string;
  // 21/#20: build paytidagi flaglar ("nom,-boshqa"; flaglar.ts)
  readonly VITE_FLAGLAR?: string;
  // 21/#26: AI chat oqimi (dev: soxta)
  readonly VITE_AI_URL?: string;
  // 28-qism: vazifalar-api auth yo'llari (sukut "/v1/auth" — bir origin)
  readonly VITE_AUTH_URL?: string;
}

// 21/#19: build'ning nomi (vite.config.ts define): CI'da commit SHA
// (GITHUB_SHA, 7 belgi), lokal — "lokal". Xato yozuvi qaysi build'dan
declare const __RELIZ__: string;
