import { test } from "vitest";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";

// Vitest sukut timeout — 5 s (node:test da yo'q edi): bola jarayon Vite runner bilan yolg'iz ~3 s da ko'tariladi, parallel testlar bilan yuklangan mashinada 20 s dan oshdi (holat 30)
// 33 (holat 00 va 16 da 60 s timeout): o'lchov — bola jarayon BUTUN Nest ilovasini runnerImport bilan o'giradi: tinch mashinada 4.6–13.5 s (33 t16-jarayon-olchov.txt),
// to'liq Vitest yuki ostida 60 s dan oshdi. Ikki tuzatish: (1) bola manzil chiqarmay o'lsa — darhol yiqilish va stderr (avval 60 s jim osilardi);
// (2) ishga tushish uchun alohida, kengroq byudjet (150 s) — tekshiruv mantig'i (201, exit 1, loglar) o'zgarmadi
test("unhandledRejection: log → boshlangan so'rov tugaydi → exit 1 (let it crash)", { timeout: 180_000 }, async () => {
  const bola = spawn(process.execPath, [join(import.meta.dirname, "qolip", "yurgiz.mjs"), join(import.meta.dirname, "qolip", "halokat.ts")], { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  bola.stderr.setEncoding("utf8").on("data", (d: string) => (stderr += d));
  const boshi = performance.now();
  const manzil = await new Promise<string>((resolve, reject) => {
    const vaqt = setTimeout(() => { reject(new Error(`bola jarayon 150 s da ko'tarilmadi; stderr: ${stderr.slice(0, 500)}`)); }, 150_000);
    bola.once("exit", (k) => { clearTimeout(vaqt); reject(new Error(`bola jarayon manzil chiqarmay tugadi (kod ${String(k)}); stderr: ${stderr.slice(0, 500)}`)); });
    bola.stdout.setEncoding("utf8").on("data", (d: string) => {
      stdout += d;
      const m = /http:\/\/[\d.]+:\d+/.exec(stdout);
      if (m) { clearTimeout(vaqt); resolve(m[0]); }
    });
  });
  console.log(`bola jarayon ${(performance.now() - boshi).toFixed(0)} ms da ko'tarildi`);
  const javob = await fetch(`${manzil}/v1/vazifalar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"matn":"x"}' });
  assert.equal(javob.status, 201); // halokatdan keyin ham boshlangan so'rov javob oldi
  const kod = await new Promise<number | null>((r) => bola.on("exit", r));
  assert.equal(kod, 1);
  assert.match(stderr, /unhandledRejection bildirishnoma yuborilmadi/);
  assert.match(stdout, /unhandledRejection: yangi ulanishlar qabul qilinmaydi/);
});

// 33 #26 (regressiya): IPC kanali ochiq (PM2 bola jarayoni kabi) — SIGTERM'dan keyin jarayon O'ZI chiqadi. Avval "to'xtadi" deb yozib, kanal tufayli
// tirik qolardi — PM2 kill_timeout (20 s) dan keyin SIGKILL qilardi (33 natijalar/tajriba/t26-pm2.txt: 2 nusxa stop 40 s)
test("SIGTERM + IPC kanali: jarayon toza chiqadi (exit 0), kill_timeout kutilmaydi", { timeout: 180_000 }, async () => {
  const bola = spawn(process.execPath, [join(import.meta.dirname, "qolip", "yurgiz.mjs"), join(import.meta.dirname, "qolip", "ipc-toxta.ts")], { stdio: ["ignore", "pipe", "pipe", "ipc"] });
  let stdout = "";
  await new Promise<void>((resolve, reject) => {
    bola.once("exit", (k) => { reject(new Error(`bola manzilsiz tugadi (${String(k)})`)); });
    bola.stdout?.setEncoding("utf8").on("data", (d: string) => { stdout += d; if (/http:\/\/127\.0\.0\.1:\d+/.test(stdout)) resolve(); });
  });
  const boshi = performance.now();
  const chiqish = new Promise<number | null>((r) => bola.on("exit", r));
  bola.send("SIGTERM"); // Windows'da kill("SIGTERM") ishlovchisiz o'ldiradi — qolip uni process.emit("SIGTERM") ga aylantiradi
  const kod = await Promise.race([chiqish, new Promise<"osildi">((r) => setTimeout(() => { r("osildi"); }, 10_000))]);
  if (kod === "osildi") bola.kill("SIGKILL");
  assert.equal(kod, 0, `SIGTERM'dan keyin 10 s ichida chiqmadi (${(performance.now() - boshi).toFixed(0)} ms)`);
  assert.match(stdout, /to'xtadi/);
});
