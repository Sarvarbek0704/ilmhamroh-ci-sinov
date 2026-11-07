// node.ts — 22/#07: MSW Node serveri (Vitest, jsdom/node). fetch'ni
// tarmoq darajasida ushlaydi. Ulash — vitest-sozlash.ts; test faylida
// bitta test uchun xulq: server.use(tarmoqYoq) (soxta-api.ts)
import { setupServer } from "msw/node";
import { handlerlar } from "./soxta-api.ts";

export const server = setupServer(...handlerlar);
