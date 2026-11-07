// brauzer-sozlash.ts — 22/#08: Browser Mode (haqiqiy Chrome) testlaridan
// oldin. jsdom sozlamasidan farqi: matchMedia, showModal — brauzerning
// o'zida; tarmoq — MSW service worker'i (msw/brauzer.ts)
import { afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { worker } from "./msw/brauzer.ts";
import { serverRoyxati } from "./msw/soxta-api.ts";
import "./jest-dom.ts";
import "../src/i18n/index.ts";

// Top-level await: SW ro'yxatdan o'tib, sahifani boshqarguncha kutadi —
// aks holda birinchi so'rovlar ushlanmay tarmoqqa ketadi.
// Faqat API so'rovlari xato: Vite modul so'rovlari ham SW orqali o'tadi
await worker.start({
  quiet: true,
  onUnhandledFrame: "bypass",
});

afterEach(() => {
  cleanup();
  worker.resetHandlers();
  serverRoyxati();
});
afterAll(() => worker.stop());
