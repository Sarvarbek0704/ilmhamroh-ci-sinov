// csv.ts — CSV yozish va o'qish (21/#15). Kutubxonasiz: PapaParse 5.7.0
// o'lchandi (+6.6 KB gzip, CSP 0 — natijalar/tajriba/kutubxonalar-21.txt),
// lekin bizga RFC 4180 ning kichik qismi kerak: vergul, qo'shtirnoq,
// qator ichidagi yangi qator. Statistika CSV'si (18-qism) ham shu yerdan.
// Excel uchun: boshida BOM (UTF-8 — o'zbek/kirill harflari buzilmaydi),
// qatorlar CRLF. Sof funksiyalar — Vitest (node muhiti) (tekshiruv/csv.test.js)
import type { Natija, VazifaMalumoti } from "./turlar.ts";
import { Vazifa } from "./vazifa.ts";

const BOM = "﻿";

/**
 * Bitta katak: vergul, qo'shtirnoq yoki yangi qator bo'lsa — qo'shtirnoq
 * ichida (ichidagi " → ""). = + - @ bilan boshlansa — oldiga ' (formula
 * injection: Excel katakni formula deb bajarmasin; OWASP CSV Injection)
 */
export function csvKatak(qiymat: string | number | boolean): string {
  let matn = String(qiymat);
  if (/^[=+\-@\t\r]/.test(matn)) {
    matn = `'${matn}`;
  }
  return /[",\n\r]/.test(matn)
    ? `"${matn.replaceAll('"', '""')}"`
    : matn;
}

/** Qatorlar → CSV matni (BOM + CRLF) */
export function csvYoz(
  qatorlar: readonly (readonly (string | number | boolean)[])[],
): string {
  return `${BOM}${qatorlar.map((q) => q.map(csvKatak).join(",")).join("\r\n")}\r\n`;
}

/**
 * CSV matni → qatorlar (RFC 4180): holat mashinasi, bir o'tishda.
 * BOM tashlanadi, CRLF/LF ikkalasi ham, bo'sh qatorlar o'tkaziladi.
 * Ajratgich — vergul yoki nuqta-vergul (Excel'ning ru/uz sozlamasi ";"
 * bilan saqlaydi): birinchi qatordan aniqlanadi
 */
export function csvOqi(matn: string): string[][] {
  const toza = matn.startsWith(BOM) ? matn.slice(1) : matn;
  const birinchiQator = toza.split(/\r?\n/, 1)[0] ?? "";
  const ajratgich =
    (birinchiQator.match(/;/g)?.length ?? 0) >
    (birinchiQator.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const qatorlar: string[][] = [];
  let qator: string[] = [];
  let katak = "";
  let qoshtirnoqda = false;
  for (let i = 0; i < toza.length; i++) {
    const belgi = toza[i];
    if (qoshtirnoqda) {
      if (belgi === '"' && toza[i + 1] === '"') {
        katak += '"';
        i++;
      } else if (belgi === '"') {
        qoshtirnoqda = false;
      } else {
        katak += belgi;
      }
    } else if (belgi === '"') {
      qoshtirnoqda = true;
    } else if (belgi === ajratgich) {
      qator.push(katak);
      katak = "";
    } else if (belgi === "\n" || belgi === "\r") {
      if (belgi === "\r" && toza[i + 1] === "\n") {
        i++;
      }
      qator.push(katak);
      katak = "";
      if (qator.some((k) => k !== "")) {
        qatorlar.push(qator);
      }
      qator = [];
    } else {
      katak += belgi;
    }
  }
  qator.push(katak);
  if (qator.some((k) => k !== "")) {
    qatorlar.push(qator);
  }
  return qatorlar;
}

/** Vazifalar → CSV: sarlavha qatori + har vazifa (Excel'da ochiladi) */
export function vazifalarCsv(
  vazifalar: readonly VazifaMalumoti[],
): string {
  return csvYoz([
    ["id", "matn", "bajarildi"],
    ...vazifalar.map((v) => [
      v.id,
      v.matn,
      v.bajarildi ? "ha" : "yo'q",
    ]),
  ]);
}

const HA = new Set(["ha", "true", "1", "yes", "да", "x", "✓"]);
const YOQ = new Set(["yo'q", "yoq", "false", "0", "no", "нет", ""]);

/**
 * CSV → vazifalar (import). Ustunlar sarlavhadan: "matn" majburiy,
 * "bajarildi" ixtiyoriy (ha/yo'q, true/false, 1/0). id — qayta beriladi
 * (1, 2, 3 …): boshqa ro'yxatdan kelgan id'lar to'qnashmasin. Formula
 * himoyasi uchun qo'shilgan ' olib tashlanadi
 */
export function csvdanVazifalar(
  matn: string,
): Natija<VazifaMalumoti[], string> {
  const [sarlavha, ...qatorlar] = csvOqi(matn);
  if (sarlavha === undefined) {
    return { ok: false, xato: "CSV bo'sh." };
  }
  const nomlar = sarlavha.map((n) => n.trim().toLowerCase());
  const matnUstuni = nomlar.indexOf("matn");
  const holatUstuni = nomlar.indexOf("bajarildi");
  if (matnUstuni === -1) {
    return { ok: false, xato: "CSV'da «matn» ustuni yo'q." };
  }
  const vazifalar: VazifaMalumoti[] = [];
  for (const [i, qator] of qatorlar.entries()) {
    const raqam = i + 2; // foydalanuvchi uchun: 1-qator — sarlavha
    const xom = (qator[matnUstuni] ?? "").trim();
    const vazifaMatni = /^'[=+\-@]/.test(xom) ? xom.slice(1) : xom;
    if (vazifaMatni === "") {
      return { ok: false, xato: `${raqam}-qatorda matn bo'sh.` };
    }
    if (vazifaMatni.length > Vazifa.MAKS_UZUNLIK) {
      return { ok: false, xato: `${raqam}-qatorda matn juda uzun.` };
    }
    const holat = (qator[holatUstuni] ?? "").trim().toLowerCase();
    if (!HA.has(holat) && !YOQ.has(holat)) {
      return {
        ok: false,
        xato: `${raqam}-qatorda «bajarildi» noto'g'ri: «${holat}».`,
      };
    }
    vazifalar.push({
      id: vazifalar.length + 1,
      matn: vazifaMatni,
      bajarildi: HA.has(holat),
    });
  }
  return { ok: true, qiymat: vazifalar };
}
