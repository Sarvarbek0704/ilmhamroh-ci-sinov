// server.ts — 28-qism: vazifalar-api auth yo'llari (/v1/auth/...). Sof
// qism (React'siz) — Vitest bilan sinaladi. So'rov bir origin'da (dev —
// Vite proxy /v1, prod — nginx): cookie sukut bilan (credentials:
// "same-origin") ketadi va keladi; JS uni o'qimaydi
import type { Foydalanuvchi } from "../../turlar.ts";
import { ISM_ENG_KOP, ismXatosi } from "./foydalanuvchi.ts";

const AUTH_URL: string = import.meta.env.VITE_AUTH_URL ?? "/v1/auth";

type AuthSozlamasi = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
};

/** /v1/auth/<yol> ga so'rov (JSON tana bo'lsa — Content-Type bilan) */
export function authSorov(
  yol: "men" | "kirish" | "chiqish",
  { method = "GET", body, signal }: AuthSozlamasi = {},
): Promise<Response> {
  return fetch(`${AUTH_URL}/${yol}`, {
    method,
    signal: signal ?? null,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
}

/**
 * Server javobidagi { foydalanuvchi: { toliqIsm } } → UI kimligi. Javob —
 * tashqi ma'lumot (unknown). Ism UI chegarasidan uzun bo'lsa — qisqartiriladi
 * (serverda chegara boshqacha bo'lishi mumkin); bo'lmasa — null
 */
export function serverIsmi(malumot: unknown): Foydalanuvchi | null {
  if (
    typeof malumot !== "object" ||
    malumot === null ||
    !("foydalanuvchi" in malumot) ||
    typeof malumot.foydalanuvchi !== "object" ||
    malumot.foydalanuvchi === null ||
    !("toliqIsm" in malumot.foydalanuvchi) ||
    typeof malumot.foydalanuvchi.toliqIsm !== "string"
  ) {
    return null;
  }
  const ism = malumot.foydalanuvchi.toliqIsm
    .trim()
    .slice(0, ISM_ENG_KOP);
  return ismXatosi(ism) === null ? { ism } : null;
}
