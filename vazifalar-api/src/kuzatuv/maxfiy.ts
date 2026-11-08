// maxfiy.ts — 34-qism #15 (O-59): xato hisobotidan (Sentry/GlitchTip) shaxsiy ma'lumot va sirlarni olib tashlash — SDK'ga yuborishdan OLDIN (beforeSend).
//   sendDefaultPii: false bo'lsa ham so'rov sarlavhalari/tanasi, foydalanuvchi email'i, xato xabaridagi email kabi narsalar hodisaga tushishi mumkin.
import type { ErrorEvent } from "@sentry/node";

const MAXFIY_SARLAVHALAR = new Set(["cookie", "authorization", "x-api-key", "x-imzo", "set-cookie"]);
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/** hodisani joyida tozalaydi va qaytaradi (null — umuman yubormaslik) */
export function maxfiyTozala(hodisa: ErrorEvent): ErrorEvent {
  const so = hodisa.request;
  if (so !== undefined) {
    delete so.cookies;
    delete so.data;                 // so'rov tanasi (parol, matn) — hech qachon
    if (so.headers !== undefined) {
      for (const k of Object.keys(so.headers)) if (MAXFIY_SARLAVHALAR.has(k.toLowerCase())) so.headers[k] = "[olib tashlandi]";
    }
    if (typeof so.query_string === "string") so.query_string = so.query_string.replace(EMAIL, "[email]");
  }
  if (hodisa.user !== undefined) hodisa.user = hodisa.user.id === undefined ? {} : { id: hodisa.user.id };   // faqat id
  for (const x of hodisa.exception?.values ?? []) if (typeof x.value === "string") x.value = x.value.replace(EMAIL, "[email]");
  return hodisa;
}
