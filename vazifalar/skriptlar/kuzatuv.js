// skriptlar/kuzatuv.js — analitika va xatolarni QABUL QILUVCHI, faqat dev
// server'da (21/#18–#19). Brauzer kodi (src/kuzatuv/) hodisalarni
// navigator.sendBeacon bilan VITE_ANALITIKA_URL / VITE_XATO_URL ga yuboradi;
// dev'da bu manzillar shu plagin — terminalda ko'rinadi, GET /__kuzatuv
// hammasini JSON qilib beradi (testlar va DevTools uchun). Production'da
// (Pages, Vercel) manzil yo'q — hech narsa yuborilmaydi. Tashqi xizmat
// (GA4, PostHog, Sentry) YO'Q: hisob, kalit, DSN kerak emas; o'z serveringiz
// — 25-qismda (shu JSON shaklini qabul qiladigan bitta marshrut)
const ILDIZ = "/__kuzatuv";

/** @returns {import("vite").Plugin} */
export function kuzatuvPlagini() {
  /** @type {{ analitika: unknown[], xatolar: unknown[] }} */
  const xotira = { analitika: [], xatolar: [] };
  return {
    name: "vazifalar-kuzatuv",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, keyingi) => {
        const url = req.url ?? "";
        if (!url.startsWith(ILDIZ)) {
          keyingi();
          return;
        }
        if (req.method === "GET") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(xotira));
          return;
        }
        /** @type {Buffer[]} */
        const bolaklar = [];
        req.on("data", (b) => bolaklar.push(b));
        req.on("end", () => {
          let tana;
          try {
            tana = JSON.parse(Buffer.concat(bolaklar).toString("utf8"));
          } catch {
            res.writeHead(400).end();
            return;
          }
          const tur = url.startsWith(`${ILDIZ}/xato`)
            ? "xatolar"
            : "analitika";
          const royxat = Array.isArray(tana) ? tana : [tana];
          xotira[tur].push(...royxat);
          for (const yozuv of royxat) {
            server.config.logger.info(
              `[${tur}] ${JSON.stringify(yozuv).slice(0, 160)}`,
            );
          }
          res.writeHead(204).end();
        });
      });
    },
  };
}
