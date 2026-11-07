// brauzer.ts — 22/#08: MSW brauzerda (Vitest Browser Mode). Handlerlar —
// Node bilan o'sha (soxta-api.ts); farqi — ushlovchi: Node'da fetch
// o'ramasi (interceptor), brauzerda HAQIQIY service worker
// (tekshiruv/msw/ommaviy/mockServiceWorker.js — npx msw init bilan
// yaratiladi; ilova public/ iga EMAS: u yerda ilovaning o'z sw.js i bor)
import { setupWorker } from "msw/browser";
import { handlerlar } from "./soxta-api.ts";

export const worker = setupWorker(...handlerlar);
