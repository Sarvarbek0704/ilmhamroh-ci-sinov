// maxfiy.test.ts — 34 #15: xato hisobotidan (Sentry/GlitchTip) shaxsiy ma'lumot va sirlar olib tashlanadi (beforeSend)
import { test } from "vitest";
import assert from "node:assert/strict";
import type { ErrorEvent } from "@sentry/node";
import { maxfiyTozala } from "../src/kuzatuv/maxfiy.ts";

test("cookie, authorization, so'rov tanasi, email — olib tashlanadi; foydalanuvchidan faqat id qoladi", () => {
  const h = {
    type: undefined,
    request: { cookies: { "__Host-sessiya": "s" }, data: '{"parol":"x"}', headers: { Cookie: "a=b", Authorization: "Bearer vz_x", "User-Agent": "k6" }, query_string: "q=aziz@example.com" },
    user: { id: "7", email: "aziz@example.com", ip_address: "203.0.113.7" },
    exception: { values: [{ type: "TypeError", value: "aziz@example.com uchun xato" }] },
  } as unknown as ErrorEvent;
  const t = maxfiyTozala(h);
  assert.ok(t.request !== undefined);
  assert.equal(t.request.cookies, undefined);
  assert.equal(t.request.data, undefined);
  assert.deepEqual(t.request.headers, { Cookie: "[olib tashlandi]", Authorization: "[olib tashlandi]", "User-Agent": "k6" });
  assert.equal(t.request.query_string, "q=[email]");
  assert.deepEqual(t.user, { id: "7" });
  assert.equal(t.exception?.values?.[0]?.value, "[email] uchun xato");
});
