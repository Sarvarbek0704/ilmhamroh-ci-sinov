// jarayon.ts — jarayon darajasidagi hodisalar: signal bilan to'xtash va ushlanmagan xatolar ("let it crash").
// Ushlanmagan xatodan keyin jarayon holati NOMA'LUM — davom etish xavfli: log → boshlangan so'rovlarni qisqa kutish → exit 1.
// Qayta ishga tushirishni supervisor qiladi (Docker restart: unless-stopped, systemd, PM2 — 33-qism)
import type { Server } from "node:http";
import { yop } from "./yopish.ts";

export type JarayonLogi = { info: (xabar: string) => void; fatal: (xabar: string, xato: unknown) => void };

/** boshida — server yopilishidan oldin (29-qism B: uzoq ulanishlar — SSE — o'zi tugamaydi, avval ularni yopamiz) */
/** oxirida — server yopilgandan keyin (masalan, pg pool.end(): boshlangan so'rovlar tugagach ulanishlar yopiladi, 26-qism) */
/** kechikishMs (31 #26) — boshida() (readiness 503) dan keyin server.close() gacha: balanser/orkestrator tekshiruv oralig'idan uzunroq bo'lsin (k8s: preStop) */
export function jarayonniBoshqar(server: Server, log: JarayonLogi, { kutishMs = 10_000, halokatKutishMs = 3_000, kechikishMs = 0, boshida = (): void => undefined, oxirida = (): Promise<void> => Promise.resolve() } = {}): void {
  let yopilmoqda = false;

  async function toxta(sabab: string, kod: number, kutish: number): Promise<void> {
    if (yopilmoqda) return;
    yopilmoqda = true;
    log.info(`${sabab}: yangi ulanishlar qabul qilinmaydi, boshlanganlari tugashi kutilmoqda`);
    boshida();
    if (kechikishMs > 0 && kod === 0) await new Promise((ok) => setTimeout(ok, kechikishMs)); // halokatda kutilmaydi
    const ozVaqtida = await yop(server, kutish);
    await oxirida().catch((x: unknown) => { log.fatal("yopishda xato", x); });
    log.info(ozVaqtida ? "to'xtadi" : `${String(kutish)} ms o'tdi — qolgan ulanishlar uzildi`);
    process.exitCode = kod !== 0 ? kod : ozVaqtida ? 0 : 1;
    // 33 #26 (topilma): PM2 (cluster ham, fork ham) bola jarayonni IPC kanali bilan ochadi — kanal ochiq tursa event loop bo'shamaydi va jarayon
    // "to'xtadi" deb yozib ham TIRIK qoladi: PM2 kill_timeout (20 s) dan keyin SIGKILL qildi (2 nusxa → 40 s stop/reload). Kanalni yopamiz
    if (process.connected) process.disconnect();
  }

  function halokat(tur: string, xato: unknown): void {
    log.fatal(tur, xato);
    // Majburiy chiqish: yopish osilib qolsa ham jarayon tugasin (timer jarayonni ushlab turmasin — unref)
    setTimeout(() => process.exit(1), halokatKutishMs + 1000).unref();
    void toxta(tur, 1, halokatKutishMs);
  }

  // Docker/systemd — SIGTERM; terminalda Ctrl+C — SIGINT (Windows'da boshqa jarayondan SIGINT ishlovchini chaqirmaydi — 24-qism #08)
  process.once("SIGTERM", () => void toxta("SIGTERM", 0, kutishMs));
  process.once("SIGINT", () => void toxta("SIGINT", 0, kutishMs));
  // Node 24 sukuti: unhandledRejection → uncaughtException → darhol exit 1 (log va yopishsiz). Ishlovchi qo'shsak — o'zimiz hal qilamiz
  process.on("unhandledRejection", (sabab) => { halokat("unhandledRejection", sabab); });
  process.on("uncaughtException", (xato, kelib) => { halokat(`uncaughtException (${kelib})`, xato); });
}
